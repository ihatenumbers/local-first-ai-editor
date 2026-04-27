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
            defaultModelId: 'gpt-4o-mini',
            models: ['gpt-4o-mini', 'gpt-4o']
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

                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1" for="models-{profile.id}">Supported Models (Comma Separated)</label>
                        <input 
                            id="models-{profile.id}"
                            type="text" 
                            value={profile.models.join(', ')}
                            oninput={(e) => profile.models = e.currentTarget.value.split(',').map(m => m.trim()).filter(Boolean)}
                            class="w-full text-sm p-2 border border-zinc-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                            placeholder="gpt-4o, gpt-3.5-turbo"
                        />
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
                        <div>
                            <label class="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1" for="model-{profile.id}">Default Model String</label>
                            <input 
                                id="model-{profile.id}"
                                type="text" 
                                bind:value={profile.defaultModelId}
                                placeholder="gpt-4o, llama3, etc..."
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
