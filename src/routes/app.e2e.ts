import { expect, test } from '@playwright/test';

test('app loads and initializes tiptap', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.ProseMirror')).toBeVisible();
});

test('adds a todo item', async ({ page }) => {
	await page.goto('/');

	const todoInput = page.getByPlaceholder('Add a scene to-do...');

	// If not visible, click the header toggle
	if (!(await todoInput.isVisible())) {
		const headerBtn = page.locator('button', { hasText: 'Review' }).first();
		if (await headerBtn.isVisible()) {
			await headerBtn.click();
		}
	}

	await expect(todoInput).toBeVisible();
	await todoInput.fill('Write an automated E2E test');
	await todoInput.press('Enter');

	const todoItem = page.getByText('Write an automated E2E test');
	await expect(todoItem).toBeVisible();

	// Test completing the todo
	const checkbox = page.locator('input[type="checkbox"]').first();
	await checkbox.check();
	await expect(checkbox).toBeChecked();
});
