import { browser } from '$app/environment';

export interface ProviderProfile {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'gemini' | 'local';
    apiKey: string;
    baseUrl: string;
    defaultModelId: string;
    models: string[];
}

export class SettingsState {
    profiles = $state<ProviderProfile[]>([
        {
            id: 'default-openai',
            name: 'OpenAI (Default)',
            type: 'openai',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            defaultModelId: '',
            models: []
        },
        {
            id: 'default-openrouter',
            name: 'OpenRouter',
            type: 'openai',
            apiKey: '',
            baseUrl: 'https://openrouter.ai/api/v1',
            defaultModelId: '',
            models: []
        },
        {
            id: 'default-ollama',
            name: 'Ollama (Local)',
            type: 'local',
            apiKey: 'ollama',
            baseUrl: 'http://localhost:11434/v1',
            defaultModelId: '',
            models: []
        }
    ]);

    tiers = $state({
        fast: { providerId: 'default-ollama', modelId: '' },
        balanced: { providerId: 'default-openai', modelId: '' },
        deep: { providerId: 'default-openrouter', modelId: '' }
    });

    constructor() {
        if (browser) {
            const storedProfiles = localStorage.getItem('ai-reviewer-profiles');
            if (storedProfiles) {
                try {
                    const parsed = JSON.parse(storedProfiles);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.profiles = parsed.map(p => ({
                            ...p,
                            models: p.models || (p.defaultModelId ? [p.defaultModelId] : [])
                        }));
                    }
                } catch (e) {
                    console.error("Failed to load profiles", e);
                }
            }

            const storedTiers = localStorage.getItem('ai-reviewer-tiers');
            if (storedTiers) {
                try {
                    const parsed = JSON.parse(storedTiers);
                    if (parsed && parsed.fast && parsed.balanced && parsed.deep) this.tiers = parsed;
                } catch (e) {
                    console.error("Failed to load tiers", e);
                }
            }

            $effect.root(() => {
                $effect(() => {
                    localStorage.setItem('ai-reviewer-profiles', JSON.stringify($state.snapshot(this.profiles)));
                    localStorage.setItem('ai-reviewer-tiers', JSON.stringify($state.snapshot(this.tiers)));
                });
            });
        }
    }
}

export const settingsState = new SettingsState();
