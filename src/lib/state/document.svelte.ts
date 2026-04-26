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

export interface Scene {
	id: string;
	chapterNumber: number;
	sceneNumber: number;
	title: string;
	content: string;
	objectivesText: string;
	todoList: string[];
        reviewRecipes: ReviewRecipe[];
        contextItems: ContextItem[];
        wordCount: number;
}

export interface Project {
        id: string;
        title: string;
        scenes: Scene[];
}

const defaultSceneId = crypto.randomUUID();

export class DocumentState {
        project = $state<Project>({
                id: crypto.randomUUID(),
                title: 'Untitled Project',
                scenes: [
                        {
                                id: defaultSceneId,
                                chapterNumber: 1,
                                sceneNumber: 1,
                                title: 'Scene 1',
                                content: '',
                                objectivesText: '',
                                todoList: [],
                                reviewRecipes: [],
                                contextItems: [],
                                wordCount: 0
                        }
                
                ]
        });

        activeSceneId = $state<string>(defaultSceneId);

        get activeScene(): Scene | undefined {
                return this.project.scenes.find(s => s.id === this.activeSceneId);
        }
}

export const documentState = new DocumentState();
