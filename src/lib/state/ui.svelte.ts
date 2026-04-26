export class UIState {
	showExplorer = $state(true);
	showReviewPanel = $state(true);
	showContextBoard = $state(true);
}

export const uiState = new UIState();
