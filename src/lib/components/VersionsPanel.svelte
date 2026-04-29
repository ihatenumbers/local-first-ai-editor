<script lang="ts">
	import { documentState, type SceneVersion } from '$lib/state/document.svelte';
	import { Plus, Star, Trash2 } from 'lucide-svelte';

	function switchVersion(versionId: string) {
		const scene = documentState.activeScene;
		if (scene) scene.activeVersionId = versionId;
	}

	function createVersion() {
		const scene = documentState.activeScene;
		const currentVersion = documentState.activeVersion;
		if (!scene || !currentVersion) return;

		const newVersionId = crypto.randomUUID();

		// Clone Yjs text content from current version's fragment to the new one
		const sourceFragment = documentState.ydoc.getXmlFragment('scene-' + currentVersion.id);
		const targetFragment = documentState.ydoc.getXmlFragment('scene-' + newVersionId);
		documentState.ydoc.transact(() => {
			sourceFragment.toArray().forEach((item: any) => {
				targetFragment.push([item.clone()]);
			});
		});

		const newVersion: SceneVersion = {
			id: newVersionId,
			name: `Version ${scene.versions.length + 1}`,
			isFinalOutput: false,
			createdAt: Date.now(),
			objectivesText: currentVersion.objectivesText,
			todoList: JSON.parse(JSON.stringify(currentVersion.todoList)),
			reviewRecipes: JSON.parse(
				JSON.stringify(
					currentVersion.reviewRecipes.map((r) => ({
						...r,
						feedback: '',
						isGenerating: false,
						chatHistory: []
					}))
				)
			),
			contextItems: JSON.parse(JSON.stringify(currentVersion.contextItems)),
			annotations: []
		};

		scene.versions.push(newVersion);
		scene.activeVersionId = newVersionId;
	}

	function deleteVersion(versionId: string) {
		const scene = documentState.activeScene;
		if (!scene || scene.versions.length <= 1) return;
		const idx = scene.versions.findIndex((v) => v.id === versionId);
		scene.versions = scene.versions.filter((v) => v.id !== versionId);
		if (scene.activeVersionId === versionId) {
			scene.activeVersionId = scene.versions[Math.max(0, idx - 1)].id;
		}
	}

	function toggleFinalOutput(versionId: string) {
		const scene = documentState.activeScene;
		if (!scene) return;
		const target = scene.versions.find((v) => v.id === versionId);
		if (!target) return;
		const wasAlreadyFinal = target.isFinalOutput;
		scene.versions.forEach((v) => (v.isFinalOutput = false));
		if (!wasAlreadyFinal) target.isFinalOutput = true;
	}
</script>

<div
	class="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-zinc-200 bg-zinc-50/80 px-4 py-2"
>
	<span class="shrink-0 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
		>Versions</span
	>
	<div class="mx-1 h-3 w-px shrink-0 bg-zinc-200"></div>

	{#each documentState.activeScene?.versions || [] as version (version.id)}
		{@const isActive = version.id === documentState.activeScene?.activeVersionId}
		<div class="group/v flex shrink-0 items-stretch">
			{#if isActive}
				<input
					type="text"
					bind:value={version.name}
					class="w-28 rounded-l border border-r-0 border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
				/>
			{:else}
				<button
					onclick={() => switchVersion(version.id)}
					class="flex items-center gap-1 rounded-l border border-r-0 border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
				>
					{#if version.isFinalOutput}
						<Star size={10} class="fill-amber-400 text-amber-400" />
					{/if}
					{version.name}
				</button>
			{/if}

			<button
				onclick={() => toggleFinalOutput(version.id)}
				title={version.isFinalOutput ? 'Unmark Final Output' : 'Mark as Final Output'}
				class="border border-r-0 px-1.5 py-1 text-xs transition-colors {version.isFinalOutput
					? 'border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100'
					: 'border-zinc-200 bg-white text-zinc-300 hover:bg-zinc-50 hover:text-amber-400'}"
			>
				<Star size={10} class={version.isFinalOutput ? 'fill-amber-400' : ''} />
			</button>

			{#if (documentState.activeScene?.versions.length ?? 0) > 1}
				<button
					onclick={() => deleteVersion(version.id)}
					title="Delete Version"
					class="rounded-r border border-zinc-200 bg-white px-1.5 py-1 text-zinc-300 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
				>
					<Trash2 size={10} />
				</button>
			{:else}
				<span class="rounded-r border border-zinc-200 bg-white px-1.5"></span>
			{/if}
		</div>
	{/each}

	<button
		onclick={createVersion}
		class="flex shrink-0 items-center gap-1 rounded border border-dashed border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
	>
		<Plus size={12} /> New Version
	</button>
</div>
