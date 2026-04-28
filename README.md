# Local First Editor with AIReviewer

An AI powered, browser-native, privacy-first writing application. This platform shifts AI usage from "write this for me and lose my voice in the process" to "help me review and improve my writing". It acts as a semantic linter for your prose, with in document commentary, a todo list, plus chapter and scene navigation.

It operates entirely client-side without a backend runtime server. It utilizes local browser storage (IndexedDB) for secure, offline-first saving, and standard AI API endpoints to provide context-aware critiques without altering your base manuscript unless explicitly approved.

## 🛠 Tech Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/) (Configured for Static/SPA deployment)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & Typography/Forms plugins
- **Editor Engine:** [Tiptap](https://tiptap.dev/) (Headless wrapper for ProseMirror)
- **State & Offline Storage:** [Yjs](https://yjs.dev/) + `y-indexeddb`
- **Icons:** [Lucide-Svelte](https://lucide.dev/guide/packages/lucide-svelte)
- **Testing:** Vitest (Unit/Component) & Playwright (E2E)

---

## 🚀 Getting Started (Development)

### Prerequisites

- Node.js (v18 or higher recommended)
- NPM (or pnpm/yarn)

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev

# Or start the server and automatically open it in your browser
npm run dev -- --open
```

---

## 🏗 Building for Production

To create a production-ready, highly optimized static version of the app:

```bash
npm run build
```

You can preview the compiled production build locally with:

```bash
npm run preview
```

> **Note on Deployment:** Because this app is designed to run entirely in the browser without a Node.js server, we will eventually configure SvelteKit to use `@sveltejs/adapter-static` to output pure HTML/CSS/JS files that can be hosted anywhere (GitHub Pages, Cloudflare Pages, Vercel, or a local file server).

---

## 🧪 Testing and Linting

This project is configured with comprehensive testing suites.

**Run Unit & Component Tests (Vitest):**

```bash
npm run test:unit
```

**Run End-to-End Tests (Playwright):**

```bash
npm run test:e2e
```

**Run Linter (ESLint) & Formatter (Prettier):**

```bash
npm run lint
npm run format
```

---

## 🗺 Phase 1 Roadmap (MVP)

- [x] Scaffold SvelteKit project with TypeScript, Tailwind, and testing suites.
- [x] Install core dependencies (Tiptap, Yjs, Lucide).
- [x] **Layout:** Build the responsive, ultrawide 4-column UI shell.
- [x] **Editor:** Implement the base `Tiptap.svelte` component with standard Markdown shortcuts.
- [x] **Persistence:** Integrate Yjs with `y-indexeddb` to ensure document state survives page reloads natively.
- [x] **Context Management:** Build Svelte Stores for managing the "Context Board" (Characters, Story So Far, Writing Objectives).
- [x] **AI Integration:** Implement the standard `/v1/chat/completions` API fetch logic (BYOK - Bring Your Own Key).
- [x] **Review Logic:** Build the `ContextStore` prompt assembly (combining active recipes, context board, and scene text).
- [x] **Critique UI:** Integrate a selection-based annotation system (e.g., `tiptap-comment-extension`) to anchor AI feedback to specific paragraphs.

---

## 🗺 Phase 2 Roadmap (Beta)

- [x] **Enhance Editor:** Enhance the editor controls to include justification, strike-through, formatting, text highlights, task lists, undo/redo, and tables.
- [x] **AI Recipes & ToDos UX:** Recipe-specific highlight colors, drag-and-drop reordering, scrollbar fixes, and background pattern tracking from Lint to ToDo.
- [x] **Selection-based ToDos:** Dynamic binding of selected editor text to manual ToDos with gray annotations.
- [ ] **Collapsible Text Output:** Toggle visibility for raw output on "Text" recipes in the review panel.
- [ ] **AI Chat Panel:** Migrate "Text" recipes to a new Far Right Panel "AI Chat" and implement an interactive conversational AI system.
- [ ] **In Editor AI:** Adding / commands or similar into the editor e.g. /reword /check_story.
- [ ] **Inline Diff/Tracked Changes:** Implement actual inline rewrites and diff views (using tools like `prosemirror-multi-editor-diff` or Tiptap Snapshots) for applying AI suggestions directly.
- [ ] **WebGPU / Local Browser AI:** Support downloading 4GB+ quantized models via WebLLM or Transformers.js for fully local offline AI generation.
- [ ] **Complex Recipe Builder UI:** Create a node-based or slider-based UI for custom prompts.
- [ ] **Full File System Access API Integration:** Export and sync to physical `.md` files on the user's hard drive.
- [ ] **Beta Release:** Build and publish the application for public Beta Testing.

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

_Developed for a distraction-free, privacy-first writing experience._
