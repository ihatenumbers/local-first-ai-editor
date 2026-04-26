<script lang="ts">
	import { documentState } from '$lib/state/document.svelte';
	import { ChevronRight, ChevronDown, GripVertical, Trash2 } from 'lucide-svelte';

	let expandedChapters = $state<Record<number, boolean>>({});
	let sceneToDelete = $state<string | null>(null);

	function toggleChapter(ch: number) {
		expandedChapters[ch] = expandedChapters[ch] === undefined ? false : !expandedChapters[ch];
	}

	function isExpanded(ch: number) {
		return expandedChapters[ch] !== false;
	}

	let chapters = $derived.by(() => {
		const groups = new Map<number, typeof documentState.project.scenes>();
		documentState.project.scenes.forEach(scene => {
			if (!groups.has(scene.chapterNumber)) {
				groups.set(scene.chapterNumber, []);
			}
			groups.get(scene.chapterNumber)!.push(scene);
		});
		
		return Array.from(groups.entries()).map(([chapterNumber, scenes]) => ({
			chapterNumber,
			scenes: scenes.sort((a, b) => a.sceneNumber - b.sceneNumber)
		})).sort((a, b) => a.chapterNumber - b.chapterNumber);
	});

	let dragData = $state<{ type: 'chapter' | 'scene', id: number | string } | null>(null);
	let dragHoverId = $state<number | string | null>(null);

	function onDragStart(e: DragEvent, type: 'chapter' | 'scene', id: number | string) {
		dragData = { type, id };
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
		}
	}

	function onDragOver(e: DragEvent, type: 'chapter' | 'scene', id: number | string) {
		e.preventDefault();
		if (e.dataTransfer && dragData) {
			e.dataTransfer.dropEffect = 'move';
			dragHoverId = id;
		}
	}

	function onDragLeave(e: DragEvent) {
		dragHoverId = null;
	}

	function handleDropChapter(e: DragEvent, targetChapterNumber: number) {
		e.preventDefault();
		dragHoverId = null;
		const currentDrag = dragData;
		if (!currentDrag) return;

		let newScenes = [...documentState.project.scenes];

		if (currentDrag.type === 'chapter') {
			if (currentDrag.id === targetChapterNumber) return; // same chapter

			const draggedScenes = newScenes.filter(s => s.chapterNumber === currentDrag.id);
			const otherScenes = newScenes.filter(s => s.chapterNumber !== currentDrag.id);

			const targetIdx = otherScenes.findIndex(s => s.chapterNumber === targetChapterNumber);
			if (targetIdx !== -1) {
				otherScenes.splice(targetIdx, 0, ...draggedScenes);
			} else {
				otherScenes.push(...draggedScenes);
			}
			newScenes = otherScenes;
		} else if (currentDrag.type === 'scene') {
			const sourceIdx = newScenes.findIndex(s => s.id === currentDrag.id);
			if (sourceIdx !== -1) {
				const [movedScene] = newScenes.splice(sourceIdx, 1);
				movedScene.chapterNumber = targetChapterNumber;
				
				const targetChapScenes = newScenes.filter(s => s.chapterNumber === targetChapterNumber);
				if (targetChapScenes.length > 0) {
					const lastSceneInChap = targetChapScenes[targetChapScenes.length - 1];
					const targetIdx = newScenes.indexOf(lastSceneInChap);
					newScenes.splice(targetIdx + 1, 0, movedScene);
				} else {
					newScenes.push(movedScene);
				}
			}
		}

		documentState.project.scenes = newScenes;
		recalculateNumbering();
		dragData = null;
	}

	function handleDropScene(e: DragEvent, targetSceneId: string, targetChapterNumber: number) {
		e.preventDefault();
		e.stopPropagation();
		dragHoverId = null;
		const currentDrag = dragData;
		if (!currentDrag) return;

		let newScenes = [...documentState.project.scenes];

		if (currentDrag.type === 'scene') {
			if (currentDrag.id === targetSceneId) return;

			const sourceIdx = newScenes.findIndex(s => s.id === currentDrag.id);
			const targetIdx = newScenes.findIndex(s => s.id === targetSceneId);
			if (sourceIdx !== -1 && targetIdx !== -1) {
				const [movedScene] = newScenes.splice(sourceIdx, 1);
				movedScene.chapterNumber = targetChapterNumber;
				const finalTargetIdx = newScenes.findIndex(s => s.id === targetSceneId);
				newScenes.splice(finalTargetIdx, 0, movedScene);
			}
		} else if (currentDrag.type === 'chapter') {
			const draggedScenes = newScenes.filter(s => s.chapterNumber === currentDrag.id);
			const otherScenes = newScenes.filter(s => s.chapterNumber !== currentDrag.id);

			const targetIdx = otherScenes.findIndex(s => s.id === targetSceneId);
			if (targetIdx !== -1) {
				otherScenes.splice(targetIdx, 0, ...draggedScenes);
			} else {
				otherScenes.push(...draggedScenes);
			}
			newScenes = otherScenes;
		}

		documentState.project.scenes = newScenes;
		recalculateNumbering();
		dragData = null;
	}

	function recalculateNumbering() {
		let currentChapter = 0;
		let currentScene = 0;
		let lastOrigChapter = -1;

		documentState.project.scenes.forEach(scene => {
			if (scene.chapterNumber !== lastOrigChapter) {
				currentChapter++;
				currentScene = 1;
				lastOrigChapter = scene.chapterNumber;
			} else {
				currentScene++;
			}
			scene.chapterNumber = currentChapter;
			scene.sceneNumber = currentScene;
		});
	}

	function deleteScene(id: string) {
		documentState.project.scenes = documentState.project.scenes.filter(s => s.id !== id);
		if (documentState.activeSceneId === id) {
			documentState.activeSceneId = documentState.project.scenes[0]?.id ?? null;
		}
		sceneToDelete = null;
		recalculateNumbering();
	}

	
