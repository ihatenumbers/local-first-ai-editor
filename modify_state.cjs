const fs = require('fs');

// 1. Update document.svelte.ts
const docPath = 'src/lib/state/document.svelte.ts';
let docText = fs.readFileSync(docPath, 'utf8');

docText = docText.replace(/export interface ReviewRecipe \{[^}]+\}/m, `export interface ReviewRecipe {
        id: string;
        title: string;
        prompt: string;
        isActive: boolean;
        tier: 'fast' | 'balanced' | 'deep';
        outputFormat: 'text' | 'json';
}`);

fs.writeFileSync(docPath, docText);


// 2. Update settings.svelte.ts
const setPath = 'src/lib/state/settings.svelte.ts';
let setText = `import { browser } from '$app/environment';

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

    tiers = $state({
        fast: { providerId: 'default-ollama', modelId: 'llama3' },
        balanced: { providerId: 'default-openai', modelId: 'gpt-4o' },
        deep: { providerId: 'default-openrouter', modelId: 'anthropic/claude-3-opus' }
    });

    constructor() {
        if (browser) {
            const storedProfiles = localStorage.getItem('ai-reviewer-profiles');
            if (storedProfiles) {
                try {
                    const parsed = JSON.parse(storedProfiles);
                    if (Array.isArray(parsed) && parsed.length > 0) this.profiles = parsed;
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
`;
fs.writeFileSync(setPath, setText);
console.log('State modifications complete.');
