/**
 * aiClient.ts
 *
 * Tries the SvelteKit server-side proxy (/api/ai/review) first.
 * If that route returns 404 (i.e. the app is deployed on pure static hosting),
 * it falls back to calling the AI provider directly from the browser.
 *
 * All supported providers (OpenAI, OpenRouter, Ollama, any OpenAI-compatible
 * endpoint) accept browser-direct fetch calls, so no CORS issues arise.
 * Native Anthropic is routed through OpenRouter and therefore also uses
 * the OpenAI-compatible format.
 *
 * The fallback normalises the upstream SSE stream to the same plain-text
 * chunk format that the proxy emits, so downstream consumers (ReviewPanel,
 * ChatPanel) require no changes beyond swapping `fetch(...)` for `callAI(...)`.
 */

export interface AICallParams {
	baseUrl: string;
	apiKey: string;
	providerType: string;
	model: string;
	systemPrompt: string;
	userPrompt?: string;
	messages?: { role: string; content: string }[];
	responseFormat: string;
	temperature?: number;
	maxTokens?: number;
}

/** Cached result of proxy availability. null = not yet checked. */
let proxyAvailable: boolean | null = null;

// ─── OpenAI-format direct call ────────────────────────────────────────────────

function buildOpenAIBody(params: AICallParams): Record<string, unknown> {
	const chatMessages = params.messages
		? [{ role: 'system', content: params.systemPrompt }, ...params.messages]
		: [{ role: 'system', content: params.systemPrompt }, { role: 'user', content: params.userPrompt }];

	const body: Record<string, unknown> = {
		model: params.model,
		messages: chatMessages,
		stream: true,
		temperature: params.temperature ?? 0.3
	};

	if (params.maxTokens) body.max_tokens = params.maxTokens;

	if (params.responseFormat === 'lints' || params.responseFormat === 'todos') {
		body.response_format = { type: 'json_object' };
	}

	return body;
}

/**
 * Wraps an upstream OpenAI SSE ReadableStream and emits plain text chunks,
 * matching what the server proxy emits.
 */
function openAIStreamToText(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	return new ReadableStream<Uint8Array>({
		async start(controller) {
			const reader = upstream.getReader();
			let buffer = '';

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop() ?? '';

					for (const line of lines) {
						if (!line.startsWith('data:')) continue;
						const data = line.replace(/^data:\s*/, '');
						if (data === '[DONE]') continue;

						try {
							const parsed = JSON.parse(data);
							const chunk: string = parsed.choices?.[0]?.delta?.content ?? '';
							if (chunk) controller.enqueue(encoder.encode(chunk));
						} catch {
							// Malformed SSE chunk — skip
						}
					}
				}
			} finally {
				controller.close();
			}
		}
	});
}

/**
 * Calls the AI provider directly from the browser (bypassing the server proxy).
 * Returns a Response whose body streams plain text chunks.
 */
async function callDirect(params: AICallParams): Promise<Response> {
	const url = `${params.baseUrl.replace(/\/$/, '')}/chat/completions`;
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (params.apiKey) headers['Authorization'] = `Bearer ${params.apiKey}`;

	const upstream = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(buildOpenAIBody(params))
	});

	if (!upstream.ok) {
		const details = await upstream.text();
		return new Response(
			JSON.stringify({ error: `Upstream failed: ${upstream.statusText}`, details }),
			{ status: upstream.status, headers: { 'Content-Type': 'application/json' } }
		);
	}

	return new Response(openAIStreamToText(upstream.body!), { status: 200 });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calls the AI. Uses the server proxy when available; falls back to a direct
 * browser fetch when the proxy returns 404 (static hosting).
 */
export async function callAI(params: AICallParams): Promise<Response> {
	if (proxyAvailable === false) {
		return callDirect(params);
	}

	const res = await fetch('/api/ai/review', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(params)
	});

	if (res.status === 404) {
		proxyAvailable = false;
		return callDirect(params);
	}

	proxyAvailable = true;
	return res;
}
