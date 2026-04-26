<script lang="ts">
	import { 
		PanelLeft, 
		PanelRight, 
		PanelsLeftRight, 
		Settings, 
		Save, 
		RotateCcw, 
		History,
		CheckSquare
	} from 'lucide-svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState } from '$lib/state/document.svelte';
</script>

<header class="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 z-20 text-xs text-zinc-600">
	
	<div class="flex items-center font-mono font-medium bg-zinc-100 px-2 py-1 rounded">
		{#if documentState.activeScene}
			CH {documentState.activeScene.chapterNumber} <span class="mx-2 text-zinc-300">/</span> SC {documentState.activeScene.sceneNumber}
		{/if}
	</div>

	<div class="flex items-center gap-6">
		<div class="flex items-center gap-4">
			{#if documentState.activeScene}
				<span>{documentState.activeScene.wordCount} Words</span>
				<span class="flex items-center gap-1"><CheckSquare size={14} /> {documentState.activeScene.todoList.length} To-Dos</span>
			{/if}
		</div>
		
		<div class="h-4 w-px bg-zinc-200"></div> <div class="flex items-center gap-2">
			<button class="flex items-center gap-1 hover:text-zinc-900 transition-colors" title="Mark Final">
				<Save size={14} /> Save
			</button>
			<button class="flex items-center gap-1 hover:text-zinc-900 transition-colors" title="Restore Final">
				<RotateCcw size={14} /> Load
			</button>
			<button class="flex items-center gap-1 hover:text-zinc-900 transition-colors ml-2" title="Version History">
				<History size={14} /> Versions
			</button>
		</div>
	</div>

	<div class="flex items-center gap-1">
		<button 
			class="p-1.5 rounded hover:bg-zinc-100 transition-colors {uiState.showExplorer ? 'text-indigo-600' : 'text-zinc-400'}"
			onclick={() => uiState.showExplorer = !uiState.showExplorer}
			title="Toggle Explorer">
			<PanelLeft size={18} />
		</button>
		
		<button 
			class="p-1.5 rounded hover:bg-zinc-100 transition-colors {uiState.showReviewPanel ? 'text-indigo-600' : 'text-zinc-400'}"
			onclick={() => uiState.showReviewPanel = !uiState.showReviewPanel}
			title="Toggle Review Recipes & To-Dos">
			<PanelsLeftRight size={18} />
		</button>
		
		<button 
			class="p-1.5 rounded hover:bg-zinc-100 transition-colors {uiState.showContextBoard ? 'text-indigo-600' : 'text-zinc-400'}"
			onclick={() => uiState.showContextBoard = !uiState.showContextBoard}
			title="Toggle Context Board">
			<PanelRight size={18} />
		</button>

		<div class="h-4 w-px bg-zinc-200 mx-1"></div> <button class="p-1.5 rounded hover:bg-zinc-100 transition-colors text-zinc-500" title="Settings">
			<Settings size={18} />
		</button>
	</div>

</header>