<script lang="ts">
	import { uiState } from '$lib/state/ui.svelte';

	let isResizing = $state(false);

	function onPointerDown(e: PointerEvent) {
		isResizing = true;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isResizing) return;
		uiState.contextPanelWidth -= e.movementX;
		if (uiState.showReviewPanel) {
			uiState.reviewPanelWidth += e.movementX;
		}
	}

	function onPointerUp(e: PointerEvent) {
		isResizing = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	}
</script>

<aside class="flex-col border-l border-zinc-200 bg-zinc-100/50 flex shrink-0 relative" style="width: {uiState.contextPanelWidth}px">
	<div 
		role="slider"
		aria-valuenow={uiState.contextPanelWidth}
		tabindex="0"
		class="absolute left-0 top-0 bottom-0 w-1 -translate-x-1/2 cursor-col-resize z-50 hover:bg-indigo-500/50 transition-colors"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
	></div>
	
	<div class="p-4 border-b border-zinc-200/60">
		<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500">Context Board</h2>
	</div>
	<div class="flex-1 overflow-y-auto p-4 space-y-6">
		
		<div>
			<h3 class="text-sm font-semibold text-zinc-700 mb-2">Writing Objectives</h3>
			<textarea class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white resize-none h-24 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="Establish the tension between the two leads. Raise the stakes for the next chapter."></textarea>
		</div>

		<div>
			<h3 class="text-sm font-semibold text-zinc-700 mb-2">Characters in Scene</h3>
			<textarea class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white resize-none h-24 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="Elara: Nervous, hiding a secret.&#10;Kael: Suspicious, pressing for answers."></textarea>
		</div>

		<div>
			<h3 class="text-sm font-semibold text-zinc-700 mb-2">Location Data</h3>
			<textarea class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white resize-none h-24 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="The Whispering Tavern: Smells of stale ale and woodsmoke. Crowded."></textarea>
		</div>

	</div>
</aside>