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
</script>

<main class="flex h-screen w-full overflow-hidden bg-zinc-50 font-sans text-zinc-900">
	{#if documentState.isLoaded}
		{#if uiState.showExplorer}
			<ExplorerPanel />
		{/if}

		<section
			class="relative z-10 flex min-w-[400px] flex-1 flex-col overflow-hidden bg-white shadow-sm"
		>
			<Header />

			{#if uiState.showVersionsPanel}
				<VersionsPanel />
			{/if}

			<div class="w-full flex-1 overflow-y-auto">
				<div class="w-full px-8 py-16 sm:px-12 md:px-16">
					<Tiptap />
				</div>
			</div>
		</section>

		{#if uiState.showReviewPanel}
			<ReviewPanel />
		{/if}

		{#if uiState.activeChatRecipeId}
			<ChatPanel />
		{/if}

		{#if uiState.showContextBoard}
			<ContextPanel />
		{/if}
	{:else}
		<div class="flex h-full w-full items-center justify-center">
			<p class="pb-20 font-medium text-zinc-500">Loading Project...</p>
		</div>
	{/if}

	{#if uiState.showSettings}
		<SettingsModal />
	{/if}
</main>