let showCreateModal = $state(false);
let createModalType = $state<'chapter' | 'scene'>('scene');
let copyRecipes = $state(true);
let copyContext = $state(true);

function openCreateModal(type: 'chapter' | 'scene') {
createModalType = type;
showCreateModal = true;
}

function cancelCreate() {
showCreateModal = false;
}

function confirmCreate() {
showCreateModal = false;
if (createModalType === 'scene') {
executeAddScene();
} else {
executeAddChapter();
}
}

function getCopiedData() {
const currentScene = documentState.activeScene;

return {
                        recipes: copyRecipes && currentScene ? currentScene.reviewRecipes.map(r => ({ ...r, id: crypto.randomUUID() })) : [],
                        context: copyContext && currentScene ? currentScene.contextItems.map(c => ({ ...c, id: crypto.randomUUID() })) : [],
        };
}

function executeAddScene() {
        const currentChapter = documentState.activeScene?.chapterNumber || 1;
const scenesInChapter = documentState.project.scenes.filter(s => s.chapterNumber === currentChapter);
const newSceneNumber = scenesInChapter.length > 0 
? Math.max(...scenesInChapter.map(s => s.sceneNumber)) + 1 
: 1;

const id = crypto.randomUUID();
const { recipes, context } = getCopiedData();

documentState.project.scenes.push({
id,
chapterNumber: currentChapter,
sceneNumber: newSceneNumber,
title: `Scene ${newSceneNumber}`,
content: '',
objectivesText: '',
todoList: [],
reviewRecipes: recipes,
contextItems: context,
wordCount: 0
});

documentState.activeSceneId = id;
expandedChapters[currentChapter] = true;
}

function executeAddChapter() {
const newChapterNumber = documentState.project.scenes.length > 0
? Math.max(...documentState.project.scenes.map(s => s.chapterNumber)) + 1
: 1;

const id = crypto.randomUUID();
const { recipes, context } = getCopiedData();

documentState.project.scenes.push({
id,
chapterNumber: newChapterNumber,
sceneNumber: 1,
title: `Scene 1`,
content: '',
objectivesText: '',
todoList: [],
reviewRecipes: recipes,
contextItems: context,
wordCount: 0
});

documentState.activeSceneId = id;
expandedChapters[newChapterNumber] = true;
}

	
</script>

