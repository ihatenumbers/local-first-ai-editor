Here is a sensible, sequential development roadmap. Since we are using Svelte 5, we will leverage modern `*.svelte.ts` files for our global state instead of the older Svelte 4 stores.

I have broken this down into logical milestones so you can tackle them one by one in VS Code without getting overwhelmed.

### Milestone 1: Global State Management (The Brains)
Before extracting components, we need a central place to hold the data so the panels can talk to each other and the editor.
- [x] **Create `src/lib/state/ui.svelte.ts`:** Move the panel visibility toggles (`showExplorer`, `showContextBoard`, etc.) into a global state object so the Header component can toggle them, and the Main Page can react to them.  Add another state `showReviewPanel`.
- [x] **Create `src/lib/state/document.svelte.ts`:** Define the data structure for your current work. This should hold `currentChapter`, `currentScene`, `wordCount`, the `todoList` array, the `reviewRecipes` array, and the text strings for Characters/Locations/Objectives.
- [x] **Setup Code and Browser tests to confirm Milestone 1 is working **

### Milestone 2: Component Extraction (Cleaning the Shell)
Let's break that massive `+page.svelte` file into modular, manageable pieces inside a new `src/lib/components/` folder.
- [x] **Create `Header.svelte`:** Extract the sticky top toolbar (dashboard, save/load, toggle icons) plus add an extra toggle for ReviewPanel just to the left of the button for ContextPanel.
- [x] **Create `ExplorerPanel.svelte`:** Extract the far-left file tree UI.
- [x] **Create `ReviewPanel.svelte`:** Extract the inner-right panel (Active Recipes & To-Dos).
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
- [ ] **Refactor `document.svelte.ts`:** Create new `Scene` and `Project` interfaces. Move `todoList`, `objectivesText`, and `content` (from Editor) inside the `Scene` interface. Make `ReviewRecipe` and `ContextItem` collections global to the Project.
- [ ] **Implement Active State:** Introduce an `activeSceneId` pointer. Ensure that modifying a local panel updates the specific array living inside that active scene in the project state.
- [ ] **Update `ExplorerPanel.svelte`:** Replace the hardcoded "CH 1 / SC 1" with a dynamically rendering `{#each}` loop over the project's scenes. Allow users to add a new scene and click existing scenes to change the active view.
- [ ] **Update Code and Browser tests to confirm Milestone 4B is working**

### Milestone 4C: Yjs & Offline Storage (Persistence)
This is where the magic happens. We want everything saved to the browser automatically.
- [ ] **Initialize Yjs:** Create a global `Y.Doc` instance in your state manager.
- [ ] **Bind Tiptap to Yjs:** Install `@tiptap/extension-collaboration` and bind your Tiptap instance to a `Y.XmlFragment` inside your Yjs document. *(Note: Even though we are offline and single-player, this extension is the best way to handle Yjs text binding).*
- [ ] **Setup `y-indexeddb`:** Connect your `Y.Doc` to an IndexedDB provider. 
- [ ] **Persist Panel Data:** Sync your `Scene[]`, `ReviewRecipe[]`, and `ContextItem[]` states with `Y.Array` or `Y.Map` within the Yjs document, ensuring your notes and manuscript are saved and versioned together.
- [ ] **Update Code and Browser tests to confirm Milestone 4C is working **

### Milestone 5: API Settings & Context Assembly
Getting ready for the AI integration.
- [ ] **Create a Settings Modal:** Build a simple UI to accept and securely store the user's AI API Key, Base URL (e.g., OpenAI, OpenRouter, or localhost), and Model Name in the browser's `localStorage`.
- [ ] **Build the Context Assembler:** Write a utility function that grabs the current Tiptap text content, grabs the active "Writing Objectives" and "Characters", and concatenates them into a single System Prompt string.
- [ ] **Update Code and Browser tests to confirm Milestones 1, 2, 3, 4 and 5 are working **

### Milestone 6: The AI Review Logic
Wiring up the LLM.
- [ ] **The Fetch Function:** Write a standard `fetch` call matching the OpenAI `/v1/chat/completions` schema.
- [ ] **Trigger Mechanism:** Add "Run" buttons next to your Active Review Recipes. When clicked, it passes the Context Assembled string + the specific Recipe instruction to the LLM.
- [ ] **Handle the Output:** Parse the streaming (or static) JSON response from the LLM and display the feedback cards in the `ReviewPanel.svelte` sidebar.
- [ ] **Update Code and Browser tests to confirm Milestones 1, 2, 3, 4 and 5are working **

### Milestone 7: The "Code Review" UX (Annotations)
Connecting the AI's thoughts back to the specific words in the editor.
- [ ] **Implement Comments:** Add a custom Tiptap mark (or use an open-source comment extension) to allow wrapping text ranges in highlighted backgrounds.
- [ ] **Anchor AI Feedback:** When the AI suggests a fix, write logic to find that sentence in the Tiptap document and wrap it in a comment mark.
- [ ] **Resolve/Ignore:** Add buttons to the AI feedback cards in the sidebar to remove the highlight from the text (Ignore) or trigger a diff/replacement (Resolve).
- [ ] **Update Code and Browser tests to confirm Milestones 1, 2, 3, 4, 5, and 6 are working **

***

**Where to start today:** I recommend tackling **Milestone 1 and 2** first. Getting your folders structured, your Svelte 5 state runes set up, and your UI extracted into neat components will make adding Tiptap and Yjs drastically easier. 

Let me know when you've got the folders set up or if you want the boilerplate code for the `ui.svelte.ts` state file!