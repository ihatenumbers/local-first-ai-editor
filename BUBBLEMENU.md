## Recommendations: in-editor commands via BubbleMenu

Confirmed: project uses `@tiptap/core` directly (no `svelte-tiptap` wrapper). The `@tiptap/extension-bubble-menu` package would need to be added.

### 1. svelte-tiptap vs generic wiring

Go with the **generic wiring** approach. Reasons:
- Adding `svelte-tiptap` means a second abstraction over the editor we already mount manually in [Tiptap.svelte:99](src/lib/components/Tiptap.svelte:99). It would either replace our `new Editor({...})` call or sit awkwardly beside it.
- The generic pattern (`BubbleMenu.configure({ element: bubbleEl })` + `bind:this={bubbleEl}`) is ~15 lines and slots into the existing `$effect` cleanly — no refactor of how the editor is constructed.
- Keeps the dependency surface small (one extension, no wrapper lib churn on Svelte 5).

### 2. Bubble menu vs slash commands

Recommend **bubble menu first, slash later** — not both at once.
- Selection-based actions (`/todo`, `/chat`) fit the bubble pattern naturally: select → bubble appears → click "Todo" or "Chat". Typing `/` on a selection deletes the selection, so a slash command for selection-based anchoring fights the editor.
- Slash commands are better suited to *insertion* (insert heading, insert table, etc.) where there's no selection to lose. We can add that later as a separate Tiptap suggestion extension if needed.

### 3. Anchoring back to text

Reuse the existing `AnnotationMark` mechanism — it already handles lint→todo anchoring and survives edits via ProseMirror's mark mapping. Concretely:
- "Make Todo" from the bubble: wrap selection in an annotation mark with a fresh id, push a todo with `editorId` matching that id (same shape as the lint→todo flow today).
- "Send to Chat": wrap selection in an annotation mark, attach `{ editorId, snippet }` to the *user message* (per-message anchor, not per-recipe — different messages will reference different selections). Clicking the snippet in chat scrolls/highlights the marked range.
- Deleted anchor: if no DOM node matches `data-annotation-id`, gray out the snippet and show "(text removed)". No need to delete the message.

### 4. Open questions for you before I design

1. **Visible highlight for chat anchors?** Todos already get a colored background via the annotation mark. Should chat-anchored selections get their own subtle color (e.g., indigo underline) so users can see what each message refers to in the editor? Or stay invisible until clicked?
2. **Anchor scope for chat:** confirm per-*message* (each user turn can reference different text) rather than per-*recipe* (one persistent anchor for the whole chat).
3. **Bubble buttons MVP:** just `Todo` and `Chat`? Or also include `Comment` (free-form note attached to selection) as a third primitive?

