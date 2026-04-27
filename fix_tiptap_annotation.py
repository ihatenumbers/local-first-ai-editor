import re

with open('src/lib/components/TiptapAnnotation.ts', 'r') as f:
    text = f.read()

# Commands interface
text = text.replace(
    'setAnnotation: (id: string) => ReturnType;',
    'setAnnotation: (id: string, color?: string) => ReturnType;'
)

# Color Map
color_map = """const colorMap: Record<string, string> = {
	yellow: 'bg-yellow-200/50 border-b-2 border-yellow-400/50 hover:bg-yellow-300/50 text-zinc-900',
	red: 'bg-red-200/50 border-b-2 border-red-400/50 hover:bg-red-300/50 text-zinc-900',
	blue: 'bg-blue-200/50 border-b-2 border-blue-400/50 hover:bg-blue-300/50 text-zinc-900',
	green: 'bg-green-200/50 border-b-2 border-green-400/50 hover:bg-green-300/50 text-zinc-900',
	purple: 'bg-purple-200/50 border-b-2 border-purple-400/50 hover:bg-purple-300/50 text-zinc-900',
	pink: 'bg-pink-200/50 border-b-2 border-pink-400/50 hover:bg-pink-300/50 text-zinc-900'
};

export const AnnotationMark"""
text = text.replace('export const AnnotationMark', color_map)

# renderHTML
render_html_old = """	renderHTML({ HTMLAttributes }) {
		return [
			'span',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class:
					'bg-yellow-200/50 border-b-2 border-yellow-400/50 cursor-pointer hover:bg-yellow-300/50 transition-colors'
			}),
			0
		];
	},"""
render_html_new = """	renderHTML({ HTMLAttributes }) {
		const color = HTMLAttributes['data-color'] || 'yellow';
		const colorClass = colorMap[color] || colorMap['yellow'];
		
		return [
			'span',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				class: `${colorClass} cursor-pointer transition-colors`
			}),
			0
		];
	},"""
text = text.replace(render_html_old, render_html_new)

# addAttributes
add_attr_old = """	addAttributes() {
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
			}
		};
	},"""
add_attr_new = """	addAttributes() {
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
	},"""
text = text.replace(add_attr_old, add_attr_new)

# addCommands
add_cmd_old = """			setAnnotation:
				(id) =>
				({ commands }) => {
					return commands.setMark(this.name, { id });
				},"""
add_cmd_new = """			setAnnotation:
				(id, color = 'yellow') =>
				({ commands }) => {
					return commands.setMark(this.name, { id, color });
				},"""
text = text.replace(add_cmd_old, add_cmd_new)

with open('src/lib/components/TiptapAnnotation.ts', 'w') as f:
    f.write(text)
