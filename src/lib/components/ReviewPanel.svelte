<script lang="ts">
	import { documentState } from '$lib/state/document.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { Plus, Trash2 } from 'lucide-svelte';

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

	function addRecipe() {
		documentState.project.reviewRecipes.push({
			id: crypto.randomUUID(),
			title: 'New Review Instructions',
			prompt: '',
			isActive: true
		});
	}

	function deleteRecipe(id: string) {
		documentState.project.reviewRecipes = documentState.project.reviewRecipes.filter(r => r.id !== id);
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
			<div class="flex items-center justify-between mb-2">
				<h3 class="text-sm font-semibold text-zinc-700">Active Recipes</h3>
				<button 
					class="p-1 rounded text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" 
					title="Add Recipe"
					onclick={addRecipe}
				>
					<Plus size={16} />
				</button>
			</div>
			
						<div class="space-y-3">
				{#each documentState.project.reviewRecipes as recipe (recipe.id)}
					<div class="bg-white border border-zinc-200 rounded-md p-3 shadow-sm group">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2 flex-1">
								<input 
									type="checkbox" 
									bind:checked={recipe.isActive}
									class="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
								/>
								<input 
									type="text" 
									bind:value={recipe.title}
									class="font-semibold text-sm text-zinc-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none flex-1 truncate placeholder:text-zinc-400"
									placeholder="Recipe Title"
								/>
							</div>
							<button 
								class="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
								title="Delete Recipe"
								onclick={() => deleteRecipe(recipe.id)}
							>
								<Trash2 size={14} />
							</button>
						</div>
						<textarea 
							bind:value={recipe.prompt}
							class="w-full rounded-md border-zinc-200 text-sm p-2 bg-zinc-50 font-mono resize-none h-20 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-zinc-400" 
							placeholder="Enter AI instruction prompt..."
						></textarea>
					</div>
				{/each}

				{#if documentState.project.reviewRecipes.length === 0}
					<div class="text-center p-4 border border-dashed border-zinc-300 rounded-md text-zinc-500 text-sm">
						No active recipes. Add one to analyze your scene.
					</div>
				{/if}
			</div>
		</div>

		<div>
			<div class="flex items-center justify-between mb-2">
				<h3 class="text-sm font-semibold text-zinc-700">Scene To-Dos</h3>
				<span class="text-xs font-mono bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-600">{documentState.activeScene?.todoList.length || 0}</span>
			</div>
			<textarea class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white resize-none h-48 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="- Foreshadow the amulet&#10;- Describe the lighting&#10;- Fix dialogue pacing in middle"></textarea>
		</div>

	</div>
</aside>