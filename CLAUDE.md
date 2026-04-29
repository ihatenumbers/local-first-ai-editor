# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A browser-native, privacy-first writing app. AI is used for editorial review ("semantic linting"), not generation. Everything runs client-side — no backend at runtime. Users bring their own API keys.

## Commands

```bash
npm run dev          # dev server with HMR
npm run build        # production static build
npm run preview      # preview the production build

npm run test:unit    # Vitest unit/component tests
npm run test:e2e     # Playwright end-to-end tests
npm run test         # both suites

npm run lint         # Prettier + ESLint check
npm run format       # Prettier auto-fix
npm run check        # svelte-check type checking
```

## Things not to do

Do not change github branches, do not push or pull up to github.  Use git for diffs etc but not to change the remote.

## Working with the developer

Once the fix or development steps are completed, wait for the developer to test the fix.  The developer will then push the changes up to the git repository and create a new branch.  If things go bad, the developer will git stash and we can start again.

## Architecture

**4-column layout** (ultrawide-first, collapses to drawers on laptops):

| Column | Component | Role |
|--------|-----------|------|
| Far Left | `ExplorerPanel.svelte` | Chapter/scene navigation |
| Center Left | `Tiptap.svelte` | ProseMirror editor via Tiptap |
| Center Right | `ReviewPanel.svelte` | AI lint cards + scene ToDos |
| Far Right | `ContextPanel.svelte` | Writing objectives + context cards |

**State layer** (`src/lib/state/`):
- `document.svelte.ts` — Project/Scene hierarchy, recipes, context items, todo list. Synced via Yjs + `y-indexeddb` (IndexedDB). The `activeSceneId` pointer drives which scene the editor and panels display.
- `ui.svelte.ts` — Panel visibility toggles.
- `settings.svelte.ts` — AI provider profiles (stored in `localStorage`).

**AI flow** (`src/routes/api/ai/review/+server.ts`):
- SvelteKit server route acts as a CORS proxy — the only server-side code.
- Supports OpenAI-compatible endpoints (OpenAI, Anthropic, OpenRouter, local proxies).
- Recipes are typed: `lint` recipes return structured JSON (`original_text`, `suggestion`, `reasoning`); `text` recipes stream plain text.
- `src/lib/utils/contextAssembler.ts` builds the system prompt from active recipes + context board + scene text.
- `src/lib/utils/jsonParser.ts` handles malformed/markdown-wrapped JSON from LLMs.

**Annotations** (`src/lib/components/TiptapAnnotation.ts`):
- Custom Tiptap mark that wraps matched `original_text` spans with a highlight tied to a unique comment ID.
- Resolve/Ignore buttons in `ReviewPanel` remove the mark.

**Persistence**: Yjs `Y.Doc` bound to Tiptap via `@tiptap/extension-collaboration`. Panel data (scenes, recipes, context items) stored in `Y.Array`/`Y.Map` within the same doc, synced to IndexedDB automatically.

## Current Phase

Phase 2 (Beta). The remaining open items from `TODO.md`:
- Collapsible text output on "Text" recipe cards
- AI Chat Panel (new far-right panel, conversational, with per-lint/todo threads)
- In-editor `/` commands (e.g. `/reword`)
- Inline diff / tracked changes view
- WebGPU / local browser AI (WebLLM / Transformers.js)
- File System Access API for `.md` file sync
- Beta release build pipeline
