<script lang="ts">
        import { documentState, type ReviewRecipe } from '$lib/state/document.svelte';
        import { settingsState } from '$lib/state/settings.svelte';
        import { uiState } from '$lib/state/ui.svelte';
        import { buildSystemPrompt, buildUserMessage } from '$lib/utils/contextAssembler';
        import { extractJsonFromText } from '$lib/utils/jsonParser';
        import { Plus, Trash2, ChevronDown, ChevronRight, MessageSquare, Code, Play } from 'lucide-svelte';

        let isResizing = $state(false);
        let expandedRecipes = $state<Record<string, boolean>>({});

        const openTodos = $derived((documentState.activeScene?.todoList || []).filter(t => t && typeof t === 'object' && (t.status === 'open' || t.status === 'ignored')));

        // Migrate string-based todos to structured TodoItems for backward compatibility
        $effect(() => {
                if (documentState.activeScene && documentState.activeScene.todoList?.length > 0) {
                        let hasOldTodos = false;
                        const migrated = documentState.activeScene.todoList.map(t => {
                                if (typeof t === 'string') {
                                        hasOldTodos = true;
                                        return {
                                                id: crypto.randomUUID(),
                                                text: t,
                                                status: 'open' as const,
                                                source: 'user' as const,
                                                createdAt: Date.now()
                                        };
                                }
                                return t;
                        });
                        
                        if (hasOldTodos) {
                                documentState.activeScene.todoList = migrated;
                        }
                }
        });

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
                const userPrompt = uiState.editorInstance ? uiState.editorInstance.getText() : buildUserMessage(documentState.activeScene);

		if (settingsState.debugAiCalls) {
			console.log("=== AI REQUEST START ===");
			console.log("Recipe Tier:", recipe.tier);
			console.log("Model:", tierConfig.modelId);
			console.log("System Prompt:\n", systemPrompt);
			console.log("User Prompt (Manuscript):\n", userPrompt);
		}

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

			if (settingsState.debugAiCalls) {
				console.log("=== AI RESPONSE END ===");
				console.log("Raw Output Format Mode:", recipe.outputFormat);
				console.log("Raw Feedback Output:\n", recipe.feedback);

                        }

                        // Post-process response based on output format
                        if (recipe.outputFormat === 'todos') {
                                const parsed = extractJsonFromText(recipe.feedback);
                                if (parsed && Array.isArray(parsed.response)) {
                                        const strings: string[] = parsed.response.filter((p: any) => typeof p === 'string');
                                        if (strings.length > 0) {
                                                const newTodos = strings.map(s => ({
                                                        id: crypto.randomUUID(),
                                                        text: s,
                                                        status: 'open' as const,
                                                        source: 'recipe' as const,
                                                        createdAt: Date.now()
                                                }));
                                                documentState.activeScene.todoList = [
                                                        ...documentState.activeScene.todoList,
                                                        ...newTodos
                                                ];
                                                recipe.feedback = `Successfully added ${strings.length} To-Dos!`;
                                        }
                                }
                        } else if (recipe.outputFormat === 'lints' && uiState.editorInstance) {
                                const parsed = extractJsonFromText(recipe.feedback);
                                if (parsed && Array.isArray(parsed.response)) {
                                        let matchCount = 0;
                                        parsed.response.forEach((item: any) => {
                                                if (item.original_text && (item.suggestion || item.commentary || item.reasoning)) {
                                                        // Attempt exact string match
                                                        const editor = uiState.editorInstance;
                                                        const text = editor.getText();
                                                        const searchString = item.original_text.trim();
                                                        if (searchString.length < 3) return; // Skip tiny strings

                                                        const startIndex = text.indexOf(searchString);
                                                        if (startIndex !== -1) {
                                                                const annotationId = crypto.randomUUID();
                                                                
                                                                // Convert to correct ProseMirror positions
                                                                // getText() strips some nodes, so searching might not be perfect.
                                                                // A more robust method would iterate nodes, but this works for MVP.
                                                                // ProseMirror document coords include elements, so we use a specialized search:
                                                                
                                                                // For now, simpler workaround using the editor.commands
                                                                // We need the exact from/to. 
                                                                // Without prosemirror-utils, we might fall back to regex on text block.
                                                                
                                                                const doc = editor.view.state.doc;
                                                                let posFrom = 0;
                                                                let posTo = 0;
                                                                let found = false;

                                                                doc.descendants((node: any, pos: number) => {
                                                                        if (node.isText && node.text && !found) {
                                                                                const index = node.text.indexOf(searchString);
                                                                                if (index !== -1) {
                                                                                        posFrom = pos + index;
                                                                                        posTo = posFrom + searchString.length;
                                                                                        found = true;
                                                                                }
                                                                        }
                                                                });

                                                                if (found) {
                                                                        editor.commands.setTextSelection({ from: posFrom, to: posTo });
                                                                        editor.commands.setAnnotation(annotationId);
                                                                        
                                                                        if (!documentState.activeScene!.annotations) documentState.activeScene!.annotations = []; documentState.activeScene!.annotations.push({
                                                                                id: annotationId,
                                                                                recipeId: recipe.id,
                                                                                originalText: item.original_text,
                                                                                suggestion: item.suggestion,
                                                                                commentary: item.commentary || item.reasoning || item.suggestion || 'No comment provided',
                                                                                reasoning: item.reasoning
                                                                        });
                                                                        matchCount++;
                                                                }
                                                        }
                                                }
                                        });
                                        recipe.feedback = `Analysis complete. Found and anchored ${matchCount} comments in the text.`;
                                }
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

	function findAnnotationPos(id: string) {
		let posFrom = -1;
		let posTo = -1;
		if (!uiState.editorInstance) return { posFrom, posTo };

		const doc = uiState.editorInstance.view.state.doc;
		doc.descendants((node: any, pos: number) => {
			if (node.marks) {
				const mark = node.marks.find((m: any) => m.type.name === "annotation" && m.attrs.id === id);
				if (mark) {
					if (posFrom === -1) posFrom = pos;
					posTo = pos + node.nodeSize;
				}
			}
		});
		return { posFrom, posTo };
	}

	// Kept for backward compatibility, unused in new workflow
	function resolveAnnotation(annotation: import("$lib/state/document.svelte").Annotation) {
		if (!uiState.editorInstance || !documentState.activeScene) return;
		const { posFrom, posTo } = findAnnotationPos(annotation.id);
		
		if (posFrom !== -1 && posTo !== -1 && annotation.suggestion) {
			uiState.editorInstance.chain().focus().setTextSelection({ from: posFrom, to: posTo }).insertContent(annotation.suggestion).run();
		}
		
		documentState.activeScene.annotations = (documentState.activeScene.annotations || []).filter(a => a.id !== annotation.id);
	}

	function addTodoFromAnnotation(annotation: import("$lib/state/document.svelte").Annotation) {
		if (!documentState.activeScene) return;
		
		const todoText = `Address critique: "${annotation.commentary}" (Context: "${annotation.originalText}")`;
		documentState.activeScene.todoList.push({
			id: crypto.randomUUID(),
			text: todoText,
			status: 'open',
			source: 'lint',
			createdAt: Date.now()
		});
		
		// Clear the annotation since it's now tracked as a To-Do
		ignoreAnnotation(annotation);
	}

	function ignoreAnnotation(annotation: import("$lib/state/document.svelte").Annotation) {
		if (!uiState.editorInstance || !documentState.activeScene) return;
		const { posFrom, posTo } = findAnnotationPos(annotation.id);
		
		if (posFrom !== -1 && posTo !== -1) {
			uiState.editorInstance.chain().focus().setTextSelection({ from: posFrom, to: posTo }).unsetAnnotation(annotation.id).run();
		}
		
		documentState.activeScene.annotations = (documentState.activeScene.annotations || []).filter(a => a.id !== annotation.id);
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
                                                                                        title="Automatically add items to Scene ToDos"
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
                                                                        {#if recipe.outputFormat === 'text' || recipe.isGenerating || (recipe.feedback || '').startsWith('Successfully') || (recipe.feedback || '').startsWith('Error:')}
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
                                                                {/if}

                                                                {#if documentState.activeScene}
                                                                        <div class="mt-2 space-y-2">
                                                                                {#each (documentState.activeScene.annotations || []).filter(a => a.recipeId === recipe.id && !a.isIgnored) as annotation (annotation.id)}
                                                                                        <div class="p-3 border border-yellow-200 bg-yellow-50 rounded-md text-sm relative group shadow-sm transition-colors hover:border-yellow-400">
                                                                                                <div class="font-bold text-yellow-800 text-xs mb-1 uppercase tracking-wide">Found Issue:</div>
                                                                                                <div class="line-through text-zinc-400 mb-1.5 truncate text-xs font-mono">{annotation.originalText}</div>
                                                                                                <div class="text-zinc-800 font-medium mb-1.5">{annotation.commentary}</div>
                                                                                                {#if annotation.reasoning}
                                                                                                        <div class="text-zinc-600 text-xs italic block mt-1">Reasoning: {annotation.reasoning}</div>
                                                                                                {/if}
                                                                                                {#if annotation.suggestion}
                                                                                                        <div class="text-zinc-600 text-xs italic block mt-1">Suggestion: {annotation.suggestion}</div>
                                                                                                {/if}
                                                                                                
                                                                                                <div class="mt-3 flex gap-2">
                                                                                                        <button 
                                                                                                                class="flex-1 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-xs font-medium transition-colors" 
                                                                                                                onclick={() => addTodoFromAnnotation(annotation)}
                                                                                                        >
                                                                                                                Add to To-Dos
                                                                                                        </button>
                                                                                                        <button 
                                                                                                                class="flex-1 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded text-xs font-medium transition-colors" 
                                                                                                                onclick={() => ignoreAnnotation(annotation)}
                                                                                                        >
                                                                                                                Ignore
                                                                                                        </button>
                                                                                                </div>
                                                                                        </div>
                                                                                {/each}
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
				<h3 class="text-sm font-semibold text-zinc-700">Scene ToDos</h3>
				<span class="text-xs font-mono px-1.5 py-0.5 rounded {openTodos.length > 10 ? 'bg-red-200 text-red-800' : 'bg-zinc-200 text-zinc-600'}" title={openTodos.length > 10 ? 'Delete todos when you can to reduce token costs.' : ''}>
					{openTodos.length}
				</span>
			</div>

			<div class="h-64 overflow-y-auto bg-white border border-zinc-300 rounded-md shadow-sm mb-2 p-2">
				{#each (documentState.activeScene?.todoList || []) as todo, i (typeof todo === 'object' && todo && 'id' in todo ? todo.id : i)}
					{#if typeof todo !== 'string'}
						<div class="flex items-start gap-2 p-1.5 mb-1 group rounded hover:bg-zinc-50 {todo.status === 'ignored' ? 'opacity-50 line-through' : ''}">
							<input type="checkbox" checked={todo.status === 'completed'} class="mt-1 flex-shrink-0 cursor-pointer rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" onchange={(e) => {
								if (documentState.activeScene) {
									const idx = documentState.activeScene.todoList.findIndex(t => t.id === todo.id);
									if (idx !== -1) {
										documentState.activeScene.todoList[idx].status = e.currentTarget.checked ? 'completed' : 'open';
									}
								}
							}} />
							<div class="flex-1 text-sm text-zinc-800 break-words">
								<span class="inline-block mr-1 text-xs" title="Source: {todo.source}">{todo.source === 'user' ? '👤' : (todo.source === 'recipe' ? '🤖' : '🔍')}</span>
								<span class={todo.status === 'completed' ? 'text-zinc-500 line-through' : ''}>{todo.text}</span>
							</div>
							<div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
								{#if todo.status !== 'completed'}
									<button class="text-zinc-400 hover:text-orange-500" title={todo.status === 'ignored' ? 'Unignore' : 'Ignore'} onclick={() => {
										if (documentState.activeScene) {
											const idx = documentState.activeScene.todoList.findIndex(t => t.id === todo.id);
											if (idx !== -1) {
												documentState.activeScene.todoList[idx].status = todo.status === 'ignored' ? 'open' : 'ignored';
											}
										}
									}}>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
									</button>
								{/if}
								<button class="text-zinc-400 hover:text-red-500" title="Delete" onclick={() => {
									if (documentState.activeScene) {
										documentState.activeScene.todoList = documentState.activeScene.todoList.filter(t => t.id !== todo.id);
									}
								}}>
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
								</button>
							</div>
						</div>
					{/if}
				{/each}
				{#if (documentState.activeScene?.todoList || []).length === 0}
					<div class="text-center p-4 text-zinc-500 text-sm">No To-Dos yet.</div>
				{/if}
			</div>

			<input type="text" class="w-full text-sm p-2 border border-zinc-300 rounded bg-white shadow-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-zinc-400" placeholder="Add a scene to-do..." onkeydown={(e) => {
				if (e.key === 'Enter' && e.currentTarget.value.trim() && documentState.activeScene) {
					documentState.activeScene.todoList.push({
						id: crypto.randomUUID(),
						text: e.currentTarget.value.trim(),
						status: 'open',
						source: 'user',
						createdAt: Date.now()
					});
					e.currentTarget.value = '';
				}
			}} />
		</div>

	</div>
</aside>