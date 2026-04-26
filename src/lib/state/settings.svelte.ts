import { browser } from '$app/environment';

export interface ProviderProfile {
    id: string;
    name: string;
    type: 'openai' | 'anthropic' | 'gemini' | 'local';
    apiKey: string;
    baseUrl: string;
    defaultModelId: string;
}

export class SettingsState {
    profiles = $state<ProviderProfile[]>([
        {
            id: 'default-openai',
            name: 'OpenAI (Default)',
            type: 'openai',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            defaultModelId: 'gpt-4o-mini'
        },
        {
            id: 'default-openrouter',
            name: 'OpenRouter',
            type: 'openai',
            apiKey: '',
            baseUrl: 'https://openrouter.ai/api/v1',
            defaultModelId: 'anthropic/claude-3-haiku'
        },
        {
            id: 'default-ollama',
            name: 'Ollama (Local)',
            type: 'local',
            apiKey: 'ollama',
            baseUrl: 'http://localhost:11434/v1',
            defaultModelId: 'llama3'
        }
    ]);

    constructor() {
        if (browser) {
            const stored = localStorage.getItem('ai-reviewer-profiles');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.profiles = parsed;
                    }
                } catch (e) {
                    console.error("Failed to load profiles", e);
                }
            }

            $effect.root(() => {
                $effect(() => {
                    const snapshot = $state.snapshot(this.profiles);
                    localStorage.setItem('ai-reviewer-profiles', JSON.stringify(snapshot));
                });
            });
        }
    }
}

export const settingsState = new SettingsState();