<aside class="w-64 flex-col border-r border-zinc-200 bg-zinc-100/50 flex shrink-0 transition-all h-full">
	<div class="p-4 border-b border-zinc-200/60 flex items-center justify-between">
		<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500">Explorer</h2>
		<div class="flex gap-3">
			<button 
				onclick={() => openCreateModal("chapter")}
				class="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
				title="Add Chapter"
			>
				+ Ch
			</button>
			<button 
				onclick={() => openCreateModal("scene")}
				class="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
				title="Add Scene"
			>
				+ Sc
			</button>
		</div>
	</div>
	
	<div class="flex-1 overflow-y-auto p-4 space-y-2">
		{#each chapters as ch}
			<div 
				role="region"
				class="group mb-4"
				ondragover={(e) => onDragOver(e, 'chapter', ch.chapterNumber)}
				ondragleave={onDragLeave}
				ondrop={(e) => handleDropChapter(e, ch.chapterNumber)}
			>
				<div class="flex items-center gap-1 mb-1 {dragHoverId === ch.chapterNumber ? 'border-t-2 border-indigo-500 rounded-t' : ''}">
					<!-- Chapter Handle -->
					<div 
						role="button"
						tabindex="0"
						draggable="true"
						ondragstart={(e) => onDragStart(e, 'chapter', ch.chapterNumber)}
						class="cursor-grab hover:bg-zinc-200 p-1 rounded-md text-zinc-400 transition-colors"
						title="Drag Chapter"
					>
						<GripVertical size={14} />
					</div>
					
					<button 
						class="flex-1 flex items-center gap-1 text-sm font-bold text-zinc-700 hover:text-zinc-900"
						onclick={() => toggleChapter(ch.chapterNumber)}
					>
						{#if isExpanded(ch.chapterNumber)}
							<ChevronDown size={16} />
						{:else}
							<ChevronRight size={16} />
						{/if}
						Chapter {ch.chapterNumber}
					</button>
				</div>

				{#if isExpanded(ch.chapterNumber)}
					<div class="space-y-1 ml-6 border-l-2 border-zinc-200/60 pl-2">
						{#each ch.scenes as scene (scene.id)}
							{#if sceneToDelete === scene.id}
								<div class="flex items-center gap-2 p-2 bg-red-50 text-red-900 rounded-md text-xs border border-red-200">
									<span class="font-medium">Delete scene?</span>
									<div class="flex-1"></div>
									<button onclick={() => deleteScene(scene.id)} class="font-bold px-2 rounded hover:bg-red-200 transition-colors">Yes</button>
									<button onclick={() => sceneToDelete = null} class="text-zinc-500 hover:text-zinc-900 transition-colors">No</button>
								</div>
							{:else}
								<div 
									role="region"
									class="flex items-center group/scene rounded-md transition-colors {documentState.activeSceneId === scene.id ? 'bg-indigo-50 text-indigo-900 border border-indigo-100' : 'hover:bg-zinc-200/50'} {dragHoverId === scene.id ? 'border-t-2 border-indigo-500 rounded-t' : ''}"
									ondragover={(e) => onDragOver(e, 'scene', scene.id)}
									ondragleave={onDragLeave}
									ondrop={(e) => handleDropScene(e, scene.id, ch.chapterNumber)}
								>
									<!-- Scene Handle -->
									<div 
										role="button"
										tabindex="0"
										draggable="true"
										ondragstart={(e) => onDragStart(e, 'scene', scene.id)}
										class="cursor-grab p-1.5 text-zinc-300 hover:text-zinc-500 opacity-0 group-hover/scene:opacity-100 transition-opacity"
										title="Drag Scene"
									>
										<GripVertical size={14} />
									</div>

									<button 
										class="flex-1 text-left py-2 pr-2 overflow-hidden flex flex-col"
										onclick={() => documentState.activeSceneId = scene.id}
									>
										<span class="text-sm font-medium text-zinc-600 truncate block w-full">{scene.title}</span>
										{#if documentState.activeSceneId === scene.id}
											<span class="mt-0.5 text-xs text-indigo-500/80">{scene.wordCount} words</span>
										{/if}
									</button>

									<!-- Delete Scene Button -->
									<button
										onclick={() => sceneToDelete = scene.id}
										class="p-1.5 text-zinc-300 hover:text-red-500 opacity-0 group-hover/scene:opacity-100 transition-all mr-1"
										title="Delete Scene"
									>
										<Trash2 size={14} />
									</button>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</aside>
{#if showCreateModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
<div class="bg-white p-6 rounded-lg shadow-xl w-80 text-left border border-zinc-200">
<h3 class="font-bold text-lg mb-2 text-zinc-800">Add {createModalType === 'scene' ? 'Scene' : 'Chapter'}</h3>
<p class="text-sm text-zinc-500 mb-5">Would you like to copy settings from the current scene?</p>

<label class="flex items-center gap-3 mb-3 text-sm text-zinc-700 font-medium cursor-pointer">
<input type="checkbox" bind:checked={copyRecipes} class="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
Copy Active Review Recipes
</label>

<label class="flex items-center gap-3 mb-6 text-sm text-zinc-700 font-medium cursor-pointer">
<input type="checkbox" bind:checked={copyContext} class="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
Copy Context Board
</label>

<div class="flex justify-end gap-2 pt-2 border-t border-zinc-100">
<button class="px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 rounded-md transition-colors" onclick={cancelCreate}>Cancel</button>
<button class="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm" onclick={confirmCreate}>Create</button>
</div>
</div>
</div>
{/if}
