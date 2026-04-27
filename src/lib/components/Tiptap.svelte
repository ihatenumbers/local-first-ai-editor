<script lang="ts">
        import { Editor } from '@tiptap/core';
        import StarterKit from '@tiptap/starter-kit';
        import CharacterCount from '@tiptap/extension-character-count';
        import Collaboration from '@tiptap/extension-collaboration';
        import { AnnotationMark } from './TiptapAnnotation';
        import { documentState } from '$lib/state/document.svelte';
        import { uiState } from '$lib/state/ui.svelte';
        import { 
                Bold, 
                Italic, 
                Heading1, 
                Heading2, 
                List, 
                ListOrdered, 
                Quote 
        } from 'lucide-svelte';

        let element: HTMLElement;
        let editor = $state<Editor>();

        let active = $state({
                bold: false,
                italic: false,
                h1: false,
                h2: false,
                bulletList: false,
                orderedList: false,
                blockquote: false
        });

        $effect(() => {
                if (!element || !documentState.isLoaded || !documentState.activeSceneId) return;

                const newEditor = new Editor({
                        element: element,
                        extensions: [
                                StarterKit,
                                AnnotationMark,
                                CharacterCount,
                                Collaboration.configure({
                                        document: documentState.ydoc,
                                        field: 'scene-' + documentState.activeSceneId,
                                })
                        ],
                        editorProps: {
                                attributes: {
                                        class: 'prose prose-zinc prose-lg max-w-none focus:outline-none min-h-[500px]',
                                },
                        },
                        onTransaction: ({ editor: e }) => {
                                active.bold = e.isActive('bold');
                                active.italic = e.isActive('italic');
                                active.h1 = e.isActive('heading', { level: 1 });
                                active.h2 = e.isActive('heading', { level: 2 });
                                active.bulletList = e.isActive('bulletList');
                                active.orderedList = e.isActive('orderedList');
                                active.blockquote = e.isActive('blockquote');
                        },
                        onUpdate: ({ editor: e }) => {
                                if (documentState.activeScene) {
                                        documentState.activeScene.wordCount = e.storage.characterCount.words();
                                }
                        }
                });

                // Initial word count assignment
                if (documentState.activeScene) {
                        documentState.activeScene.wordCount = newEditor.storage.characterCount.words();
                }

                editor = newEditor;
                uiState.editorInstance = newEditor;

                return () => {
                        if (uiState.editorInstance === newEditor) {
                                uiState.editorInstance = null;
                        }
                        newEditor.destroy();
                };
        });

</script>

<div class="flex flex-col w-full h-full">
	{#if editor}
		<div class="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-white pb-3 mb-4 font-sans w-full">
			<button 
				class="p-1.5 rounded transition-colors {active.h1 ? 'bg-zinc-200 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} 
				title="Heading 1"
			>
				<Heading1 size={18} />
			</button>
			<button 
				class="p-1.5 rounded transition-colors {active.h2 ? 'bg-zinc-200 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} 
				title="Heading 2"
			>
				<Heading2 size={18} />
			</button>

			<div class="w-px h-4 bg-zinc-200 mx-1"></div>

			<button 
				class="p-1.5 rounded transition-colors {active.bold ? 'bg-zinc-200 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleBold().run()} 
				title="Bold"
			>
				<Bold size={18} />
			</button>
			<button 
				class="p-1.5 rounded transition-colors {active.italic ? 'bg-zinc-200 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleItalic().run()} 
				title="Italic"
			>
				<Italic size={18} />
			</button>

			<div class="w-px h-4 bg-zinc-200 mx-1"></div>

			<button 
				class="p-1.5 rounded transition-colors {active.bulletList ? 'bg-zinc-200 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleBulletList().run()} 
				title="Bullet List"
			>
				<List size={18} />
			</button>
			<button 
				class="p-1.5 rounded transition-colors {active.orderedList ? 'bg-zinc-200 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleOrderedList().run()} 
				title="Ordered List"
			>
				<ListOrdered size={18} />
			</button>

			<div class="w-px h-4 bg-zinc-200 mx-1"></div>

			<button 
				class="p-1.5 rounded transition-colors {active.blockquote ? 'bg-zinc-200 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleBlockquote().run()} 
				title="Quote"
			>
				<Quote size={18} />
			</button>
		</div>
	{/if}

	<div bind:this={element} class="w-full"></div>
</div>