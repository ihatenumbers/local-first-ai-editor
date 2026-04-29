<script lang="ts">
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import CharacterCount from '@tiptap/extension-character-count';
	import Collaboration from '@tiptap/extension-collaboration';
	import TextAlign from '@tiptap/extension-text-align';
	import Highlight from '@tiptap/extension-highlight';
	import TaskItem from '@tiptap/extension-task-item';
	import TaskList from '@tiptap/extension-task-list';
	import { Table } from '@tiptap/extension-table';
	import { TableRow } from '@tiptap/extension-table-row';
	import { TableCell } from '@tiptap/extension-table-cell';
	import { TableHeader } from '@tiptap/extension-table-header';
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
		Quote,
		Strikethrough,
		Code,
		Highlighter,
		CheckSquare,
		Undo,
		Redo,
		AlignLeft,
		AlignCenter,
		AlignRight,
		AlignJustify,
		Table as TableIcon
	} from 'lucide-svelte';

	let element: HTMLElement;
	let editor = $state<Editor>();

	let active = $state({
		bold: false,
		italic: false,
		strike: false,
		code: false,
		highlight: false,
		h1: false,
		h2: false,
		bulletList: false,
		orderedList: false,
		taskList: false,
		blockquote: false,
		alignLeft: false,
		alignCenter: false,
		alignRight: false,
		alignJustify: false,
		table: false
	});

	let tooltip = $state({
		visible: false,
		text: '',
		x: 0,
		y: 0
	});

	function handleMouseMove(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const annotationSpan = target.closest('span[data-annotation-id]');

		if (annotationSpan) {
			const id = annotationSpan.getAttribute('data-annotation-id');
			const annotation = documentState.activeVersion?.annotations?.find(
				(a: import('$lib/state/document.svelte').Annotation) => a.id === id && !a.isIgnored
			);

			if (annotation) {
				tooltip = {
					visible: true,
					text:
						annotation.commentary || annotation.reasoning || annotation.suggestion || 'Annotation',
					x: e.clientX,
					y: e.clientY + 24
				};
				return;
			}
		}

		tooltip.visible = false;
	}

	function handleMouseLeave() {
		tooltip.visible = false;
	}

	$effect(() => {
		if (!element || !documentState.isLoaded || !documentState.activeSceneId) return;
		const activeVersionId = documentState.activeScene?.activeVersionId;
		if (!activeVersionId) return;

		const newEditor = new Editor({
			element: element,
			extensions: [
				StarterKit,
				AnnotationMark,
				CharacterCount,
				Highlight,
				TaskList,
				TaskItem.configure({
					nested: true
				}),
				TextAlign.configure({
					types: ['heading', 'paragraph']
				}),
				Table.configure({
					resizable: true
				}),
				TableRow,
				TableHeader,
				TableCell,
				Collaboration.configure({
					document: documentState.ydoc,
					field: 'scene-' + activeVersionId
				})
			],
			editorProps: {
				attributes: {
					class: 'prose prose-zinc prose-lg max-w-none focus:outline-none min-h-[500px]'
				}
			},
			onTransaction: ({ editor: e }) => {
				active.bold = e.isActive('bold');
				active.italic = e.isActive('italic');
				active.strike = e.isActive('strike');
				active.code = e.isActive('code');
				active.highlight = e.isActive('highlight');
				active.h1 = e.isActive('heading', { level: 1 });
				active.h2 = e.isActive('heading', { level: 2 });
				active.bulletList = e.isActive('bulletList');
				active.orderedList = e.isActive('orderedList');
				active.taskList = e.isActive('taskList');
				active.blockquote = e.isActive('blockquote');
				active.alignLeft = e.isActive({ textAlign: 'left' });
				active.alignCenter = e.isActive({ textAlign: 'center' });
				active.alignRight = e.isActive({ textAlign: 'right' });
				active.alignJustify = e.isActive({ textAlign: 'justify' });
				active.table = e.isActive('table');
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

<div class="flex h-full w-full flex-col">
	{#if editor}
		<div
			class="sticky top-0 z-10 mb-4 flex w-full flex-wrap items-center gap-1 border-b border-zinc-200 bg-white pb-3 font-sans"
		>
			<!-- Undo / Redo -->
			<button
				class="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
				onclick={() => editor?.chain().focus().undo().run()}
				title="Undo"
			>
				<Undo size={18} />
			</button>
			<button
				class="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
				onclick={() => editor?.chain().focus().redo().run()}
				title="Redo"
			>
				<Redo size={18} />
			</button>

			<div class="mx-1 h-4 w-px bg-zinc-200"></div>

			<!-- Headings -->
			<button
				class="rounded p-1.5 transition-colors {active.h1
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
				title="Heading 1"
			>
				<Heading1 size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.h2
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
				title="Heading 2"
			>
				<Heading2 size={18} />
			</button>

			<div class="mx-1 h-4 w-px bg-zinc-200"></div>

			<!-- Text Styles -->
			<button
				class="rounded p-1.5 transition-colors {active.bold
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleBold().run()}
				title="Bold"
			>
				<Bold size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.italic
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleItalic().run()}
				title="Italic"
			>
				<Italic size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.strike
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleStrike().run()}
				title="Strikethrough"
			>
				<Strikethrough size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.code
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleCode().run()}
				title="Code"
			>
				<Code size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.highlight
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleHighlight().run()}
				title="Highlight"
			>
				<Highlighter size={18} />
			</button>

			<div class="mx-1 h-4 w-px bg-zinc-200"></div>

			<!-- Alignment -->
			<button
				class="rounded p-1.5 transition-colors {active.alignLeft
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().setTextAlign('left').run()}
				title="Align Left"
			>
				<AlignLeft size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.alignCenter
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().setTextAlign('center').run()}
				title="Align Center"
			>
				<AlignCenter size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.alignRight
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().setTextAlign('right').run()}
				title="Align Right"
			>
				<AlignRight size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.alignJustify
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().setTextAlign('justify').run()}
				title="Justify"
			>
				<AlignJustify size={18} />
			</button>

			<div class="mx-1 h-4 w-px bg-zinc-200"></div>

			<!-- Lists & Quotes -->
			<button
				class="rounded p-1.5 transition-colors {active.bulletList
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleBulletList().run()}
				title="Bullet List"
			>
				<List size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.orderedList
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleOrderedList().run()}
				title="Ordered List"
			>
				<ListOrdered size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.taskList
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleTaskList().run()}
				title="Task List"
			>
				<CheckSquare size={18} />
			</button>
			<button
				class="rounded p-1.5 transition-colors {active.blockquote
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() => editor?.chain().focus().toggleBlockquote().run()}
				title="Quote"
			>
				<Quote size={18} />
			</button>

			<div class="mx-1 h-4 w-px bg-zinc-200"></div>

			<!-- Tables -->
			<button
				class="rounded p-1.5 transition-colors {active.table
					? 'bg-zinc-200 text-zinc-900 shadow-inner'
					: 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}"
				onclick={() =>
					editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
				title="Insert Table"
			>
				<TableIcon size={18} />
			</button>
			{#if active.table}
				<div
					class="flex items-center space-x-1 rounded border border-zinc-200 px-1 text-xs font-semibold text-zinc-500"
				>
					<button
						class="rounded px-1 py-1 hover:bg-zinc-100 hover:text-zinc-900"
						onclick={() => editor?.chain().focus().addColumnBefore().run()}
						title="Add Column Before">+Col Left</button
					>
					<button
						class="rounded px-1 py-1 hover:bg-zinc-100 hover:text-zinc-900"
						onclick={() => editor?.chain().focus().addColumnAfter().run()}
						title="Add Column After">+Col Right</button
					>
					<button
						class="rounded px-1 py-1 text-red-600 hover:bg-zinc-100 hover:text-zinc-900"
						onclick={() => editor?.chain().focus().deleteColumn().run()}
						title="Delete Column">-Col</button
					>
					<div class="mx-1 h-3 w-px bg-zinc-200"></div>
					<button
						class="rounded px-1 py-1 hover:bg-zinc-100 hover:text-zinc-900"
						onclick={() => editor?.chain().focus().addRowBefore().run()}
						title="Add Row Before">+Row Up</button
					>
					<button
						class="rounded px-1 py-1 hover:bg-zinc-100 hover:text-zinc-900"
						onclick={() => editor?.chain().focus().addRowAfter().run()}
						title="Add Row After">+Row Down</button
					>
					<button
						class="rounded px-1 py-1 text-red-600 hover:bg-zinc-100 hover:text-zinc-900"
						onclick={() => editor?.chain().focus().deleteRow().run()}
						title="Delete Row">-Row</button
					>
					<div class="mx-1 h-3 w-px bg-zinc-200"></div>
					<button
						class="rounded px-1 py-1 text-red-600 hover:bg-red-50 hover:text-red-700"
						onclick={() => editor?.chain().focus().deleteTable().run()}
						title="Delete Table">Delete Table</button
					>
				</div>
			{/if}
		</div>
	{/if}

	<div
		bind:this={element}
		class="w-full"
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
		role="presentation"
	></div>
</div>

{#if tooltip.visible && tooltip.text}
	<div
		class="pointer-events-none fixed z-50 max-w-xs rounded border border-zinc-200 bg-white p-3 text-sm font-medium text-zinc-800 shadow-xl"
		style="left: {tooltip.x}px; top: {tooltip.y}px; transform: translate(-50%, 0);"
	>
		{tooltip.text}
	</div>
{/if}
