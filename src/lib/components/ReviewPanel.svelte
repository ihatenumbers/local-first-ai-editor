<script lang="ts">
        import { documentState, type ReviewRecipe } from '$lib/state/document.svelte';
        import { settingsState } from '$lib/state/settings.svelte';
        import { uiState } from '$lib/state/ui.svelte';
        import { buildSystemPrompt, buildUserMessage } from '$lib/utils/contextAssembler';
        import { Plus, Trash2, ChevronDown, ChevronRight, MessageSquare, Code, Play } from 'lucide-svelte';

        let isResizing = $state(false);
        let expandedRecipes = $state<Record<string, boolean>>({});

        async function runRecipe(recipe: ReviewRecipe) {
                if (!documentState.activeScene) return;

                const tierConfig = settingsState.tiers[recipe.tier];
                if (!tierConfig || !tierConfig.modelId) {
                        alert(`No model configured for tier: ${recipe.tier}`);
                        return;
                }

                const profile = settingsState.profiles.find(p => p.id === tierConfig.providerId);
                if (!profile) {
                        alert('Provider profile not found.');
                        return;
                }

                recipe.isGenerating = true;
                recipe.feedback = '';
                expandedRecipes[recipe.id] = true;

                const systemPrompt = buildSystemPrompt(documentState.activeScene, documentState.project, recipe);
                const userPrompt = buildUserMessage(documentState.activeScene);

                try {
                        const res = await fetch('/api/ai/review', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        baseUrl: profile.baseUrl,
                                        apiKey: profile.apiKey,
                                        providerType: profile.type,
                                        model: tierConfig.modelId,
                                        systemPrompt,
                                        userPrompt,
                                        responseFormat: recipe.outputFormat
                                })
                        });

                        if (!res.ok) {
                                const err = await res.json();
                                recipe.feedback = `Error: ${err.error || res.statusText}\n${err.details || ''}`;
                                recipe.isGenerating = false;
                                return;
                        }

                        const reader = res.body?.getReader();
                        if (!reader) throw new Error('No stream to read');
                        const decoder = new TextDecoder();

                        while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                recipe.feedback += decoder.decode(value, { stream: true });
                        }
                } catch (e: any) {
                        recipe.feedback = `Error: ${e.message}`;
                } finally {
                        recipe.isGenerating = false;
                }
        }
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
                if (documentState.activeScene) {
                        documentState.activeScene.reviewRecipes.push({
                                id: crypto.randomUUID(),
                                title: 'New Review Instructions',
                                prompt: '',
                                isActive: true,
                                tier: 'balanced',
                                outputFormat: 'text'
                        });
                }
        }
	function deleteRecipe(id: string) {
		if (documentState.activeScene) documentState.activeScene.reviewRecipes = documentState.activeScene.reviewRecipes.filter(r => r.id !== id);
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
                                {#each (documentState.activeScene?.reviewRecipes || []) as recipe (recipe.id)}
                                        <div class="bg-white border hover:border-indigo-300 transition-colors border-zinc-200 rounded-md shadow-sm group overflow-hidden">
                                                <div class="flex items-center justify-between p-3 bg-zinc-50/50">
                                                        <div class="flex items-center gap-2 flex-1">
                                                                <button class="text-zinc-400 hover:text-indigo-600" onclick={() => expandedRecipes[recipe.id] = !expandedRecipes[recipe.id]}>
                                                                        {#if expandedRecipes[recipe.id]} <ChevronDown size={16} /> {:else} <ChevronRight size={16} /> {/if}
                                                                </button>
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
                                                        <div class="flex items-center gap-1">
                                                                <button 
                                                                        class="p-1 text-zinc-400 hover:text-indigo-600 transition-colors disabled:opacity-50 {recipe.isGenerating ? 'animate-pulse text-indigo-600' : ''}"
                                                                        title={recipe.isGenerating ? "Analyzing..." : "Run Analysis"}
                                                                        onclick={() => runRecipe(recipe)}
                                                                        disabled={recipe.isGenerating}
                                                                >
                                                                        <Play size={14} class={recipe.isGenerating ? "fill-indigo-600" : ""} />
                                                                </button>
                                                                <button 
                                                                        class="p-1 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Delete Recipe"
                                                                        onclick={() => deleteRecipe(recipe.id)}
                                                                >
                                                                        <Trash2 size={14} />
                                                                </button>
                                                        </div>
                                                </div>
                                                
                                                {#if expandedRecipes[recipe.id]}
                                                        <div class="p-3 border-t border-zinc-200 space-y-3 bg-white">
                                                                <div class="flex items-center justify-between">
                                                                        <div class="flex rounded-md shadow-sm">
                                                                                <button 
                                                                                        class="px-2 py-1 text-[10px] font-medium rounded-l-md border border-r-0 {recipe.outputFormat === 'text' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}" 
                                                                                        title="Free-text feedback in sidebar"
                                                                                        onclick={() => recipe.outputFormat = 'text'}>
                                                                                        <MessageSquare size={12} class="inline mr-1" /> Text
                                                                                </button>
                                                                                <button 
                                                                                        class="px-2 py-1 text-[10px] font-medium border-t border-b border-l {recipe.outputFormat === 'lints' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}"
                                                                                        title="JSON object output for editor anchors"
                                                                                        onclick={() => recipe.outputFormat = 'lints'}>
                                                                                        <Code size={12} class="inline mr-1" /> Lints
                                                                                </button>
                                                                                <button 
                                                                                        class="px-2 py-1 text-[10px] font-medium rounded-r-md border {recipe.outputFormat === 'todos' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}"
                                                                                        title="Automatically add items to Scene To-Dos"
                                                                                        onclick={() => recipe.outputFormat = 'todos'}>
                                                                                        <Code size={12} class="inline mr-1" /> To-Dos
                                                                                </button>
                                                                        </div>
                                                                        <select bind:value={recipe.tier} class="text-[10px] font-medium bg-zinc-50 border border-zinc-200 rounded p-1 text-zinc-600 focus:ring-indigo-500 outline-none">
                                                                                <option value="fast">Tier: Fast</option>
                                                                                <option value="balanced">Tier: Balanced</option>
                                                                                <option value="deep">Tier: Deep</option>
                                                                        </select>
                                                                </div>

                                                                <textarea 
                                                                        bind:value={recipe.prompt}
                                                                        class="w-full rounded-md border-zinc-200 text-sm p-2 bg-zinc-50 font-mono resize-none h-24 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-zinc-400" 
                                                                        placeholder="Enter AI instruction prompt..."
                                                                ></textarea>

                                                                {#if recipe.feedback || recipe.isGenerating}
                                                                        <div class="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-md text-sm text-zinc-700 whitespace-pre-wrap font-sans relative">
                                                                                {#if recipe.isGenerating && !recipe.feedback}
                                                                                        <span class="animate-pulse text-indigo-400">Thinking...</span>
                                                                                {:else}
                                                                                        {recipe.feedback}
                                                                                        {#if recipe.isGenerating}
                                                                                                <span class="inline-block w-1.5 h-3 bg-indigo-500 ml-1 animate-pulse"></span>
                                                                                        {/if}
                                                                                {/if}
                                                                        </div>
                                                                {/if}
                                                        </div>
                                                {/if}
                                        </div>
                                {/each}

                                {#if (documentState.activeScene?.reviewRecipes || []).length === 0}
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
			<textarea value={documentState.activeScene?.todoList.map(t => `- ${t}`).join("\n") || ""} oninput={(e) => { if (documentState.activeScene) { documentState.activeScene.todoList = e.currentTarget.value.split("\n").map(t => t.replace(/^- /, "")).filter(t => t.trim() !== ""); } }} class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white resize-none h-48 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="- Foreshadow the amulet&#10;- Describe the lighting&#10;- Fix dialogue pacing in middle"></textarea>
		</div>

	</div>
</aside>