import { Mark, mergeAttributes } from '@tiptap/core';

export interface AnnotationOptions {
	HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		annotation: {
			/**
			 * Set an annotation mark
			 */
			setAnnotation: (id: string, color?: string) => ReturnType;
			/**
			 * Toggle an annotation mark
			 */
			toggleAnnotation: (id: string) => ReturnType;
			/**
			 * Unset an annotation mark
			 */
			unsetAnnotation: (id: string, color?: string) => ReturnType;
		};
	}
}

const colorMap: Record<string, string> = {
	yellow: 'bg-yellow-200/50 border-b-2 border-yellow-400/50 hover:bg-yellow-300/50 text-zinc-900',
	red: 'bg-red-200/50 border-b-2 border-red-400/50 hover:bg-red-300/50 text-zinc-900',
	blue: 'bg-blue-200/50 border-b-2 border-blue-400/50 hover:bg-blue-300/50 text-zinc-900',
	green: 'bg-green-200/50 border-b-2 border-green-400/50 hover:bg-green-300/50 text-zinc-900',
	purple: 'bg-purple-200/50 border-b-2 border-purple-400/50 hover:bg-purple-300/50 text-zinc-900',
	pink: 'bg-pink-200/50 border-b-2 border-pink-400/50 hover:bg-pink-300/50 text-zinc-900',
	gray: 'bg-zinc-200/50 border-b-2 border-zinc-400/50 hover:bg-zinc-300/50 text-zinc-900'
};

export const AnnotationMark = Mark.create<AnnotationOptions>({
	name: 'annotation',

	addOptions() {
		return {
			HTMLAttributes: {}
		};
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-annotation-id]'
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		const color = HTMLAttributes['data-color'] || 'yellow';
		const colorClass = colorMap[color] || colorMap['yellow'];

		return [
			'span',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class: `${colorClass} cursor-pointer transition-colors`
			}),
			0
		];
	},

	addAttributes() {
		return {
			id: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-annotation-id'),
				renderHTML: (attributes) => {
					if (!attributes.id) {
						return {};
					}
					return {
						'data-annotation-id': attributes.id
					};
				}
			},
			color: {
				default: 'yellow',
				parseHTML: (element) => element.getAttribute('data-color'),
				renderHTML: (attributes) => {
					if (!attributes.color) {
						return {};
					}
					return {
						'data-color': attributes.color
					};
				}
			}
		};
	},

	addCommands() {
		return {
			setAnnotation:
				(id, color = 'yellow') =>
				({ commands }) => {
					return commands.setMark(this.name, { id, color });
				},
			toggleAnnotation:
				(id) =>
				({ commands }) => {
					return commands.toggleMark(this.name, { id });
				},
			unsetAnnotation:
				(id) =>
				({ commands }) => {
					// To safely remove a specific annotation id without wiping all marks
					// The native `unsetMark` removes all instances of the mark in the selection.
					// We'll need specialized logic if we intend to unset purely by ID.
					// For MVP, just unsetting the mark or ignoring it is fine.
					return commands.unsetMark(this.name);
				}
		};
	}
});
