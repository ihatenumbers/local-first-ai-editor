export interface ReviewRecipe {
	id: string;
	title: string;
	prompt: string;
	isActive: boolean;
}

export interface ContextItem {
	id: string;
	title: string;
	content: string;
}

export class DocumentState {
        currentChapter = $state(1);
        currentScene = $state(1);
        wordCount = $state(0);

        todoList = $state<string[]>([]);
        reviewRecipes = $state<ReviewRecipe[]>([]);

        objectivesText = $state('');
        
		contextItems = $state<ContextItem[]>([]);
}

export const documentState = new DocumentState();
