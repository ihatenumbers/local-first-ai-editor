export class DocumentState {
	currentChapter = $state(1);
	currentScene = $state(1);
	wordCount = $state(0);
	
	todoList = $state<string[]>([]);
	reviewRecipes = $state<string[]>([]);
	
	charactersText = $state('');
	locationsText = $state('');
	objectivesText = $state('');
	storySoFarText = $state('');
}

export const documentState = new DocumentState();
