import { browser } from '$app/environment';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface ReviewRecipe {
        id: string;
        title: string;
        prompt: string;
        isActive: boolean;
        tier: 'fast' | 'balanced' | 'deep';
        outputFormat: 'text' | 'json';
        feedback?: string;
        isGenerating?: boolean;
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

        ydoc = new Y.Doc();
        provider: IndexeddbPersistence | null = null;
        isLoaded = $state(!browser);

        constructor() {
                if (browser) {
                        this.provider = new IndexeddbPersistence('offline-ai-reviewer-doc', this.ydoc);
                        this.provider.on('synced', () => {
                                this.loadFromYjs();
                                this.isLoaded = true;
                                this.setupSync();
                        });
                }
        }

        get activeScene(): Scene | undefined {
                return this.project.scenes.find(s => s.id === this.activeSceneId);
        }

        private loadFromYjs() {
                const projectMap = this.ydoc.getMap('metadata');
                const savedProject = projectMap.get('project') as Project;
                if (savedProject) {
                        this.project = savedProject;
                        if (!this.project.scenes.find(s => s.id === this.activeSceneId)) {
                                this.activeSceneId = this.project.scenes[0]?.id ?? '';
                        }
                } else {
                        try { projectMap.set('project', $state.snapshot(this.project)); } catch(e){}
                }
        }

        private setupSync() {
                let isSyncing = false;

                $effect.root(() => {
                        $effect(() => {
                                const snapshot = $state.snapshot(this.project);
                                if (isSyncing) return;
                                isSyncing = true;
                                const projectMap = this.ydoc.getMap('metadata');
                                try {
                                    projectMap.set('project', snapshot);
                                } catch(e) {
                                    console.error('Yjs set error', e)
                                }
                                isSyncing = false;
                        });
                });
        }
}

export const documentState = new DocumentState();
