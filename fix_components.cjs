const fs = require('fs');

// SettingsModal.svelte
let smPath = 'src/lib/components/SettingsModal.svelte';
let smText = fs.readFileSync(smPath, 'utf8');

const newHeading = `<header class="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 shrink-0">`;
const oldHeaderRegex = new RegExp(`<header class="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 shrink-0">[\\s\\S]*?<\\/header>`);

let routingSection = `
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div class="mb-4 space-y-3 pb-6 border-b border-zinc-200">
                <h3 class="text-sm font-bold text-zinc-700 uppercase tracking-wider">Model Routing (Tiers)</h3>
                <p class="text-xs text-zinc-500 mb-2">Assign your configured profiles to specific capability tiers.</p>
                
                {#each (['fast', 'balanced', 'deep'] as const) as tier}
                    <div class="bg-zinc-50 p-3 rounded border border-zinc-200 grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                        <span class="text-xs font-bold text-zinc-700 capitalize">{tier}</span>
                        <select 
                            bind:value={settingsState.tiers[tier].providerId}
                            class="w-full text-xs p-1.5 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            {#each settingsState.profiles as p}
                                <option value={p.id}>{p.name}</option>
                            {/each}
                        </select>
                        <input 
                            type="text" 
                            bind:value={settingsState.tiers[tier].modelId}
                            placeholder="Model ID (e.g. gpt-4o)"
                            class="w-full text-xs p-1.5 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                {/each}
            </div>

            <h3 class="text-sm font-bold text-zinc-700 uppercase tracking-wider">API Profiles</h3>
            <p class="text-xs text-zinc-600 mb-4">
`;
smText = smText.replace(`<div class="flex-1 overflow-y-auto p-6 space-y-6">
            <p class="text-sm text-zinc-600 mb-4">`, routingSection);

fs.writeFileSync(smPath, smText);

// ReviewPanel.svelte
let rpPath = 'src/lib/components/ReviewPanel.svelte';
let rpText = fs.readFileSync(rpPath, 'utf8');

// Replace import to lucide-svelte
rpText = rpText.replace(`import { Plus, Trash2 } from 'lucide-svelte';`, `import { Plus, Trash2, ChevronDown, ChevronRight, MessageSquare, Code } from 'lucide-svelte';`);

// Fix add recipe function
rpText = rpText.replace(/function addRecipe\(\) \{[\s\S]*?\}\s*\}/, `function addRecipe() {
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
        }`);

// Adding expanded array handling state
rpText = rpText.replace(`let isResizing = $state(false);`, `let isResizing = $state(false);\n        let expandedRecipes = $state<Record<string, boolean>>({});`);

// Update Template Loop
const recipeLoopFind = `{#each (documentState.activeScene?.reviewRecipes || []) as recipe (recipe.id)}
                                        <div class="bg-white border border-zinc-200 rounded-md p-3 shadow-sm group">
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
                                        </div>
                                {/each}`;

const recipeLoopReplace = `{#each (documentState.activeScene?.reviewRecipes || []) as recipe (recipe.id)}
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
                                                </div>
                                                
                                                {#if expandedRecipes[recipe.id]}
                                                        <div class="p-3 border-t border-zinc-200 space-y-3 bg-white">
                                                                <div class="flex items-center justify-between">
                                                                        <div class="flex rounded-md shadow-sm">
                                                                                <button 
                                                                                        class="px-2 py-1 text-[10px] font-medium rounded-l-md border border-r-0 {recipe.outputFormat === 'text' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}" 
                                                                                        title="Free-text feedback in sidebar"
                                                                                        onclick={() => recipe.outputFormat = 'text'}>
                                                                                        <MessageSquare size={12} class="inline mr-1" /> Sidebar
                                                                                </button>
                                                                                <button 
                                                                                        class="px-2 py-1 text-[10px] font-medium rounded-r-md border {recipe.outputFormat === 'json' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'}"
                                                                                        title="JSON object output for editor anchors"
                                                                                        onclick={() => recipe.outputFormat = 'json'}>
                                                                                        <Code size={12} class="inline mr-1" /> Inline
                                                                                </button>
                                                                        </div>
                                                                        <select bind:value={recipe.tier} class="text-[10px] font-medium bg-zinc-50 border border-zinc-200 rounded p-1 text-zinc-600 focus:ring-indigo-500 outline-none">
                                                                                <option value="fast">Tier: Fast</option>
                                                                                <option value="balanced">Tier: Balanced</option>
                                                                                <option value="deep">Tier: Deep</option>
                                                                        </select>
                                                                        <button 
                                                                                class="text-zinc-300 hover:text-red-500 transition-colors"
                                                                                title="Delete Recipe"
                                                                                onclick={() => deleteRecipe(recipe.id)}
                                                                        >
                                                                                <Trash2 size={14} />
                                                                        </button>
                                                                </div>

                                                                <textarea 
                                                                        bind:value={recipe.prompt}
                                                                        class="w-full rounded-md border-zinc-200 text-sm p-2 bg-zinc-50 font-mono resize-none h-24 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-zinc-400" 
                                                                        placeholder="Enter AI instruction prompt..."
                                                                ></textarea>
                                                        </div>
                                                {/if}
                                        </div>
                                {/each}`;

rpText = rpText.replace(recipeLoopFind, recipeLoopReplace);

fs.writeFileSync(rpPath, rpText);


console.log('UI modified.');

