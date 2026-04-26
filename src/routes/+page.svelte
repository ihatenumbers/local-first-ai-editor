<script lang="ts">
	import { 
		PanelLeft, 
		PanelRight, 
		ListChecks, 
		Settings, 
		Save, 
		RotateCcw, 
		History,
		CheckSquare
	} from 'lucide-svelte';

	// Svelte 5 Global State
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState } from '$lib/state/document.svelte';

	// Placeholder test data setup directly in the store, 
	// overriding default just to maintain the mock UI visually!
	documentState.wordCount = 1245;
	documentState.todoList = ['Foreshadow the amulet', 'Describe the lighting', 'Fix dialogue pacing in middle'];
	documentState.currentChapter = 1;
	documentState.currentScene = 2;
</script>

<main class="flex h-screen w-full overflow-hidden bg-zinc-50 text-zinc-900 font-sans">

	{#if uiState.showExplorer}
		<aside class="w-64 flex-col border-r border-zinc-200 bg-zinc-100/50 flex shrink-0 transition-all">
			<div class="p-4 border-b border-zinc-200/60">
				<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500">Explorer</h2>
			</div>
			<div class="flex-1 overflow-y-auto p-4">
				<div class="text-sm text-zinc-600 font-medium cursor-pointer hover:text-zinc-900">
					CH {documentState.currentChapter}
					<div class="ml-4 mt-1 text-zinc-500 font-normal">SC {documentState.currentScene}</div>
				</div>
			</div>
		</aside>
	{/if}

	<section class="flex flex-1 flex-col overflow-hidden bg-white relative shadow-sm z-10 min-w-[400px]">
		
		<header class="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 z-20 text-xs text-zinc-600">
			
			<div class="flex items-center font-mono font-medium bg-zinc-100 px-2 py-1 rounded">
				CH {documentState.currentChapter} <span class="mx-2 text-zinc-300">/</span> SC {documentState.currentScene}
			</div>

			<div class="flex items-center gap-6">
				<div class="flex items-center gap-4">
					<span>{documentState.wordCount} Words</span>
					<span class="flex items-center gap-1"><CheckSquare size={14} /> {documentState.todoList.length} To-Dos</span>
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
					<ListChecks size={18} />
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
		<aside class="w-80 flex-col border-l border-zinc-200 bg-zinc-50 flex shrink-0">
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
	{/if}

	{#if uiState.showContextBoard}
		<aside class="w-80 flex-col border-l border-zinc-200 bg-zinc-100/50 flex shrink-0">
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
	{/if}

</main>