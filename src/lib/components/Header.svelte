<script lang="ts">
	import {
		PanelLeft,
		PanelRight,
		PanelsLeftRight,
		MessageSquare,
		Settings,
		History,
		CheckSquare,
		Star,
		Download
	} from 'lucide-svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { documentState } from '$lib/state/document.svelte';

	const finalVersion = $derived(
		documentState.activeScene?.versions.find((v) => v.isFinalOutput)
	);

	function loadFinalVersion() {
		const scene = documentState.activeScene;
		if (!scene || !finalVersion) return;
		scene.activeVersionId = finalVersion.id;
	}

	function markCurrentAsFinal() {
		const scene = documentState.activeScene;
		const version = documentState.activeVersion;
		if (!scene || !version) return;
		const wasAlreadyFinal = version.isFinalOutput;
		scene.versions.forEach((v) => (v.isFinalOutput = false));
		if (!wasAlreadyFinal) version.isFinalOutput = true;
	}
</script>

<header
	class="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600"
>
	<div class="flex items-center rounded bg-zinc-100 px-2 py-1 font-mono font-medium">
		{#if documentState.activeScene}
			CH {documentState.activeScene.chapterNumber} <span class="mx-2 text-zinc-300">/</span> SC {documentState
				.activeScene.sceneNumber}
		{/if}
	</div>

	<div class="flex items-center gap-6">
		<div class="flex items-center gap-4">
			{#if documentState.activeScene}
				<span>{documentState.activeScene.wordCount} Words</span>
				<span class="flex items-center gap-1">
					<CheckSquare size={14} />
					{documentState.activeVersion?.todoList.length ?? 0} ToDos
				</span>
			{/if}
		</div>

		<div class="h-4 w-px bg-zinc-200"></div>
		<div class="flex items-center gap-2">
			<button
				class="flex items-center gap-1 transition-colors {documentState.activeVersion?.isFinalOutput
					? 'text-amber-500 hover:text-amber-600'
					: 'hover:text-zinc-900'}"
				title={documentState.activeVersion?.isFinalOutput
					? 'Unmark as Final Output'
					: 'Mark current version as Final Output'}
				onclick={markCurrentAsFinal}
			>
				<Star
					size={14}
					class={documentState.activeVersion?.isFinalOutput ? 'fill-amber-400' : ''}
				/>
				{documentState.activeVersion?.isFinalOutput ? 'Final' : 'Set Final'}
			</button>
			<button
				class="flex items-center gap-1 transition-colors {finalVersion &&
				finalVersion.id !== documentState.activeScene?.activeVersionId
					? 'hover:text-zinc-900'
					: 'cursor-not-allowed opacity-30'}"
				title={finalVersion ? `Restore "${finalVersion.name}"` : 'No Final Output set'}
				onclick={loadFinalVersion}
				disabled={!finalVersion || finalVersion.id === documentState.activeScene?.activeVersionId}
			>
				<History size={14} /> Restore Final
			</button>
			<button
				class="ml-2 flex items-center gap-1 transition-colors {uiState.showVersionsPanel
					? 'text-indigo-600'
					: 'hover:text-zinc-900'}"
				title="Toggle Version Panel"
				onclick={() => (uiState.showVersionsPanel = !uiState.showVersionsPanel)}
			>
				<History size={14} /> Versions
			</button>
		</div>
	</div>

	<div class="flex items-center gap-1">
		<button
			class="rounded p-1.5 transition-colors hover:bg-zinc-100 {uiState.showExplorer
				? 'text-indigo-600'
				: 'text-zinc-400'}"
			onclick={() => (uiState.showExplorer = !uiState.showExplorer)}
			title="Toggle Explorer"
		>
			<PanelLeft size={18} />
		</button>

		<button
			class="rounded p-1.5 transition-colors hover:bg-zinc-100 {uiState.showReviewPanel
				? 'text-indigo-600'
				: 'text-zinc-400'}"
			onclick={() => (uiState.showReviewPanel = !uiState.showReviewPanel)}
			title="Toggle Review Recipes & ToDos"
		>
			<PanelsLeftRight size={18} />
		</button>

		<button
			class="rounded p-1.5 transition-colors hover:bg-zinc-100 {uiState.activeChatRecipeId
				? 'text-indigo-600'
				: 'text-zinc-400'}"
			onclick={() => (uiState.activeChatRecipeId = null)}
			title="Close AI Chat Panel"
		>
			<MessageSquare size={18} />
		</button>

		<button
			class="rounded p-1.5 transition-colors hover:bg-zinc-100 {uiState.showContextBoard
				? 'text-indigo-600'
				: 'text-zinc-400'}"
			onclick={() => (uiState.showContextBoard = !uiState.showContextBoard)}
			title="Toggle Context Board"
		>
			<PanelRight size={18} />
		</button>

		<div class="mx-1 h-4 w-px bg-zinc-200"></div>
		<button
			class="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100"
			title="Export"
			onclick={() => (uiState.showExportModal = true)}
		>
			<Download size={18} />
		</button>
		<button
			class="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100"
			title="Settings"
			onclick={() => (uiState.showSettings = true)}
		>
			<Settings size={18} />
		</button>
	</div>
</header>
