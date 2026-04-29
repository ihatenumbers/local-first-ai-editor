import type { SceneVersion, Project, ContextItem, ReviewRecipe } from '$lib/state/document.svelte';

export function buildChatSystemPrompt(
	basePrompt: string,
	version: SceneVersion,
	_project: Project,
	liveText?: string
): string {
	let prompt = basePrompt + '\n\n';

	if (version.objectivesText?.trim()) {
		prompt += `### WRITING OBJECTIVES FOR THIS SCENE\n${version.objectivesText.trim()}\n\n`;
	}

	if (version.contextItems?.length > 0) {
		prompt += `### BACKGROUND CONTEXT (CHARACTERS / LOCATIONS / LORE)\n`;
		version.contextItems.forEach((item: ContextItem) => {
			prompt += `**${item.title}**\n${item.content}\n\n`;
		});
	}

	const sceneText =
		liveText ??
		(typeof window !== 'undefined'
			? new DOMParser().parseFromString('', 'text/html').body.textContent
			: '');

	if (sceneText?.trim()) {
		prompt += `### CURRENT SCENE TEXT\n${sceneText.trim()}\n`;
	}

	return prompt;
}

function stripHtml(html: string): string {
	if (typeof window === 'undefined') return html;
	const doc = new DOMParser().parseFromString(html.replace(/<\/p>/g, '\n</p>'), 'text/html');
	return doc.body.textContent || '';
}

export function buildSystemPrompt(
	version: SceneVersion,
	project: Project,
	recipe: ReviewRecipe
): string {
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

	if (version.objectivesText?.trim()) {
		prompt += `### WRITING OBJECTIVES FOR THIS SCENE\n${version.objectivesText.trim()}\n\n`;
	}

	if (version.contextItems?.length > 0) {
		prompt += `### BACKGROUND CONTEXT (CHARACTERS / LOCATIONS / LORE)\n`;
		version.contextItems.forEach((item: ContextItem) => {
			prompt += `**${item.title}**\n${item.content}\n\n`;
		});
	}

	if (version.todoList?.length > 0) {
		prompt += `### CURRENT TODOS\n(Do not suggest these again, as they are already tracked)\n`;
		version.todoList.forEach((todo) => {
			prompt += `[${todo.status.toUpperCase()}] ${todo.text}\n`;
		});
		prompt += `\n`;
	}

	prompt += `### THE MANUSCRIPT SCENE DRAFT\n(Please execute your INSTRUCTIONS strictly on the manuscript provided below)\n`;

	return prompt;
}

export function buildUserMessage(): string {
	return '(Empty Scene)';
}
