import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildUserMessage } from './contextAssembler';
import type { Scene, Project, ReviewRecipe } from '$lib/state/document.svelte';

describe('contextAssembler', () => {
    const mockProject = { id: 'p1', title: 'Test', scenes: [] } as Project;

    it('builds system prompt for lints', () => {
        const scene = {
            id: '1',
            chapterNumber: 1,
            sceneNumber: 1,
            title: 'Test',
            content: '<p>Hello</p>',
            objectivesText: 'Make it scary',
            todoList: [{ id: 't1', text: 'Fix first paragraph', status: 'open', source: 'user', createdAt: 123 }],
            reviewRecipes: [],
            contextItems: [{ id: 'c1', title: 'Character', content: 'John is brave' }],
            annotations: [],
            wordCount: 1
        } as unknown as Scene;

        const recipe = {
            id: 'r1',
            title: 'Review',
            prompt: 'Find pacing issues.',
            isActive: true,
            tier: 'fast',
            outputFormat: 'lints'
        } as ReviewRecipe;

        const prompt = buildSystemPrompt(scene, mockProject, recipe);

        expect(prompt).toContain('You are an expert editor');
        expect(prompt).toContain('CRITICAL: You must output YOUR ENTIRE RESPONSE as a valid JSON object containing a "response" array of objects');
        expect(prompt).toContain('### INSTRUCTIONS (YOUR PRIMARY TASK)\nFind pacing issues.');
        expect(prompt).toContain('### WRITING OBJECTIVES FOR THIS SCENE\nMake it scary');
        expect(prompt).toContain('### BACKGROUND CONTEXT (CHARACTERS / LOCATIONS / LORE)\n**Character**\nJohn is brave');
        expect(prompt).toContain('### CURRENT TO-DOS\n(Do not suggest these again, as they are already tracked)\n[OPEN] Fix first paragraph');
    });

    it('builds system prompt for todos', () => {
        const scene = {
            objectivesText: '',
            todoList: [],
            contextItems: []
        } as unknown as Scene;

        const recipe = {
            prompt: 'Suggest tasks.',
            outputFormat: 'todos'
        } as ReviewRecipe;

        const prompt = buildSystemPrompt(scene, mockProject, recipe);
        expect(prompt).toContain('CRITICAL: You must output YOUR ENTIRE RESPONSE as a valid JSON object containing a "response" array of strings.');
        expect(prompt).toContain('### INSTRUCTIONS (YOUR PRIMARY TASK)\nSuggest tasks.');
    });

    it('builds user message falling back when window is undefined', () => {
        const scene = { content: '<p>Line 1</p><p>Line 2</p>' } as Scene;
        const msg = buildUserMessage(scene);
        expect(msg).toContain('Line 1');
        expect(msg).toContain('Line 2');
    });
});
