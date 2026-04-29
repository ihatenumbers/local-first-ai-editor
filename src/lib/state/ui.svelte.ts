export class UIState {
	showExplorer = $state(true);
	showReviewPanel = $state(true);
	showContextBoard = $state(true);
	showSettings = $state(false);

	reviewPanelWidth = $state(320);
	chatPanelWidth = $state(340);
	contextPanelWidth = $state(320);

	activeChatRecipeId = $state<string | null>(null);

	editorInstance: any = null;
}
export const uiState = new UIState();
