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
		if (documentState.activeVersion) {
			documentState.activeVersion.contextItems.push({
				id: crypto.randomUUID(),
				title: 'New Context Item',
				content: ''
			});
		}
	}

	function deleteContext(id: string) {
		if (documentState.activeVersion) {
			documentState.activeVersion.contextItems = documentState.activeVersion.contextItems.filter(
				(c) => c.id !== id
			);
		}
	}
</script>

<aside
	class="relative flex shrink-0 flex-col border-l border-zinc-200 bg-zinc-100/50"
	style="width: {uiState.contextPanelWidth}px"
>
	<div
		role="slider"
		aria-valuenow={uiState.contextPanelWidth}
		tabindex="0"
		class="absolute top-0 bottom-0 left-0 z-50 w-1 -translate-x-1/2 cursor-col-resize transition-colors hover:bg-indigo-500/50"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
	></div>

	<div class="border-b border-zinc-200/60 p-4">
		<h2 class="text-xs font-bold tracking-wider text-zinc-500 uppercase">Context Board</h2>
	</div>
	<div class="flex-1 space-y-6 overflow-y-auto p-4">
		<div>
			<h3 class="mb-2 text-sm font-semibold text-zinc-700">Writing Objectives</h3>
			{#if documentState.activeVersion}
				<textarea
					bind:value={documentState.activeVersion.objectivesText}
					class="h-24 w-full resize-y rounded-md border-zinc-300 bg-white p-2 text-sm shadow-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					placeholder="Add your writing objectives here - when the scene or document is finished, what will it have achieved?"
				></textarea>
			{:else}
				<div class="rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-500 italic">
					Select a scene to set objectives.
				</div>
			{/if}
		</div>

		<div>
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-semibold text-zinc-700">Dynamic Context</h3>
				<button
					class="rounded p-1 text-zinc-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
					title="Add Context Item"
					onclick={addContext}
				>
					<Plus size={16} />
				</button>
			</div>

			<div class="space-y-3">
				{#each documentState.activeVersion?.contextItems || [] as item (item.id)}
					<div class="group rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
						<div class="mb-2 flex items-center justify-between">
							<input
								type="text"
								bind:value={item.title}
								class="flex-1 truncate border-none bg-transparent p-0 text-sm font-semibold text-zinc-800 placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
								placeholder="e.g. Lore, Location, Character"
							/>
							<button
								class="ml-2 text-zinc-300 opacity-0 transition-colors group-hover:opacity-100 hover:text-red-500"
								title="Delete Context"
								onclick={() => deleteContext(item.id)}
							>
								<Trash2 size={14} />
							</button>
						</div>
						<textarea
							bind:value={item.content}
							class="h-20 w-full resize-y rounded-md border-zinc-200 bg-zinc-50 p-2 text-sm placeholder:text-zinc-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
							placeholder="Enter context details..."
						></textarea>
					</div>
				{/each}

				{#if (documentState.activeVersion?.contextItems || []).length === 0}
					<div
						class="rounded-md border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500"
					>
						No extra context added.
					</div>
				{/if}
			</div>
		</div>
	</div>
</aside>
