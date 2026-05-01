<script lang="ts">
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState } from '$lib/state/document.svelte';

	import Header from '$lib/components/Header.svelte';
	import ExplorerPanel from '$lib/components/ExplorerPanel.svelte';
	import ReviewPanel from '$lib/components/ReviewPanel.svelte';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import ContextPanel from '$lib/components/ContextPanel.svelte';
	import VersionsPanel from '$lib/components/VersionsPanel.svelte';
	import Tiptap from '$lib/components/Tiptap.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';
	import ImportModal from '$lib/components/ImportModal.svelte';

	// Close panels by default on mobile for a cleaner initial view
	if (typeof window !== 'undefined' && window.innerWidth < 1024) {
		uiState.showExplorer = false;
		uiState.showReviewPanel = false;
		uiState.showContextBoard = false;
	}

	// Auto-close explorer drawer on mobile when a scene is selected
	$effect(() => {
		const id = documentState.activeSceneId;
		if (id && typeof window !== 'undefined' && window.innerWidth < 1024) {
			uiState.showExplorer = false;
		}
	});

	// Lock body scroll on mobile when any drawer is open
	$effect(() => {
		const anyOpen =
			uiState.showExplorer ||
			uiState.showReviewPanel ||
			uiState.showContextBoard ||
			uiState.activeChatRecipeId;
		if (typeof window !== 'undefined' && window.innerWidth < 1024) {
			document.body.style.overflow = anyOpen ? 'hidden' : '';
		}
	});
</script>

<main class="flex h-screen w-full flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900">
	<div class="grid shrink-0 grid-cols-3 items-center border-b border-zinc-200 bg-white px-4 py-2 shadow-sm">
		<div></div>
		<span class="text-center text-xl font-semibold tracking-wide text-blue-800 lg:text-2xl">Local First AI Editor</span>
		<div class="flex justify-end">
			<a
				href="https://github.com/brianlmerritt/local-first-ai-editor/blob/main/DOCUMENTATION.md"
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
			>
				<span class="hidden lg:inline">Documentation</span>
				<span class="lg:hidden">Docs</span>
			</a>
		</div>
	</div>

	<div class="flex min-h-0 flex-1 overflow-hidden">
		{#if documentState.isLoaded}
			<!-- Explorer: desktop=inline left panel, mobile=left drawer -->
			<button
				class="lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 {uiState.showExplorer
					? 'opacity-100'
					: 'opacity-0 pointer-events-none'}"
				onclick={() => (uiState.showExplorer = false)}
				aria-label="Close Explorer"
			></button>
			<div
				class="max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-72 max-lg:shadow-2xl max-lg:flex max-lg:flex-col max-lg:overflow-hidden max-lg:bg-white max-lg:transition-transform max-lg:duration-300 {uiState.showExplorer
					? 'lg:contents max-lg:translate-x-0'
					: 'lg:hidden max-lg:-translate-x-full'}"
			>
				<ExplorerPanel />
			</div>

			<section class="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden bg-white shadow-sm lg:min-w-[400px]">
				<Header />

				{#if uiState.showVersionsPanel}
					<VersionsPanel />
				{/if}

				<div class="w-full flex-1 overflow-y-auto">
					<div class="w-full px-4 py-8 lg:px-8 lg:py-16">
						<Tiptap />
					</div>
				</div>
			</section>

			<!-- ReviewPanel: desktop=inline right panel, mobile=right drawer -->
			<button
				class="lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 {uiState.showReviewPanel
					? 'opacity-100'
					: 'opacity-0 pointer-events-none'}"
				onclick={() => (uiState.showReviewPanel = false)}
				aria-label="Close Review Panel"
			></button>
			<div
				class="max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 max-lg:w-80 max-lg:shadow-2xl max-lg:flex max-lg:flex-col max-lg:overflow-hidden max-lg:bg-white max-lg:transition-transform max-lg:duration-300 {uiState.showReviewPanel
					? 'lg:contents max-lg:translate-x-0'
					: 'lg:hidden max-lg:translate-x-full'}"
			>
				<ReviewPanel />
			</div>

			<!-- ChatPanel: desktop=inline right panel, mobile=right drawer -->
			{#if uiState.activeChatRecipeId}
				<button
					class="lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 opacity-100"
					onclick={() => (uiState.activeChatRecipeId = null)}
					aria-label="Close Chat"
				></button>
				<div
					class="lg:contents max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 max-lg:w-80 max-lg:shadow-2xl max-lg:flex max-lg:flex-col max-lg:overflow-hidden max-lg:bg-white max-lg:transition-transform max-lg:duration-300 max-lg:translate-x-0"
				>
					<ChatPanel />
				</div>
			{/if}

			<!-- ContextPanel: desktop=inline right panel, mobile=right drawer -->
			<button
				class="lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 {uiState.showContextBoard
					? 'opacity-100'
					: 'opacity-0 pointer-events-none'}"
				onclick={() => (uiState.showContextBoard = false)}
				aria-label="Close Context Board"
			></button>
			<div
				class="max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 max-lg:w-80 max-lg:shadow-2xl max-lg:flex max-lg:flex-col max-lg:overflow-hidden max-lg:bg-white max-lg:transition-transform max-lg:duration-300 {uiState.showContextBoard
					? 'lg:contents max-lg:translate-x-0'
					: 'lg:hidden max-lg:translate-x-full'}"
			>
				<ContextPanel />
			</div>
		{:else}
			<div class="flex h-full w-full items-center justify-center">
				<p class="pb-20 font-medium text-zinc-500">Loading Project...</p>
			</div>
		{/if}

		{#if uiState.showSettings}
			<SettingsModal />
		{/if}

		{#if uiState.showExportModal}
			<ExportModal />
		{/if}

		{#if uiState.showImportModal}
			<ImportModal />
		{/if}
	</div>
</main>
