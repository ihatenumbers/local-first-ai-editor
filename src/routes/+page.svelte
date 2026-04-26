<script lang="ts">
	// Svelte 5 Global State
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState } from '$lib/state/document.svelte';

	import Header from '$lib/components/Header.svelte';
	import ExplorerPanel from '$lib/components/ExplorerPanel.svelte';
	import ReviewPanel from '$lib/components/ReviewPanel.svelte';
	import ContextPanel from '$lib/components/ContextPanel.svelte';
	import Tiptap from '$lib/components/Tiptap.svelte';

</script>

<main class="flex h-screen w-full overflow-hidden bg-zinc-50 text-zinc-900 font-sans">

	{#if uiState.showExplorer}
		<ExplorerPanel />
	{/if}

	<section class="flex flex-1 flex-col overflow-hidden bg-white relative shadow-sm z-10 min-w-[400px]">
		
		<Header />
		
		<div class="flex-1 overflow-y-auto w-full">
			<div class="w-full px-8 sm:px-12 md:px-16 py-16">
				<Tiptap />
			</div>
		</div>
	</section>

	{#if uiState.showReviewPanel}
		<ReviewPanel />
	{/if}

	{#if uiState.showContextBoard}
		<ContextPanel />
	{/if}

</main>