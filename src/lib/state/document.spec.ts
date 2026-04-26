import { describe, it, expect } from 'vitest';
import { DocumentState } from './document.svelte';

describe('DocumentState', () => {
    it('initializes with default values', () => {
        const doc = new DocumentState();
        expect(doc.currentChapter).toBe(1);
        expect(doc.currentScene).toBe(1);
        expect(doc.wordCount).toBe(0);
        expect(doc.todoList).toEqual([]);
        expect(doc.reviewRecipes.length).toBe(2);
        
        expect(doc.objectivesText).toBe('Establish the tension between the two leads. Raise the stakes for the next chapter.');
        expect(doc.contextItems.length).toBe(2);
    });

    it('can update values', () => {
        const doc = new DocumentState();
        doc.wordCount = 100;
        doc.todoList.push('New task');
        
        expect(doc.wordCount).toBe(100);
        expect(doc.todoList).toEqual(['New task']);
    });
});
