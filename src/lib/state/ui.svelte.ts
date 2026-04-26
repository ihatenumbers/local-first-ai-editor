export class UIState {
	showExplorer = $state(true);
	showReviewPanel = $state(true);
	showContextBoard = $state(true);
        showSettings = $state(false);
        
        reviewPanelWidth = $state(320);
        contextPanelWidth = $state(320);}

export const uiState = new UIState();