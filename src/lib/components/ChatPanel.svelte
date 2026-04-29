<script lang="ts">
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState, type ChatMessage } from '$lib/state/document.svelte';
	import { settingsState } from '$lib/state/settings.svelte';
	import { buildChatSystemPrompt } from '$lib/utils/contextAssembler';
	import { callAI } from '$lib/utils/aiClient';
	import { Send, X, Trash2 } from 'lucide-svelte';

	const CHAT_SYSTEM_PROMPT = `You are an expert writing assistant and editor working with a novelist on their manuscript. You have access to the current scene text, writing objectives, and story context provided below. Provide thoughtful, specific, and constructive feedback. Reference the actual text when making suggestions. Be concise unless depth is needed.`;

	let inputText = $state('');
	let selectedTier = $state<'fast' | 'balanced' | 'deep'>('balanced');
	let isGenerating = $state(false);
	let messagesContainer: HTMLElement | undefined = $state();
	let isResizing = $state(false);

	const activeRecipe = $derived(
		documentState.activeVersion?.reviewRecipes.find((r) => r.id === uiState.activeChatRecipeId)
	);

	function onPointerDown(e: PointerEvent) {
		isResizing = true;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isResizing) return;
		uiState.chatPanelWidth = Math.max(280, Math.min(700, uiState.chatPanelWidth - e.movementX));
	}

	function onPointerUp() {
		isResizing = false;
	}

	async function sendMessage() {
		if (!inputText.trim() || isGenerating || !activeRecipe || !documentState.activeVersion) return;

		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content: inputText.trim(),
			timestamp: Date.now()
		};

		if (!activeRecipe.chatHistory) activeRecipe.chatHistory = [];
		activeRecipe.chatHistory.push(userMessage);

		const assistantMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: '',
			timestamp: Date.now()
		};
		activeRecipe.chatHistory.push(assistantMessage);

		inputText = '';

		const tierConfig = settingsState.tiers[selectedTier];
		if (!tierConfig?.modelId) {
			// Write error through the reactive array, not the local variable
			activeRecipe.chatHistory[activeRecipe.chatHistory.length - 1].content =
				`Error: No model configured for tier "${selectedTier}". Configure it in Settings.`;
			return;
		}

		const profile = settingsState.profiles.find((p) => p.id === tierConfig.providerId);
		if (!profile) {
			activeRecipe.chatHistory[activeRecipe.chatHistory.length - 1].content =
				'Error: Provider profile not found. Check Settings.';
			return;
		}

		isGenerating = true;

		const liveText = uiState.editorInstance?.getText() ?? undefined;
		const systemPrompt = buildChatSystemPrompt(
			CHAT_SYSTEM_PROMPT,
			documentState.activeVersion!,
			documentState.project,
			liveText
		);

		// Build conversation history excluding the empty assistant placeholder at the end
		const historyMessages = activeRecipe.chatHistory
			.slice(0, -1)
			.map((m) => ({ role: m.role, content: m.content }));

		if (settingsState.debugAiCalls) {
			console.log('=== CHAT REQUEST START ===');
			console.log('Tier:', selectedTier, '| Model:', tierConfig.modelId);
			console.log('System Prompt:\n', systemPrompt);
			console.log('Messages:\n', historyMessages);
		}

		try {
const res = await callAI({
                                        baseUrl: profile.baseUrl,
                                        apiKey: profile.apiKey,
                                        providerType: profile.type,
                                        model: tierConfig.modelId,
                                        systemPrompt,
                                        messages: historyMessages,
                                        responseFormat: 'text',
                                        temperature: activeRecipe.temperature ?? 0.7,
                                        maxTokens: activeRecipe.maxTokens ?? undefined
                                });

			if (!res.ok) {
				const err = await res.json().catch(() => ({ error: res.statusText }));
				activeRecipe.chatHistory[activeRecipe.chatHistory.length - 1].content =
					`Error: ${err.error || res.statusText}`;
				isGenerating = false;
				return;
			}

			const reader = res.body?.getReader();
			if (!reader) throw new Error('No response stream');
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				// Update through the reactive array so Svelte tracks the mutation
				const assistantIdx = activeRecipe.chatHistory.length - 1;
				activeRecipe.chatHistory[assistantIdx].content += decoder.decode(value, { stream: true });
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}

			if (settingsState.debugAiCalls) {
				console.log('=== CHAT RESPONSE END ===');
				console.log('Response:\n', activeRecipe.chatHistory[activeRecipe.chatHistory.length - 1].content);
			}
		} catch (e: any) {
			activeRecipe.chatHistory[activeRecipe.chatHistory.length - 1].content = `Error: ${e.message}`;
		} finally {
			isGenerating = false;
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function clearHistory() {
		if (activeRecipe) activeRecipe.chatHistory = [];
	}
</script>

<aside
	class="relative flex shrink-0 flex-col border-l border-zinc-200 bg-white"
	style="width: {uiState.chatPanelWidth}px"
>
	<!-- Resize handle -->
	<div
		role="slider"
		aria-valuenow={uiState.chatPanelWidth}
		tabindex="0"
		class="absolute top-0 bottom-0 left-0 z-50 w-1 -translate-x-1/2 cursor-col-resize transition-colors hover:bg-indigo-500/50"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
	></div>

	<!-- Header -->
	<div class="flex shrink-0 items-center justify-between border-b border-zinc-200/60 p-4">
		<div class="min-w-0">
			<h2 class="text-xs font-bold tracking-wider text-zinc-500 uppercase">AI Chat</h2>
			{#if activeRecipe}
				<p class="mt-0.5 truncate text-sm font-semibold text-zinc-800">{activeRecipe.title}</p>
			{/if}
		</div>
		<div class="flex items-center gap-1">
			{#if activeRecipe?.chatHistory?.length}
				<button
					class="rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
					onclick={clearHistory}
					title="Clear chat history"
				>
					<Trash2 size={14} />
				</button>
			{/if}
			<button
				class="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
				onclick={() => (uiState.activeChatRecipeId = null)}
				title="Close Chat"
			>
				<X size={16} />
			</button>
		</div>
	</div>

	<!-- Messages -->
	<div class="flex-1 space-y-3 overflow-y-auto p-4" bind:this={messagesContainer}>
		{#if !activeRecipe?.chatHistory?.length}
			<p class="py-8 text-center text-xs text-zinc-400 italic">
				No messages yet.<br />Ask anything about your scene.
			</p>
		{:else}
			{#each activeRecipe.chatHistory as message (message.id)}
				{#if message.role === 'user'}
					<div class="flex justify-end">
						<div
							class="max-w-[85%] rounded-xl rounded-tr-sm bg-indigo-600 px-3 py-2 text-sm text-white"
						>
							{message.content}
						</div>
					</div>
				{:else}
					<div class="flex justify-start">
						<div
							class="max-w-[85%] rounded-xl rounded-tl-sm border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 whitespace-pre-wrap"
						>
							{#if !message.content && isGenerating}
								<span class="animate-pulse text-zinc-400">Thinking...</span>
							{:else}
								{message.content}{#if isGenerating && message === activeRecipe.chatHistory[activeRecipe.chatHistory.length - 1]}<span
										class="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-indigo-500"
									></span>{/if}
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	<!-- Input area -->
	<div class="shrink-0 border-t border-zinc-200 p-3">
		<div class="mb-2 flex items-center justify-between">
			<select
				bind:value={selectedTier}
				class="rounded border border-zinc-200 bg-zinc-50 p-1 text-[10px] font-medium text-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500"
			>
				<option value="fast">Tier: Fast</option>
				<option value="balanced">Tier: Balanced</option>
				<option value="deep">Tier: Deep</option>
			</select>
			<span class="text-[10px] text-zinc-400">Enter to send · Shift+Enter for newline</span>
		</div>
		<div class="flex items-end gap-2">
			<textarea
				bind:value={inputText}
				onkeydown={handleKeydown}
				placeholder="Ask about your scene..."
				rows="2"
				class="max-h-32 flex-1 resize-none rounded-md border border-zinc-200 bg-zinc-50 p-2 text-sm placeholder:text-zinc-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
				disabled={isGenerating}
			></textarea>
			<button
				onclick={sendMessage}
				disabled={isGenerating || !inputText.trim()}
				class="rounded-md bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
				title="Send"
			>
				<Send size={16} />
			</button>
		</div>
	</div>
</aside>
