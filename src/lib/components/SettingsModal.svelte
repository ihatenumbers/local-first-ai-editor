<script lang="ts">
    import { uiState } from '$lib/state/ui.svelte';
    import { settingsState } from '$lib/state/settings.svelte';
    import { X, Plus, Trash2 } from 'lucide-svelte';

    function close() {
        uiState.showSettings = false;
    }

    function addProfile() {
        settingsState.profiles.push({
            id: crypto.randomUUID(),
            name: 'New Profile',
            type: 'openai',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            defaultModelId: '',
            models: []
        });
    }

    function removeProfile(id: string) {
        settingsState.profiles = settingsState.profiles.filter(p => p.id !== id);
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm transition-opacity"
    onclick={(e) => { if(e.target === e.currentTarget) close(); }}
>
    <div class="bg-white w-[600px] max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <header class="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 shrink-0">
            <h2 class="text-xl font-bold tracking-tight text-zinc-800">AI Provider Profiles</h2>
            <button onclick={close} class="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors">
                <X size={20} />
            </button>
        </header>

        
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
            
            
            
            <div class="mb-4 space-y-3 pb-6 border-b border-zinc-200">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-sm font-bold text-zinc-700 uppercase tracking-wider">Debug AI Calls</h3>
                        <p class="text-xs text-zinc-500">Log all AI requests and responses (prompts & returned text) to the browser console.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" bind:checked={settingsState.debugAiCalls} class="sr-only peer">
                        <div class="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>

            <div class="mb-4 space-y-3 pb-6 border-b border-zinc-200">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-sm font-bold text-zinc-700 uppercase tracking-wider">Debug AI Calls</h3>
                        <p class="text-xs text-zinc-500">Log all AI requests and responses (prompts & returned text) to the browser console.</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" bind:checked={settingsState.debugAiCalls} class="sr-only peer">
                        <div class="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>

            <div class="mb-4 space-y-3 pb-6 border-b border-zinc-200">
                <h3 class="text-sm font-bold text-zinc-700 uppercase tracking-wider">Model Routing (Tiers)</h3>
                <p class="text-xs text-zinc-500 mb-2">Assign your configured profiles to specific capability tiers.</p>
                
                {#each (['fast', 'balanced', 'deep'] as const) as tier}
                    <div class="bg-zinc-50 p-3 rounded border border-zinc-200 grid grid-cols-[100px_1fr_1fr] gap-3 items-center">
                        <span class="text-xs font-bold text-zinc-700 capitalize">{tier}</span>
                        <select 
                            bind:value={settingsState.tiers[tier].providerId}
                            onchange={() => {
                                const activeProfile = settingsState.profiles.find(p => p.id === settingsState.tiers[tier].providerId);
                                if (activeProfile && activeProfile.models.length > 0) {
                                    settingsState.tiers[tier].modelId = activeProfile.models[0];
                                } else {
                                    settingsState.tiers[tier].modelId = '';
                                }
                            }}
                            class="w-full text-xs p-1.5 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            {#each settingsState.profiles as p}
                                <option value={p.id}>{p.name}</option>
                            {/each}
                        </select>
                        <select 
                            bind:value={settingsState.tiers[tier].modelId}
                            class="w-full text-xs p-1.5 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            {#each (settingsState.profiles.find(p => p.id === settingsState.tiers[tier].providerId)?.models || []) as m}
                                <option value={m}>{m}</option>
                            {/each}
                        </select>
                    </div>
                {/each}
            </div>

            <h3 class="text-sm font-bold text-zinc-700 uppercase tracking-wider">API Profiles</h3>
            <p class="text-xs text-zinc-600 mb-4">

                Configure your API keys and endpoints. These are stored locally in your browser's <code>localStorage</code> securely.
            </p>

            {#each settingsState.profiles as profile (profile.id)}
                <div class="border border-zinc-200 rounded-lg p-5 bg-white shadow-sm relative group">
                    <button 
                        class="absolute top-3 right-3 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        onclick={() => removeProfile(profile.id)}
                        disabled={settingsState.profiles.length === 1}
                        title="Delete Profile"
                    >
                        <Trash2 size={16} />
                    </button>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1" for="name-{profile.id}">Profile Name</label>
                            <input 
                                id="name-{profile.id}"
                                type="text" 
                                bind:value={profile.name}
                                class="w-full text-sm p-2 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1" for="type-{profile.id}">API Type</label>
                            <select 
                                id="type-{profile.id}"
                                bind:value={profile.type}
                                class="w-full text-sm p-2 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
                            >
                                <option value="openai">OpenAI (or Compatible)</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="local">Local (Ollama/vLLM)</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-4 bg-zinc-50 border border-zinc-200 rounded-md p-3">
                        <div class="flex items-center justify-between mb-2">
                            <span class="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">Supported Models</span>
                            <button 
                                onclick={() => profile.models.push('')}
                                class="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                                <Plus size={12} /> Add Model
                            </button>
                        </div>
                        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {#each profile.models as model, i}
                                <div class="flex items-center gap-2 group/model">
                                    <input 
                                        type="text"
                                        bind:value={profile.models[i]}
                                        class="flex-1 text-sm p-1 border border-zinc-300 bg-white rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                        placeholder="e.g. gpt-4o, llama3..."
                                    />
                                    <button 
                                        onclick={() => profile.models = profile.models.filter((_, idx) => idx !== i)}
                                        class="text-zinc-400 hover:text-red-500 p-1 opacity-0 group-hover/model:opacity-100 transition-opacity"
                                        title="Remove Model"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            {/each}
                            {#if profile.models.length === 0}
                                <div class="text-xs text-zinc-400 italic py-1">No models configured. Add one above.</div>
                            {/if}
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1" for="url-{profile.id}">Base URL</label>
                        <input 
                            id="url-{profile.id}"
                            type="url" 
                            bind:value={profile.baseUrl}
                            class="w-full text-sm p-2 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono"
                        />
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1" for="key-{profile.id}">API Key</label>
                            <input 
                                id="key-{profile.id}"
                                type="password" 
                                bind:value={profile.apiKey}
                                placeholder={profile.type === 'local' ? 'Not needed for Local' : 'sk-...'}
                                class="w-full text-sm p-2 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono"
                            />
                        </div>
                    </div>
                </div>
            {/each}

            <button 
                class="w-full py-3 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-500 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                onclick={addProfile}
            >
                <Plus size={18} /> Add New Profile
            </button>
        </div>
        
        <footer class="px-6 py-4 border-t border-zinc-200 bg-zinc-50 shrink-0 flex justify-end">
            <button onclick={close} class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md shadow-sm transition-colors">
                Save & Close
            </button>
        </footer>
    </div>
</div>
