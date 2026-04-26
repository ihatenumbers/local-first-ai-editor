<script lang="ts">
	import { documentState } from '$lib/state/document.svelte';

	function addScene() {
		const newSceneNumber = documentState.project.scenes.length + 1;
		const id = crypto.randomUUID();
		
		documentState.project.scenes.push({
			id,
			chapterNumber: 1, // Phase 1 MVP keeps chapters flat for now
			sceneNumber: newSceneNumber,
			title: `Scene ${newSceneNumber}`,
			content: '',
			objectivesText: '',
			todoList: [],
			wordCount: 0
		});

		documentState.activeSceneId = id;
	}
</script>

<aside class="w-64 flex-col border-r border-zinc-200 bg-zinc-100/50 flex shrink-0 transition-all h-full">
	<div class="p-4 border-b border-zinc-200/60 flex items-center justify-between">
		<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500">Explorer</h2>
		<button 
			onclick={addScene}
			class="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
			title="Add Scene"
		>
			+ Add
		</button>
	</div>
	
	<div class="flex-1 overflow-y-auto p-4 space-y-4">
		{#each documentState.project.scenes as scene (scene.id)}
			<button 
				class="w-full text-left p-2 rounded-md transition-colors {documentState.activeSceneId === scene.id ? 'bg-indigo-50 text-indigo-900 border border-indigo-100' : 'text-zinc-600 hover:bg-zinc-200/50'}"
				onclick={() => documentState.activeSceneId = scene.id}
			>
				<h3 class="text-sm font-medium">CH {scene.chapterNumber} <span class="text-zinc-400 font-normal">/ Scene {scene.sceneNumber}</span></h3>
				{#if documentState.activeSceneId === scene.id}
					<div class="mt-1 text-xs text-indigo-500/80">{scene.wordCount} words</div>
				{/if}
			</button>
		{/each}
	</div>
</aside>