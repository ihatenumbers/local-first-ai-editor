import type { Scene, Project, ContextItem, ReviewRecipe } from '$lib/state/document.svelte';

/**
 * Strips HTML tags from the Editor's HTML output to get clean text for the LLM.
 * We do this safely using browser DOMParser if available.
 */
function stripHtml(html: string): string {
	if (typeof window === 'undefined') return html; // Fallback for SSR tests
	const doc = new DOMParser().parseFromString(html.replace(/<\/p>/g, '\n</p>'), 'text/html');
	return doc.body.textContent || '';
}

/**
 * Builds the comprehensive System Prompt for a specific AI Review Recipe by
 * assembling the current writing objectives, active context items, and the recipe itself.
 */
export function buildSystemPrompt(scene: Scene, project: Project, recipe: ReviewRecipe): string {
	let prompt = `You are an expert editor and writing assistant. You have been hired to review a chapter of a book.\n\n`;

	if (recipe.outputFormat === 'lints') {
		prompt += `CRITICAL: You must output YOUR ENTIRE RESPONSE as a valid JSON object containing a "response" array of objects. Each object must follow exactly this schema:
{ "response": [
  {
    "original_text": "the exact snippet of text from the manuscript you are commenting on",
    "commentary": "your review, critique, or advice for the author regarding this text"
  }
]
}\n\n`;
	} else if (recipe.outputFormat === 'todos') {
		prompt += `CRITICAL: You must output YOUR ENTIRE RESPONSE as a valid JSON object containing a "response" array of strings. Each string is a single bullet point or to-do item for the author to fix.
{ "response": [
  "Fix pacing in paragraph 2",
  "Foreshadow the amulet"
]
}\n\n`;
	}

	prompt += `### INSTRUCTIONS (YOUR PRIMARY TASK)\n${recipe.prompt}\n\n`;

	if (scene.objectivesText && scene.objectivesText.trim().length > 0) {
		prompt += `### WRITING OBJECTIVES FOR THIS SCENE\n${scene.objectivesText.trim()}\n\n`;
	}

	if (scene.contextItems && scene.contextItems.length > 0) {
		prompt += `### BACKGROUND CONTEXT (CHARACTERS / LOCATIONS / LORE)\n`;
		scene.contextItems.forEach((item: ContextItem) => {
			prompt += `**${item.title}**\n${item.content}\n\n`;
		});
	}

	if (scene.todoList && scene.todoList.length > 0) {
		prompt += `### CURRENT TO-DOS\n(Do not suggest these again, as they are already tracked)\n`;
		scene.todoList.forEach((todo) => {
			prompt += `[${todo.status.toUpperCase()}] ${todo.text}\n`;
		});
		prompt += `\n`;
	}

	prompt += `### THE MANUSCRIPT SCENE DRAFT\n(Please execute your INSTRUCTIONS strictly on the manuscript provided below)\n`;

	return prompt;
}

/**
 * Builds the User message payload (the actual text they wrote).
 */
export function buildUserMessage(scene: Scene): string {
	const cleanText =
		typeof window !== 'undefined'
			? new DOMParser().parseFromString(
					scene.content.replace(/<(p|div|br)/gi, '\n<$1'),
					'text/html'
				).body.textContent
			: scene.content.replace(/<[^>]+>/g, '\n');

	return cleanText?.trim() || '(Empty Scene)';
}
