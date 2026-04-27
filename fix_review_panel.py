import re

with open('src/lib/components/ReviewPanel.svelte', 'r') as f:
    content = f.read()

# 1. Imports
imports = """	import { dndzone } from 'svelte-dnd-action';
	import {
		Plus,"""
content = content.replace("	import {\n		Plus,", imports)

# 2. DND Handlers
handlers = """	// Migrate string-based todos to structured TodoItems for backward compatibility
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
	}"""
content = re.sub(
    r"	// Migrate string-based todos to structured TodoItems for backward compatibility[\s\S]*?}\n\t\t}\n\t\}\);\n",
    handlers + "\n",
    content
)

# 3. Recipe Loop + DND
recipes_dnd = """			<div 
				class="space-y-3 min-h-[50px]"
				use:dndzone={{items: documentState.activeScene?.reviewRecipes || [], flipDurationMs: 200, dropTargetStyle: {}}}
				onconsider={handleDndConsiderRecipes}
				onfinalize={handleDndFinalizeRecipes}
			>
				{#each documentState.activeScene?.reviewRecipes || [] as recipe (recipe.id)}"""
content = content.replace(
    '			<div class="space-y-3">\n				{#each documentState.activeScene?.reviewRecipes || [] as recipe (recipe.id)}',
    recipes_dnd
)

# 4. Color Picker for Lints
color_picker = """									<select
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
												onclick={() => recipe.color = c}
												class="w-4 h-4 rounded-full border {recipe.color === c || (!recipe.color && c === 'yellow') ? 'border-zinc-900 scale-110' : 'border-black/10'}"
												style="background-color: var(--color-{c}-200, {
													c==='yellow' ? '#fef08a' :
													c==='red' ? '#fecaca' :
													c==='blue' ? '#bfdbfe' :
													c==='green' ? '#bbf7d0' :
													c==='purple' ? '#e9d5ff' : '#fbcfe8'
												})"
												title={c}
											></button>
										{/each}
									</div>
								</div>
								{/if}
								<textarea"""
content = content.replace(
    '									<select\n										bind:value={recipe.tier}\n										class="rounded border border-zinc-200 bg-zinc-50 p-1 text-[10px] font-medium text-zinc-600 outline-none focus:ring-indigo-500"\n									>\n										<option value="fast">Tier: Fast</option>\n										<option value="balanced">Tier: Balanced</option>\n										<option value="deep">Tier: Deep</option>\n									</select>\n								</div>\n\n								<textarea',
    color_picker
)

# 5. Todo Loop + DND
todo_dnd = """				<div 
					class="space-y-2 min-h-[50px]"
					use:dndzone={{items: documentState.activeScene?.todoList || [], flipDurationMs: 200, dropTargetStyle: {}}}
					onconsider={handleDndConsiderTodos}
					onfinalize={handleDndFinalizeTodos}
				>
					{#each documentState.activeScene?.todoList || [] as todo (todo.id)}"""
content = re.sub(
    r'<div class="space-y-2">\s*\{\#each documentState\.activeScene\?\.todoList \|\| \[\] as todo, i \(typeof todo === \'object\' && todo && \'id\' in todo \? todo\.id : i\)\}',
    todo_dnd,
    content
)

with open('src/lib/components/ReviewPanel.svelte', 'w') as f:
    f.write(content)
