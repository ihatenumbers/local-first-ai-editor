import { describe, it, expect } from 'vitest';
import { UIState } from './ui.svelte';

describe('UIState', () => {
	it('initializes with default values', () => {
		const ui = new UIState();
		expect(ui.showExplorer).toBe(true);
		expect(ui.showReviewPanel).toBe(true);
		expect(ui.showContextBoard).toBe(true);
	});

	it('can toggle state', () => {
		const ui = new UIState();
		ui.showExplorer = false;
		expect(ui.showExplorer).toBe(false);
	});
});
