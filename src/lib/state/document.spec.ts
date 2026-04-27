import { describe, it, expect } from 'vitest';
import { DocumentState } from './document.svelte';

describe('DocumentState', () => {
    it('initializes with default values', () => {
        const doc = new DocumentState();
        expect(doc.activeScene?.chapterNumber).toBe(1);
        expect(doc.activeScene?.sceneNumber).toBe(1);
        expect(doc.activeScene?.wordCount).toBe(0);
        expect(doc.activeScene?.todoList).toEqual([]);
        expect(doc.activeScene?.reviewRecipes.length).toBe(0);
        
        expect(doc.activeScene?.objectivesText).toBe('');
        expect(doc.activeScene?.contextItems.length).toBe(0);
    });

    it('can update values', () => {
        const doc = new DocumentState();
        doc.activeScene!.wordCount = 100;
        const task = { id: '1', text: 'New task', status: 'open' as const, source: 'user' as const, createdAt: 12345 };
        doc.activeScene!.todoList.push(task);
        
        expect(doc.activeScene?.wordCount).toBe(100);
        expect(doc.activeScene?.todoList).toEqual([task]);
    });
});
