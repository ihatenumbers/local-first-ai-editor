<script lang="ts">
	import { documentState, type ReviewRecipe } from '$lib/state/document.svelte';
	import { settingsState } from '$lib/state/settings.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { buildSystemPrompt, buildUserMessage } from '$lib/utils/contextAssembler';
	import { extractJsonFromText } from '$lib/utils/jsonParser';
	import { dndzone } from 'svelte-dnd-action';
	import {
		Plus,
		Trash2,
		ChevronDown,
		ChevronRight,
		MessageSquare,
		Code,
		Play
	} from 'lucide-svelte';

	let isResizing = $state(false);
	let expandedRecipes = $state<Record<string, boolean>>({});

	const openTodos = $derived(
		(documentState.activeScene?.todoList || []).filter(
			(t) => t && typeof t === 'object' && (t.status === 'open' || t.status === 'ignored')
		)
	);

	// Migrate string-based todos to structured TodoItems for backward compatibility
	$effect(() => {
		if (documentState.activeScene && documentState.activeScene.todoList?.length > 0) {
			let hasOldTodos = false;
			const migrated = documentState.activeScene.todoList.map((t) => {
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
				if (!t.id) {
					hasOldTodos = true;
					return { ...t, id: crypto.randomUUID() };
				}
				return t;
			});

			if (hasOldTodos) {
				documentState.activeScene.todoList = migrated;
			}
		}
	});

	function handleDndConsiderRecipes(e: CustomEvent<any>) {
		if (documentState.activeScene) {
			documentState.activeScene.reviewRecipes = e.detail.items;
		}
	}
	function handleDndFinalizeRecipes(e: CustomEvent<any>) {
		if (documentState.activeScene) {
			documentState.activeScene.reviewRecipes = e.detail.items;
		}
	}

	function handleDndConsiderTodos(e: CustomEvent<any>) {
		if (documentState.activeScene) {
			documentState.activeScene.todoList = e.detail.items;
		}
	}
	function handleDndFinalizeTodos(e: CustomEvent<any>) {
		if (documentState.activeScene) {
			documentState.activeScene.todoList = e.detail.items;
		}
	}

	async function runRecipe(recipe: ReviewRecipe) {
		if (!documentState.activeScene) return;

		const tierConfig = settingsState.tiers[recipe.tier];
		if (!tierConfig || !tierConfig.modelId) {
			alert(`No model configured for tier: ${recipe.tier}`);
			return;
		}

		const profile = settingsState.profiles.find((p) => p.id === tierConfig.providerId);
		if (!profile) {
			alert('Provider profile not found.');
			return;
		}

		recipe.isGenerating = true;
		recipe.feedback = '';
		expandedRecipes[recipe.id] = true;

		const systemPrompt = buildSystemPrompt(
			documentState.activeScene,
			documentState.project,
			recipe
		);
		const userPrompt = uiState.editorInstance
			? uiState.editorInstance.getText()
			: buildUserMessage(documentState.activeScene);

		if (settingsState.debugAiCalls) {
			console.log('=== AI REQUEST START ===');
			console.log('Recipe Tier:', recipe.tier);
			console.log('Model:', tierConfig.modelId);
			console.log('System Prompt:\n', systemPrompt);
			console.log('User Prompt (Manuscript):\n', userPrompt);
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
				console.log('=== AI RESPONSE END ===');
				console.log('Raw Output Format Mode:', recipe.outputFormat);
				console.log('Raw Feedback Output:\n', recipe.feedback);
			}

			// Post-process response based on output format
			if (recipe.outputFormat === 'todos') {
				const parsed = extractJsonFromText(recipe.feedback);
				if (parsed && Array.isArray(parsed.response)) {
					const strings: string[] = parsed.response.filter((p: any) => typeof p === 'string');
					if (strings.length > 0) {
						const newTodos = strings.map((s) => ({
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
						recipe.feedback = `Successfully added ${strings.length} ToDos!`;
					}
				}
			} else if (recipe.outputFormat === 'lints' && uiState.editorInstance) {
				const parsed = extractJsonFromText(recipe.feedback);
				if (parsed && Array.isArray(parsed.response)) {
					const editor = uiState.editorInstance;
					const doc = editor.view.state.doc;
					
					// Build text content and position map ONCE for the whole document
					let extractedText = '';
					let posMapping: number[] = [];

					doc.descendants((node: any, pos: number) => {
						if (node.isText && node.text) {
							for (let i = 0; i < node.text.length; i++) {
								extractedText += node.text[i];
								posMapping.push(pos + i);
							}
						} else if (node.isBlock) {
							// Insert boundary whitespace so we don't merge words across blocks
							if (extractedText.length > 0 && extractedText[extractedText.length - 1] !== '\n') {
								extractedText += '\n';
								posMapping.push(pos);
							}
						}
					});

					let matchCount = 0;
					// Helper to construct whitespace-insensitive regex
					const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

					parsed.response.forEach((item: any) => {
						if (item.original_text && (item.suggestion || item.commentary || item.reasoning)) {
							const searchString = item.original_text.trim();
							if (searchString.length < 3) return; // Skip tiny strings

							const escapedSearch = escapeRegExp(searchString);
							// Replace any literal whitespace sequences generated by escapeRegExp with \s+ pattern
							// We handle escaped spaces '\ ' and escaped tabs/newlines if any
							const fuzzyRegexStr = escapedSearch.replace(/\\[tnrfv]/g, '\\s+').replace(/\\ /g, '\\s+');
							
							try {
								const fuzzyRegex = new RegExp(fuzzyRegexStr, 'i');
								const match = extractedText.match(fuzzyRegex);

								const annotationId = crypto.randomUUID();
								let posFrom = -1;
								let posTo = -1;

								if (match && match.index !== undefined) {
									// Map from string index back to ProseMirror document positions
									posFrom = posMapping[match.index];
									
									// Calculate end index mapping carefully
									let endIndex = match.index + match[0].length - 1;
									if (endIndex >= posMapping.length) endIndex = posMapping.length - 1;
									posTo = posMapping[endIndex] + 1; // +1 because PM selections are end-exclusive

									// Apply the annotation in the editor
									editor.commands.setTextSelection({ from: posFrom, to: posTo });
									editor.commands.setAnnotation(annotationId, recipe.color || 'yellow');
									matchCount++;
								}

								// Even if not found, add to panel so user can still see AI feedback!
								if (!documentState.activeScene!.annotations)
									documentState.activeScene!.annotations = [];
									
								documentState.activeScene!.annotations.push({
									id: annotationId,
									recipeId: recipe.id,
									originalText: item.original_text,
									suggestion: item.suggestion,
									commentary:
										item.commentary || item.reasoning || item.suggestion || 'No comment provided',
									reasoning: item.reasoning,
									isIgnored: posFrom === -1 // mark as ignored/orphaned if not found
								});
							} catch (e) {
								console.error("Invalid regex built for:", searchString, e);
							}
						}
					});
					recipe.feedback = `Analysis complete. Anchored ${matchCount} out of ${parsed.response.length} comments in the text. Unanchored comments are preserved anyway.`;
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
				const mark = node.marks.find((m: any) => m.type.name === 'annotation' && m.attrs.id === id);
				if (mark) {
					if (posFrom === -1) posFrom = pos;
					posTo = pos + node.nodeSize;
				}
			}
		});
		return { posFrom, posTo };
	}

	// Kept for backward compatibility, unused in new workflow
	function resolveAnnotation(annotation: import('$lib/state/document.svelte').Annotation) {
		if (!uiState.editorInstance || !documentState.activeScene) return;
		const { posFrom, posTo } = findAnnotationPos(annotation.id);

		if (posFrom !== -1 && posTo !== -1 && annotation.suggestion) {
			uiState.editorInstance
				.chain()
				.focus()
				.setTextSelection({ from: posFrom, to: posTo })
				.insertContent(annotation.suggestion)
				.run();
		}

		documentState.activeScene.annotations = (documentState.activeScene.annotations || []).filter(
			(a) => a.id !== annotation.id
		);
	}

	function addTodoFromAnnotation(annotation: import('$lib/state/document.svelte').Annotation) {
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

	function ignoreAnnotation(annotation: import('$lib/state/document.svelte').Annotation) {
		if (!uiState.editorInstance || !documentState.activeScene) return;
		const { posFrom, posTo } = findAnnotationPos(annotation.id);

		if (posFrom !== -1 && posTo !== -1) {
			uiState.editorInstance
				.chain()
				.focus()
				.setTextSelection({ from: posFrom, to: posTo })
				.unsetAnnotation(annotation.id)
				.run();
		}

		documentState.activeScene.annotations = (documentState.activeScene.annotations || []).filter(
			(a) => a.id !== annotation.id
		);
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
		if (documentState.activeScene)
			documentState.activeScene.reviewRecipes = documentState.activeScene.reviewRecipes.filter(
				(r) => r.id !== id
			);
	}
</script>

<aside
	class="relative flex shrink-0 flex-col border-l border-zinc-200 bg-zinc-50"
	style="width: {uiState.reviewPanelWidth}px"
>
	<div
		role="slider"
		aria-valuenow={uiState.reviewPanelWidth}
		tabindex="0"
		class="absolute top-0 bottom-0 left-0 z-50 w-1 -translate-x-1/2 cursor-col-resize transition-colors hover:bg-indigo-500/50"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
	></div>

	<div class="border-b border-zinc-200/60 p-4">
		<h2 class="text-xs font-bold tracking-wider text-zinc-500 uppercase">Review Recipes</h2>
	</div>
	<div class="flex-1 space-y-6 overflow-y-auto p-4">
		<div>
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-semibold text-zinc-700">Active Recipes</h3>
				<button
					class="rounded p-1 text-zinc-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
					title="Add Recipe"
					onclick={addRecipe}
				>
					<Plus size={16} />
				</button>
			</div>

			<div
				class="min-h-[50px] space-y-3"
				use:dndzone={{
					items: documentState.activeScene?.reviewRecipes || [],
					flipDurationMs: 200,
					dropTargetStyle: {}
				}}
				onconsider={handleDndConsiderRecipes}
				onfinalize={handleDndFinalizeRecipes}
			>
				{#each documentState.activeScene?.reviewRecipes || [] as recipe (recipe.id)}
					<div
						class="group overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm transition-colors hover:border-indigo-300"
					>
						<div class="flex items-center justify-between bg-zinc-50/50 p-3">
							<div class="flex flex-1 items-center gap-2">
								<button
									class="text-zinc-400 hover:text-indigo-600"
									onclick={() => (expandedRecipes[recipe.id] = !expandedRecipes[recipe.id])}
								>
									{#if expandedRecipes[recipe.id]}
										<ChevronDown size={16} />
									{:else}
										<ChevronRight size={16} />
									{/if}
								</button>
								<input
									type="checkbox"
									bind:checked={recipe.isActive}
									class="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
								/>
								<input
									type="text"
									bind:value={recipe.title}
									class="flex-1 truncate border-none bg-transparent p-0 text-sm font-semibold text-zinc-800 placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
									placeholder="Recipe Title"
								/>
							</div>
							<div class="flex items-center gap-1">
								<button
									class="p-1 text-zinc-400 transition-colors hover:text-indigo-600 disabled:opacity-50 {recipe.isGenerating
										? 'animate-pulse text-indigo-600'
										: ''}"
									title={recipe.isGenerating ? 'Analyzing...' : 'Run Analysis'}
									onclick={() => runRecipe(recipe)}
									disabled={recipe.isGenerating}
								>
									<Play size={14} class={recipe.isGenerating ? 'fill-indigo-600' : ''} />
								</button>
								<button
									class="p-1 text-zinc-300 opacity-0 transition-colors group-hover:opacity-100 hover:text-red-500"
									title="Delete Recipe"
									onclick={() => deleteRecipe(recipe.id)}
								>
									<Trash2 size={14} />
								</button>
							</div>
						</div>

						{#if expandedRecipes[recipe.id]}
							<div class="space-y-3 border-t border-zinc-200 bg-white p-3">
								<div class="flex items-center justify-between">
									<div class="flex rounded-md shadow-sm">
										<button
											class="rounded-l-md border border-r-0 px-2 py-1 text-[10px] font-medium {recipe.outputFormat ===
											'text'
												? 'border-indigo-200 bg-indigo-50 text-indigo-700'
												: 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'}"
											title="Free-text feedback in sidebar"
											onclick={() => (recipe.outputFormat = 'text')}
										>
											<MessageSquare size={12} class="mr-1 inline" /> Text
										</button>
										<button
											class="border-t border-b border-l px-2 py-1 text-[10px] font-medium {recipe.outputFormat ===
											'lints'
												? 'border-indigo-200 bg-indigo-50 text-indigo-700'
												: 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'}"
											title="JSON object output for editor anchors"
											onclick={() => (recipe.outputFormat = 'lints')}
										>
											<Code size={12} class="mr-1 inline" /> Lints
										</button>
										<button
											class="rounded-r-md border px-2 py-1 text-[10px] font-medium {recipe.outputFormat ===
											'todos'
												? 'border-indigo-200 bg-indigo-50 text-indigo-700'
												: 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'}"
											title="Automatically add items to Scene ToDos"
											onclick={() => (recipe.outputFormat = 'todos')}
										>
											<Code size={12} class="mr-1 inline" /> ToDos
										</button>
									</div>
									<select
										bind:value={recipe.tier}
										class="rounded border border-zinc-200 bg-zinc-50 p-1 text-[10px] font-medium text-zinc-600 outline-none focus:ring-indigo-500"
									>
										<option value="fast">Tier: Fast</option>
										<option value="balanced">Tier: Balanced</option>
										<option value="deep">Tier: Deep</option>
									</select>
								</div>
								{#if recipe.outputFormat === 'lints'}
									<div class="flex items-center gap-2 text-[10px] font-medium text-zinc-600">
										Color:
										<div class="flex gap-1">
											{#each ['yellow', 'red', 'blue', 'green', 'purple', 'pink'] as c}
												<button
													onclick={() => (recipe.color = c)}
													class="h-4 w-4 rounded-full border {recipe.color === c ||
													(!recipe.color && c === 'yellow')
														? 'scale-110 border-zinc-900'
														: 'border-black/10'}"
													style="background-color: var(--color-{c}-200, {c === 'yellow'
														? '#fef08a'
														: c === 'red'
															? '#fecaca'
															: c === 'blue'
																? '#bfdbfe'
																: c === 'green'
																	? '#bbf7d0'
																	: c === 'purple'
																		? '#e9d5ff'
																		: '#fbcfe8'})"
													title={c}
												></button>
											{/each}
										</div>
									</div>
								{/if}
								<textarea
									bind:value={recipe.prompt}
									class="h-24 w-full resize-none rounded-md border-zinc-200 bg-zinc-50 p-2 font-mono text-sm placeholder:text-zinc-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
									placeholder="Enter AI instruction prompt..."
								></textarea>

								{#if recipe.feedback || recipe.isGenerating}
									{#if recipe.outputFormat === 'text' || recipe.isGenerating || (recipe.feedback || '').startsWith('Successfully') || (recipe.feedback || '').startsWith('Error:')}
										<div
											class="relative mt-3 rounded-md border border-indigo-100 bg-indigo-50/50 p-3 font-sans text-sm whitespace-pre-wrap text-zinc-700"
										>
											{#if recipe.isGenerating && !recipe.feedback}
												<span class="animate-pulse text-indigo-400">Thinking...</span>
											{:else}
												{recipe.feedback}
												{#if recipe.isGenerating}
													<span class="ml-1 inline-block h-3 w-1.5 animate-pulse bg-indigo-500"
													></span>
												{/if}
											{/if}
										</div>
									{/if}
								{/if}

								{#if documentState.activeScene}
									<div class="mt-2 space-y-2">
										{#each (documentState.activeScene.annotations || []).filter((a) => a.recipeId === recipe.id && !a.isIgnored) as annotation (annotation.id)}
											<div
												class="group relative rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm shadow-sm transition-colors hover:border-yellow-400"
											>
												<div class="mb-1 text-xs font-bold tracking-wide text-yellow-800 uppercase">
													Found Issue:
												</div>
												<div class="mb-1.5 truncate font-mono text-xs text-zinc-400 line-through">
													{annotation.originalText}
												</div>
												<div class="mb-1.5 font-medium text-zinc-800">{annotation.commentary}</div>
												{#if annotation.reasoning}
													<div class="mt-1 block text-xs text-zinc-600 italic">
														Reasoning: {annotation.reasoning}
													</div>
												{/if}
												{#if annotation.suggestion}
													<div class="mt-1 block text-xs text-zinc-600 italic">
														Suggestion: {annotation.suggestion}
													</div>
												{/if}

												<div class="mt-3 flex gap-2">
													<button
														class="flex-1 rounded bg-indigo-500 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-600"
														onclick={() => addTodoFromAnnotation(annotation)}
													>
														Add to ToDos
													</button>
													<button
														class="flex-1 rounded border border-zinc-200 bg-white py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
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
					<div
						class="rounded-md border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500"
					>
						No active recipes. Add one to analyze your scene.
					</div>
				{/if}
			</div>
		</div>

		<div>
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-semibold text-zinc-700">Scene ToDos</h3>
				<span
					class="rounded px-1.5 py-0.5 font-mono text-xs {openTodos.length > 10
						? 'bg-red-200 text-red-800'
						: 'bg-zinc-200 text-zinc-600'}"
					title={openTodos.length > 10 ? 'Delete todos when you can to reduce token costs.' : ''}
				>
					{openTodos.length}
				</span>
			</div>

			<div
				class="mb-2 h-64 overflow-y-auto rounded-md border border-zinc-300 bg-white p-2 shadow-sm"
			>
				{#each documentState.activeScene?.todoList || [] as todo, i (typeof todo === 'object' && todo && 'id' in todo ? todo.id : i)}
					{#if typeof todo !== 'string'}
						<div
							class="group mb-1 flex items-start gap-2 rounded p-1.5 hover:bg-zinc-50 {todo.status ===
							'ignored'
								? 'line-through opacity-50'
								: ''}"
						>
							<input
								type="checkbox"
								checked={todo.status === 'completed'}
								class="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
								onchange={(e) => {
									if (documentState.activeScene) {
										const idx = documentState.activeScene.todoList.findIndex(
											(t) => t.id === todo.id
										);
										if (idx !== -1) {
											documentState.activeScene.todoList[idx].status = e.currentTarget.checked
												? 'completed'
												: 'open';
										}
									}
								}}
							/>
							<div class="flex-1 text-sm break-words text-zinc-800">
								<span class="mr-1 inline-block text-xs" title="Source: {todo.source}"
									>{todo.source === 'user' ? '👤' : todo.source === 'recipe' ? '🤖' : '🔍'}</span
								>
								<span class={todo.status === 'completed' ? 'text-zinc-500 line-through' : ''}
									>{todo.text}</span
								>
							</div>
							<div
								class="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								{#if todo.status !== 'completed'}
									<button
										class="text-zinc-400 hover:text-orange-500"
										title={todo.status === 'ignored' ? 'Unignore' : 'Ignore'}
										onclick={() => {
											if (documentState.activeScene) {
												const idx = documentState.activeScene.todoList.findIndex(
													(t) => t.id === todo.id
												);
												if (idx !== -1) {
													documentState.activeScene.todoList[idx].status =
														todo.status === 'ignored' ? 'open' : 'ignored';
												}
											}
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><circle cx="12" cy="12" r="10"></circle><line
												x1="4.93"
												y1="4.93"
												x2="19.07"
												y2="19.07"
											></line></svg
										>
									</button>
								{/if}
								<button
									class="text-zinc-400 hover:text-red-500"
									title="Delete"
									onclick={() => {
										if (documentState.activeScene) {
											documentState.activeScene.todoList =
												documentState.activeScene.todoList.filter((t) => t.id !== todo.id);
										}
									}}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
										></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg
									>
								</button>
							</div>
						</div>
					{/if}
				{/each}
				{#if (documentState.activeScene?.todoList || []).length === 0}
					<div class="p-4 text-center text-sm text-zinc-500">No ToDos yet.</div>
				{/if}
			</div>

			<input
				type="text"
				class="w-full rounded border border-zinc-300 bg-white p-2 text-sm shadow-sm placeholder:text-zinc-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
				placeholder="Add a scene to-do..."
				onkeydown={(e) => {
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
				}}
			/>
		</div>
	</div>
</aside>
