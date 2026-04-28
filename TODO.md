# ToDo Project Tracker

## Done Items

### Milestone 1: Global State Management (The Brains)

Before extracting components, we need a central place to hold the data so the panels can talk to each other and the editor.

- [x] **Create `src/lib/state/ui.svelte.ts`:** Move the panel visibility toggles (`showExplorer`, `showContextBoard`, etc.) into a global state object so the Header component can toggle them, and the Main Page can react to them. Add another state `showReviewPanel`.
- [x] **Create `src/lib/state/document.svelte.ts`:** Define the data structure for your current work. This should hold `currentChapter`, `currentScene`, `wordCount`, the `todoList` array, the `reviewRecipes` array, and the text strings for Characters/Locations/Objectives.
- [x] **Setup Code and Browser tests to confirm Milestone 1 is working **

### Milestone 2: Component Extraction (Cleaning the Shell)

Let's break that massive `+page.svelte` file into modular, manageable pieces inside a new `src/lib/components/` folder.

- [x] **Create `Header.svelte`:** Extract the sticky top toolbar (dashboard, save/load, toggle icons) plus add an extra toggle for ReviewPanel just to the left of the button for ContextPanel.
- [x] **Create `ExplorerPanel.svelte`:** Extract the far-left file tree UI.
- [x] **Create `ReviewPanel.svelte`:** Extract the inner-right panel (Active Recipes & ToDos).
- [x] **Create `ContextPanel.svelte`:** Extract the far-right panel (Writing Objectives, Characters, Locations).
- [x] **Update `+page.svelte`:** Import these new components so your main layout file is clean and just handles the Flexbox structure.
- [x] **Update Code and Browser tests to confirm Milestones 1 and 2 are working **

### Milestone 3: The Tiptap Editor (The Core)

Time to replace the `contenteditable` placeholder with a real, robust text editor.

- [x] **Create `Tiptap.svelte`:** Initialize a vanilla Tiptap instance using `@tiptap/core` and `@tiptap/starter-kit` inside an `onMount` lifecycle hook.
- [x] **Bind the Editor:** Attach the Tiptap instance to a `bind:this` div reference in your Svelte markup.
- [x] **Character/Word Count:** Add the `@tiptap/extension-character-count` plugin and wire its output to your `document.svelte.ts` state so the Header updates as you type.
- [x] **Update Code and Browser tests to confirm Milestones 1, 2 and 3 are working **

### Milestone 4A: Panel Data Structure & CRUD UI

Before persisting, we need reactive data structures for the Review and Context panels.

- [x] **Update `document.svelte.ts`:** Replace simple string/array states with proper typed arrays of objects (e.g., `ReviewRecipe[]` and `ContextItem[]`).
- [x] **ReviewPanel UI (`Active Recipes`):** Build a stack of recipe cards with a checkbox toggle (`isActive`), editable `title`, editable `prompt`, and a delete button. Add an "+ Add Recipe" action.
- [x] **ContextPanel UI (`Context Board`):** Keep a fixed "Writing Objectives" area, but implement a dynamic list of cards for other context items (Characters, Locations, etc.) with editable titles, contents, and delete buttons. Add an "+ Add Context" action.
- [x] **Update Code and Browser tests to confirm Milestone 4A is working**

### Milestone 4B: Project Hierarchy & Navigation

Before attempting to save our flat data state, we must introduce the concept of "Scenes" and "Projects" into our state hierarchy so the "Save" action creates specific scene snapshots.

- [x] **Refactor `document.svelte.ts`:** Create new `Scene` and `Project` interfaces. Move `todoList`, `objectivesText`, and `content` (from Editor) inside the `Scene` interface. Make `ReviewRecipe` and `ContextItem` collections global to the Project.
- [x] **Implement Active State:** Introduce an `activeSceneId` pointer. Ensure that modifying a local panel updates the specific array living inside that active scene in the project state.
- [x] **Update `ExplorerPanel.svelte`:** Replace the hardcoded "CH 1 / SC 1" with a dynamically rendering `{#each}` loop over the project's scenes. Allow users to add a new scene and click existing scenes to change the active view.
- [x] **Update Code and Browser tests to confirm Milestone 4B is working**

### Milestone 4C: Yjs & Offline Storage (Persistence)

This is where the magic happens. We want everything saved to the browser automatically.

- [x] **Initialize Yjs:** Create a global `Y.Doc` instance in your state manager.
- [x] **Bind Tiptap to Yjs:** Install `@tiptap/extension-collaboration` and bind your Tiptap instance to a `Y.XmlFragment` inside your Yjs document. _(Note: Even though we are offline and single-player, this extension is the best way to handle Yjs text binding)._
- [x] **Setup `y-indexeddb`:** Connect your `Y.Doc` to an IndexedDB provider.
- [x] **Persist Panel Data:** Sync your `Scene[]`, `ReviewRecipe[]`, and `ContextItem[]` states with `Y.Array` or `Y.Map` within the Yjs document, ensuring your notes and manuscript are saved and versioned together.
- [x] **Update Code and Browser tests to confirm Milestone 4C is working **

### Milestone 5: AI Provider Profiles & Context Assembly

