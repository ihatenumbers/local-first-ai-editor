import { describe, it, expect } from 'vitest';
import { DocumentState } from './document.svelte';

describe('DocumentState', () => {
    it('initializes with default values', () => {
        const doc = new DocumentState();
        expect(doc.currentChapter).toBe(1);
        expect(doc.currentScene).toBe(1);
        expect(doc.wordCount).toBe(0);
        expect(doc.todoList).toEqual([]);
        expect(doc.reviewRecipes).toEqual([]);
        expect(doc.charactersText).toBe('');
        expect(doc.locationsText).toBe('');
        expect(doc.objectivesText).toBe('');
        expect(doc.storySoFarText).toBe('');
    });

    it('can update values', () => {
        const doc = new DocumentState();
        doc.wordCount = 100;
        doc.todoList.push('New task');
        
        expect(doc.wordCount).toBe(100);
        expect(doc.todoList).toEqual(['New task']);
    });
});
