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
            setAnnotation: (id: string) => ReturnType;
            /**
             * Toggle an annotation mark
             */
            toggleAnnotation: (id: string) => ReturnType;
            /**
             * Unset an annotation mark
             */
            unsetAnnotation: (id: string) => ReturnType;
        };
    }
}

export const AnnotationMark = Mark.create<AnnotationOptions>({
    name: 'annotation',
    
    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-annotation-id]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'bg-yellow-200/50 border-b-2 border-yellow-400/50 cursor-pointer hover:bg-yellow-300/50 transition-colors' }), 0];
    },

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-annotation-id'),
                renderHTML: attributes => {
                    if (!attributes.id) {
                        return {};
                    }
                    return {
                        'data-annotation-id': attributes.id,
                    };
                },
            },
        };
    },

    addCommands() {
        return {
            setAnnotation: (id) => ({ commands }) => {
                return commands.setMark(this.name, { id });
            },
            toggleAnnotation: (id) => ({ commands }) => {
                return commands.toggleMark(this.name, { id });
            },
            unsetAnnotation: (id) => ({ commands }) => {
                // To safely remove a specific annotation id without wiping all marks
                // The native `unsetMark` removes all instances of the mark in the selection.
                // We'll need specialized logic if we intend to unset purely by ID. 
                // For MVP, just unsetting the mark or ignoring it is fine.
                return commands.unsetMark(this.name);
            },
        };
    },
});