Getting ready for the AI integration, supporting multiple models and routing specific recipes to specific AI systems.

- [x] **Define AI Profiles State:** Create a store (e.g., in `document.svelte.ts` or a new `settings.svelte.ts`) to manage an array of `ProviderProfile` objects (Name, API Key, Base URL, default Model ID, type: OpenAI/Anthropic/Gemini/Local).
- [x] **Create a Settings Modal:** Build a UI to manage these AI Provider Profiles and save them securely in the browser's `localStorage` or sync them via Yjs conditionally.
- [x] **Bind Recipes to Models:** Update the `ReviewRecipe` interface and the ReviewPanel UI so each recipe has a dropdown to select which `ProviderProfile` and Model it should specifically use (e.g., "Fast Typos" -> Ollama Llama 3; "Deep Critique" -> OpenRouter Claude 3.5 Sonnet).
- [x] **Build the Context Assembler:** Write a utility function that grabs the current Tiptap text content, grabs the active "Writing Objectives" and "Characters", and concatenates them into a single System Prompt string.
- [x] **Update Code and Browser tests to confirm Milestones 5 is working **

### Milestone 6: The AI Review Logic (Async & Streaming)

Wiring up the LLMs with real-time feedback and robust parsing.

- [x] **The Fetch Engine / Proxy:** Write an async fetch handler (a SvelteKit `+server.ts` pass-through route) to handle CORS safely for external APIs.
- [x] **Unified API Adapters:** Build a generalized request handler that formats the request for OpenAI-compatible endpoints and handles Streaming Text vs. JSON modes based on the recipe's configuration.
- [x] **Robust JSON Parsing:** Implement a fallback extractor. If an LLM returns malformed JSON or wraps it in markdown (`json ... `), use regex to strip it. If that fails, optionally trigger a fast retry or pass it to a secondary "JSON Cleaner" function.
- [x] **Trigger Mechanism:** Add "Run" buttons next to your Active Review Recipes. When clicked, it passes the Context + specific Recipe to the chosen Model.
- [x] **Handle Streaming Output:** Process `ReadableStream` chunks so the AI feedback cards in the `ReviewPanel.svelte` sidebar type out in real-time.
- [x] **Update Code and Browser tests to confirm Milestone 6 is working **

### Milestone 7: The "Code Review" UX (Annotations)

Connecting the AI's thoughts back to the specific words in the editor.

- [x] **Exact String Matching Strategy:** Instruct the LLM in JSON-mode recipes to always return `{ "original_text": "...", "suggestion": "...", "reasoning": "..." }` for lints, or flat strings for todos.
- [x] **Implement Comments:** Add a custom Tiptap mark (or use an open-source comment extension) to allow wrapping text ranges in highlighted backgrounds.
- [x] **Anchor AI Feedback:** When the JSON is successfully parsed, write logic that searches the Tiptap document for the exact `original_text` and wraps it in a comment mark tied to a unique ID.
- [x] **Resolve/Ignore:** Add buttons to the AI feedback cards in the sidebar to remove the highlight from the text (Ignore) or trigger a diff/replacement (Resolve).
- [x] **Update Code and Browser tests to confirm Milestones 7 is working **

---

## Still ToDo

### Phase 2: Beta Features

- [x] **Enhance Editor:** Enhance the editor controls to include justification, strike through, code text, text highlight, task lists, undo and redo buttons, create tables etc implemented with Tiptap.
- [x] **AI Recipies and Todo:** Allow lint tasks and todo jobs to be reordered with drag and drop, and add a highlight colour feature for lint so that each recipe can have a different hightlight colour.
- [ ] **UX Design Review (Review Recipes Panel):**
  - Discuss and agree on a UX design for the Review Recipes Panel.
  - Keep "Text" recipes but make the chat output collapsable
  - Fix missing scrollbars on text output cards and lint output cards.
  - Review drag-and-drop mechanics vs text selection on lint cards.
  - Review nested scrollbar issues between the Scene ToDos area and the main panel.
  - Ensure Scene ToDos preserve their assigned background colors when copied from lints and implement missing drag-and-drop.
  - Add ability for ToDos to highlight any selected text and associate that with the ToDo - will will use a light gray background for ToDos with selected text (but if copied from lint then they keep their existing colour)
- [ ] **AI Chat Panel:** Implement a new Far Right Panel "AI Chat" and implement a conversational system.  Connect ToDos and Lints to the chat panel, e.g. each of these will have the potential to their own conversation record
- [ ] **In Editor AI:** Adding / commands or similar into the editor e.g. /reword /check_story.
- [ ] **Inline Diff/Tracked Changes:** Implement actual inline rewrites and diff views (e.g., using `prosemirror-multi-editor-diff` or Tiptap Snapshots).
- [ ] **WebGPU / Local Browser AI:** Integrate WebLLM or Transformers.js to support fully local model execution.
- [ ] **Complex Recipe Builder UI:** Build a graphical (node-based or slider-based) UI for constructing AI prompts and recipes.
- [ ] **File System Access API:** Enable saving and loading folders and physical `.md` files directly to and from the hard drive.
- [ ] **Beta Release:** Configure build pipelines and publish the compiled application as a Beta Test.
