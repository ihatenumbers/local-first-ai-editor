<script lang="ts">
	import { documentState } from '$lib/state/document.svelte';
	import { uiState } from '$lib/state/ui.svelte';

	let isResizing = $state(false);

	function onPointerDown(e: PointerEvent) {
		isResizing = true;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isResizing) return;
		uiState.reviewPanelWidth -= e.movementX;
	}

	function onPointerUp(e: PointerEvent) {
		isResizing = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	}
</script>

<aside class="flex-col border-l border-zinc-200 bg-zinc-50 flex shrink-0 relative" style="width: {uiState.reviewPanelWidth}px">
	<div 
		role="slider"
		aria-valuenow={uiState.reviewPanelWidth}
		tabindex="0"
		class="absolute left-0 top-0 bottom-0 w-1 -translate-x-1/2 cursor-col-resize z-50 hover:bg-indigo-500/50 transition-colors"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
	></div>

	<div class="p-4 border-b border-zinc-200/60">
		<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500">Review Recipes</h2>
	</div>
	<div class="flex-1 overflow-y-auto p-4 space-y-6">
		
		<div>
			<h3 class="text-sm font-semibold text-zinc-700 mb-2">Active Recipes</h3>
			<textarea class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white font-mono resize-none h-32 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="1. Check for passive voice&#10;2. Analyze sensory details&#10;3. Flag repetitive sentence starts"></textarea>
		</div>

		<div>
			<div class="flex items-center justify-between mb-2">
				<h3 class="text-sm font-semibold text-zinc-700">Scene To-Dos</h3>
				<span class="text-xs font-mono bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-600">{documentState.todoList.length}</span>
			</div>
			<textarea class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white resize-none h-48 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="- Foreshadow the amulet&#10;- Describe the lighting&#10;- Fix dialogue pacing in middle"></textarea>
		</div>

	</div>
</aside>