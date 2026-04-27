import re

with open('src/lib/state/document.svelte.ts', 'r') as f:
    text = f.read()

# Add color to ReviewRecipe
text = text.replace(
    "outputFormat: 'text' | 'lints' | 'todos';",
    "outputFormat: 'text' | 'lints' | 'todos';\n\tcolor?: string;"
)

with open('src/lib/state/document.svelte.ts', 'w') as f:
    f.write(text)
