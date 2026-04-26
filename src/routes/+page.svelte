<script lang="ts">
	// Svelte 5 Global State
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState } from '$lib/state/document.svelte';

	import Header from '$lib/components/Header.svelte';
	import ExplorerPanel from '$lib/components/ExplorerPanel.svelte';
	import ReviewPanel from '$lib/components/ReviewPanel.svelte';
	import ContextPanel from '$lib/components/ContextPanel.svelte';

	// Placeholder test data setup directly in the store, 
	// overriding default just to maintain the mock UI visually!
	documentState.wordCount = 1245;
	documentState.todoList = ['Foreshadow the amulet', 'Describe the lighting', 'Fix dialogue pacing in middle'];
	documentState.currentChapter = 1;
	documentState.currentScene = 2;
</script>

<main class="flex h-screen w-full overflow-hidden bg-zinc-50 text-zinc-900 font-sans">

	{#if uiState.showExplorer}
		<ExplorerPanel />
	{/if}

	<section class="flex flex-1 flex-col overflow-hidden bg-white relative shadow-sm z-10 min-w-[400px]">
		
		<Header />
		
		<div class="flex-1 overflow-y-auto w-full">
			<div class="mx-auto w-full max-w-2xl px-8 py-16">
				<h1 class="text-4xl font-bold text-zinc-900 mb-8 outline-none" contenteditable="true">The Dark Forest</h1>
				<p class="text-lg text-zinc-700 outline-none leading-relaxed" contenteditable="true">
					The trees loomed like ancient sentinels. <i>(Tiptap will mount here...)</i>
				</p>
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