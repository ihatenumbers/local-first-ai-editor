Here is the Product Requirements Document (PRD) for the Phase 1 MVP. This acts as our blueprint, explicitly outlining what we are building right now and what is being deferred, ensuring we don't succumb to feature creep.

***

# Product Requirements Document (PRD)
**Project:** Offline AI Writer & Semantic Reviewer (Phase 2 Beta)
**Date:** April 27, 2026

## 1. Executive Summary
A browser-native, privacy-first writing application designed for serious authors. The platform shifts AI usage from "generative writing" to "editorial review," acting as a semantic linter. It operates entirely client-side without a runtime server, utilizing local browser storage and standard AI API endpoints to provide context-aware critiques without altering the user's base manuscript unless explicitly approved.

## 2. Core Technology Stack
* **Application Framework:** SvelteKit (configured for Static Site Generation / Single Page App).
* **Styling:** Tailwind CSS (for rapid, responsive multi-pane layouts).
* **Editor Engine:** Tiptap (Headless wrapper for ProseMirror).
* **State & Offline Persistence:** Yjs integrated with `y-indexeddb`.
* **Icons:** Lucide-Svelte.

## 3. User Interface Architecture
The application will utilize an ultrawide-optimized 4-column layout, which gracefully degrades to drawers/popovers on laptop displays.

* **Column 1: Navigation / File System (Far Left)**
    * File tree for chapter and scene navigation.
    * *Phase 1 implementation:* Mocked internal list managed by Svelte State, paving the way for the File System Access API.
* **Column 2: The Canvas (Center Left)**
    * The core Tiptap writing environment.
    * Visually constrained to an optimal reading width (e.g., ~65-80 characters / `max-w-2xl`).
    * Supports standard Markdown shortcuts via Tiptap Starter Kit.
* **Column 3: The Active Review / Inbox (Center Right)**
    * Displays AI-generated critiques natively aligned with the corresponding paragraphs.
    * Uses a localized commenting model (e.g., `tiptap-comment-extension`) rather than inline text replacement.
    * **Review Recipes Panel:** A dynamic array of modular "Recipe Cards." Each card has an active toggle switch (boolean), an editable title, an editable prompt instruction, and a delete button. Recipes can be toggled on/off to assemble custom semantic linting criteria.
* **Column 4: The Context Board (Far Right)**
    * **Writing Objectives:** A fixed, permanent text area capturing the immediate scene goals.
    * **Dynamic Context Items:** A vertically stacked list of editable cards (for *Characters, Locations, Lore, etc.*), each featuring a configurable title and content body, which can be created, edited, and deleted dynamically.

## 4. Functional Requirements

### 4.1 Local Storage & Document State
* **Offline First:** The application must not require an external database to save work. 
* **Continuous Save:** All editor changes and panel updates must stream into Yjs and persist in the browser's IndexedDB automatically.
* **Session Recovery:** Users must be able to close the browser, reopen the app, and find their exact document state restored.

### 4.2 The `ContextStore` & AI Integration
* **Bring Your Own Key (BYOK):** The settings panel will accept an API Key and a Base URL, strictly utilizing the standard `/v1/chat/completions` schema to support OpenAI, Anthropic, OpenRouter, or local proxy endpoints.
* **Prompt Assembly (`ContextStore`):** When a user triggers a review, the application must automatically assemble a system prompt combining:
    1.  The active "Review Recipe" string.
    2.  The content of the Context Board panels (Objectives, Characters, etc.).
    3.  The active scene text from the Tiptap editor.
* **Targeted Critiques:** The AI must be prompted to return structured responses (e.g., JSON containing the critique and a text snippet/reference) so the app can anchor the comment to the correct paragraph in Column 3.

## 5. Non-Functional Requirements
* **Zero Server Runtime:** The application must compile to static HTML/CSS/JS. There will be no Node.js server required at runtime.
* **Privacy:** The user's text must never leave their local machine unless they explicitly trigger an AI review, at which point it is sent only to the API endpoint they configured.

## 6. Phase 2 Requirements
* **Enhanced Editor:** Enhance the editor controls to include justification, strike through, code text, text highlight, task lists, undo and redo buttons, create tables etc implemented with Tiptap.
* **AI Recipies and Todo:** Allow lint tasks and todo jobs to be reordered with drag and drop.
* **AI Chat Panel:** Migrate "Text" recipes to a new Far Right Panel "AI Chat" and implement a conversational system.
* **In Editor AI:** Adding / commands or similar into the editor e.g. /reword /check_story.
* **Inline Diff/Tracked Changes:** Implement actual inline rewrites and diff views (using tools like `prosemirror-multi-editor-diff` or Tiptap Snapshots) for applying AI suggestions directly.
* **WebGPU / Local Browser AI:** Support downloading 4GB+ quantized models via WebLLM or Transformers.js for fully local offline AI generation.
* **Complex Recipe Builder UI:** Create a node-based or slider-based UI for custom prompts.
* **Full File System Access API Integration:** Export and sync to physical `.md` files on the user's hard drive.
* **Beta Release:** Build and publish the application for public Beta Testing.

***