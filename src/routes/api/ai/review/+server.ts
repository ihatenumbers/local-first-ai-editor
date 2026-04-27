import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function POST({ request, fetch }: RequestEvent) {
    try {
        const body = await request.json();
        const { baseUrl, apiKey, providerType, model, systemPrompt, userPrompt, responseFormat } = body;

        if (!baseUrl || !model || !systemPrompt || !userPrompt) {
            return json({ error: 'Missing required parameters' }, { status: 400 });
        }

        let upstreamUrl = '';
        let headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        let upstreamBody: any = {};

        if (providerType === 'openai' || providerType === 'local') {
            upstreamUrl = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            upstreamBody = {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: true,
                temperature: 0.3
            };

            // Only OpenAI API currently supports response_format strictly in all models,
            // but we'll include it if requested and let local endpoints ignore or use it.
            if (responseFormat === 'lints' || responseFormat === 'todos') {
                upstreamBody.response_format = { type: 'json_object' };
            }

        } else if (providerType === 'anthropic') {
            upstreamUrl = `${baseUrl.replace(/\/$/, '')}/messages`;
            if (apiKey) {
                headers['x-api-key'] = apiKey;
            }
            headers['anthropic-version'] = '2023-06-01';
            
            upstreamBody = {
                model: model,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
                stream: true,
                max_tokens: 4096,
                temperature: 0.3
            };
            // Anthropic doesn't have an explicit JSON mode flag in the same way, but it works by prompting.
        } else {
            return json({ error: 'Unsupported provider type' }, { status: 400 });
        }

        const response = await fetch(upstreamUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(upstreamBody)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Upstream API error:', response.status, err);
            return json({ error: `Upstream failed: ${response.statusText}`, details: err }, { status: response.status });
        }

        // Stream normalization
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                const decoder = new TextDecoder('utf-8');
                const encoder = new TextEncoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.trim() === '') continue;
                            if (line.startsWith('data:')) {
                                const data = line.replace(/^data:\s*/, '');
                                if (data === '[DONE]') continue;

                                try {
                                    const parsed = JSON.parse(data);
                                    let chunkText = '';

                                    if (providerType === 'openai' || providerType === 'local') {
                                        chunkText = parsed.choices?.[0]?.delta?.content || '';
                                    } else if (providerType === 'anthropic') {
                                        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                                            chunkText = parsed.delta.text || '';
                                        }
                                    }

                                    if (chunkText) {
                                        // Just send raw text bytes to the client to make it easier to compose
                                        controller.enqueue(encoder.encode(chunkText));
                                    }
                                } catch (e) {
                                    console.warn('Could not parse SSE JSON', data);
                                }
                            }
                        }
                    }
                    
                    // Process remaining buffer
                    if (buffer.startsWith('data:')) {
                        const data = buffer.replace(/^data:\s*/, '');
                        if (data !== '[DONE]') {
                            try {
                                const parsed = JSON.parse(data);
                                let chunkText = '';
                                if (providerType === 'openai' || providerType === 'local') {
                                    chunkText = parsed.choices?.[0]?.delta?.content || '';
                                } else if (providerType === 'anthropic') {
                                    if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                                        chunkText = parsed.delta.text || '';
                                    }
                                }
                                if (chunkText) {
                                    controller.enqueue(encoder.encode(chunkText));
                                }
                            } catch (e) {}
                        }
                    }
                } finally {
                    reader.releaseLock();
                    controller.close();
                }
            }
        });

        // Return a basic text stream (no longer SSE, just raw readable stream of content chunks)
        // This is much easier to parse on the client side without a dedicated SSE parser.
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (e: any) {
        console.error('Server error during AI request:', e);
        return json({ error: 'Internal Server Error', details: e.message }, { status: 500 });
    }
}
