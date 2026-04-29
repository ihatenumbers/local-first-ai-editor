<script lang="ts">
	import { documentState } from '$lib/state/document.svelte';
	import { settingsState } from '$lib/state/settings.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { exportToFolder, type ExportOptions } from '$lib/utils/exporter';
	import { X, Download, FolderOpen } from 'lucide-svelte';

	let isExporting = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	let options = $state<ExportOptions>({
		story: true,
		scene: false,
		recipes: true,
		todos: true,
		context: true,
		versions: false,
		historyChat: true,
		historyLint: true,
		historyTodo: true,
		settings: true
	});

	function close() {
		uiState.showExportModal = false;
		errorMsg = '';
		successMsg = '';
	}

	async function doExport() {
		isExporting = true;
		errorMsg = '';
		successMsg = '';
		try {
			await exportToFolder(
				documentState.project,
				documentState.activeSceneId,
				documentState.ydoc,
				settingsState,
				options
			);
			successMsg = 'Export complete.';
		} catch (e: any) {
			if (e.name !== 'AbortError') errorMsg = e.message || 'Export failed.';
		} finally {
			isExporting = false;
		}
	}

	const groups = [
		{
			label: 'Text Content',
			items: [
				{ key: 'story', label: 'Whole Story', desc: '/Story/ — final (or active) version of every scene' },
				{ key: 'scene', label: 'Current Scene', desc: '/Scene/ — active version of the open scene only' },
				{ key: 'versions', label: 'All Versions', desc: '/Version/ — every version of every scene' }
			]
		},
		{
			label: 'Data',
			items: [
				{ key: 'recipes', label: 'Recipes', desc: "/Recipe/ — active version's recipe configs (prompt, tier, temp)" },
				{ key: 'todos', label: 'Todos', desc: '/Todo/ — open and ignored todos per scene' },
				{ key: 'context', label: 'Context Board', desc: '/Context/ — context items for active version of each scene' }
			]
		},
		{
			label: 'History',
			items: [
				{ key: 'historyChat', label: 'Chat Histories', desc: '/History/Chat/ — full conversation per chat recipe' },
				{ key: 'historyLint', label: 'Lint Histories', desc: '/History/Lint/ — anchored lint findings per recipe' },
				{ key: 'historyTodo', label: 'Completed Todos', desc: '/History/Todo/ — completed todos per version' }
			]
		},
		{
			label: 'Settings',
			items: [
				{ key: 'settings', label: 'Settings', desc: '/Settings/settings.json — API profiles & tier config (includes API keys)' }
			]
		}
	] as const;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm"
	onclick={(e) => { if (e.target === e.currentTarget) close(); }}
>
	<div
		class="animate-in fade-in zoom-in-95 flex max-h-[85vh] w-[520px] max-w-[90vw] flex-col overflow-hidden rounded-xl bg-white shadow-2xl duration-200"
	>
		<header class="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4">
			<div class="flex items-center gap-2">
				<Download size={18} class="text-indigo-600" />
				<h2 class="text-lg font-bold tracking-tight text-zinc-800">Export Project</h2>
			</div>
			<button
				onclick={close}
				class="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
			>
				<X size={20} />
			</button>
		</header>

		<div class="flex-1 overflow-y-auto p-6">
			<p class="mb-5 text-sm text-zinc-500">
				Choose what to export. You'll be asked to pick an output folder — subdirectories are created automatically.
			</p>

			<div class="space-y-5">
				{#each groups as group}
					<div>
						<h3 class="mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">{group.label}</h3>
						<div class="space-y-1.5">
							{#each group.items as item}
								<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 {options[item.key] ? 'border-indigo-200 bg-indigo-50/50' : ''}">
									<input
										type="checkbox"
										bind:checked={options[item.key]}
										class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
									/>
									<div>
										<div class="text-sm font-semibold text-zinc-800">{item.label}</div>
										<div class="text-xs text-zinc-500">{item.desc}</div>
									</div>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			{#if options.settings}
				<div class="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
					⚠ Settings export includes API keys. Keep the exported file secure and do not share it publicly.
				</div>
			{/if}

			{#if errorMsg}
				<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">{errorMsg}</div>
			{/if}
			{#if successMsg}
				<div class="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">{successMsg}</div>
			{/if}
		</div>

		<footer class="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4">
			<span class="text-xs text-zinc-400">Files are written directly to your chosen folder.</span>
			<button
				onclick={doExport}
				disabled={isExporting || !Object.values(options).some(Boolean)}
				class="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40"
			>
				<FolderOpen size={15} />
				{isExporting ? 'Exporting…' : 'Choose Folder & Export'}
			</button>
		</footer>
	</div>
</div>
