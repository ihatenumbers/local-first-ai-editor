<script lang="ts">
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState } from '$lib/state/document.svelte';
	import { Plus, Trash2 } from 'lucide-svelte';

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

	function addContext() {
		documentState.contextItems.push({
			id: crypto.randomUUID(),
			title: 'New Context Item',
			content: ''
		});
	}

	function deleteContext(id: string) {
		documentState.contextItems = documentState.contextItems.filter(c => c.id !== id);
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
			<textarea 
				bind:value={documentState.objectivesText}
				class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white resize-none h-24 focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
				placeholder="Add your writing objectives here - when the scene or document is finished, what will it have achieved?"
			></textarea>
		</div>

		<div>
			<div class="flex items-center justify-between mb-2">
				<h3 class="text-sm font-semibold text-zinc-700">Dynamic Context</h3>
				<button 
					class="p-1 rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
					title="Add Context Item"
					onclick={addContext}
				>
					<Plus size={16} />
				</button>
			</div>

			<div class="space-y-3">
				{#each documentState.contextItems as item (item.id)}
					<div class="bg-white border border-zinc-200 rounded-md p-3 shadow-sm group">
						<div class="flex items-center justify-between mb-2">
							<input 
								type="text" 
								bind:value={item.title}
								class="font-semibold text-sm text-zinc-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none flex-1 truncate placeholder:text-zinc-400"
								placeholder="e.g. Lore, Location, Character"
							/>
							<button 
								class="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-2"
								title="Delete Context"
								onclick={() => deleteContext(item.id)}
							>
								<Trash2 size={14} />
							</button>
						</div>
						<textarea 
							bind:value={item.content}
							class="w-full rounded-md border-zinc-200 text-sm p-2 bg-zinc-50 resize-none h-20 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-zinc-400" 
							placeholder="Enter context details..."
						></textarea>
					</div>
				{/each}

				{#if documentState.contextItems.length === 0}
					<div class="text-center p-4 border border-dashed border-zinc-300 rounded-md text-zinc-500 text-sm">
						No extra context added.
					</div>
				{/if}
			</div>
		</div>

	</div>
</aside>