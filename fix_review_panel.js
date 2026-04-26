const fs = require('fs');

const tpPath = 'src/lib/components/ReviewPanel.svelte';
let tpText = fs.readFileSync(tpPath, 'utf8');

// Add settings import
tpText = tpText.replace(
    `import { uiState } from '$lib/state/ui.svelte';`,
    `import { uiState } from '$lib/state/ui.svelte';\n        import { settingsState } from '$lib/state/settings.svelte';`
);

let recipeInit = `id: crypto.randomUUID(),
                                title: 'New Review Instructions',
                                prompt: '',
                                isActive: true`;

let newRecipeInit = `id: crypto.randomUUID(),
                                title: 'New Review Instructions',
                                prompt: '',
                                isActive: true,
                                providerId: settingsState.profiles[0]?.id || '',
                                modelId: settingsState.profiles[0]?.defaultModelId || ''`;

tpText = tpText.replace(recipeInit, newRecipeInit);

let recipeBlock = `<div class="bg-white border border-zinc-200 rounded-md p-3 shadow-sm group">
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
                                        </div>`;

let newRecipeBlock = `<div class="bg-white border border-zinc-200 rounded-md p-3 shadow-sm group">
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
                                                <div class="flex gap-2 mb-2 items-center">
                                                        <select bind:value={recipe.providerId} class="text-xs bg-zinc-50 border border-zinc-200 rounded p-1 text-zinc-600 focus:ring-indigo-500 w-1/3">
                                                                {#each settingsState.profiles as profile}
                                                                        <option value={profile.id}>{profile.name}</option>
                                                                {/each}
                                                        </select>
                                                        <input 
                                                                type="text" 
                                                                bind:value={recipe.modelId} 
                                                                class="text-xs bg-zinc-50 border border-zinc-200 rounded p-1 text-zinc-600 flex-1 focus:ring-indigo-500" 
                                                                placeholder="Model string (e.g. gpt-4o)"
                                                        />
                                                </div>
                                                <textarea 
                                                        bind:value={recipe.prompt}
                                                        class="w-full rounded-md border-zinc-200 text-sm p-2 bg-zinc-50 font-mono resize-none h-20 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-zinc-400" 
                                                        placeholder="Enter AI instruction prompt..."
                                                ></textarea>
                                        </div>`;

tpText = tpText.replace(recipeBlock, newRecipeBlock);

fs.writeFileSync(tpPath, tpText);
console.log('Done');
