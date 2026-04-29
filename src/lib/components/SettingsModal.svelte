<script lang="ts">
	import { uiState } from '$lib/state/ui.svelte';
	import { settingsState } from '$lib/state/settings.svelte';
	import { X, Plus, Trash2 } from 'lucide-svelte';

	function close() {
		uiState.showSettings = false;
	}

	function addProfile() {
		settingsState.profiles.push({
			id: crypto.randomUUID(),
			name: 'New Profile',
			type: 'openai',
			apiKey: '',
			baseUrl: 'https://api.openai.com/v1',
			defaultModelId: '',
			models: []
		});
	}

	function removeProfile(id: string) {
		settingsState.profiles = settingsState.profiles.filter((p) => p.id !== id);
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm transition-opacity"
	onclick={(e) => {
		if (e.target === e.currentTarget) close();
	}}
>
	<div
		class="animate-in fade-in zoom-in-95 flex max-h-[85vh] w-[600px] max-w-[90vw] flex-col overflow-hidden rounded-xl bg-white shadow-2xl duration-200"
	>
		<header
			class="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4"
		>
			<h2 class="text-xl font-bold tracking-tight text-zinc-800">AI Provider Profiles</h2>
			<button
				onclick={close}
				class="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
			>
				<X size={20} />
			</button>
		</header>

		<div class="flex-1 space-y-6 overflow-y-auto p-6">
			<div class="mb-4 space-y-3 border-b border-zinc-200 pb-6">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-bold tracking-wider text-zinc-700 uppercase">Debug AI Calls</h3>
						<p class="text-xs text-zinc-500">
							Log all AI requests and responses (prompts & returned text) to the browser console.
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" bind:checked={settingsState.debugAiCalls} class="peer sr-only" />
						<div
							class="peer h-6 w-11 rounded-full bg-zinc-200 peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
				</div>
			</div>

			<div class="mb-4 space-y-3 border-b border-zinc-200 pb-6">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-bold tracking-wider text-zinc-700 uppercase">Debug AI Calls</h3>
						<p class="text-xs text-zinc-500">
							Log all AI requests and responses (prompts & returned text) to the browser console.
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" bind:checked={settingsState.debugAiCalls} class="peer sr-only" />
						<div
							class="peer h-6 w-11 rounded-full bg-zinc-200 peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
				</div>
			</div>

			<div class="mb-4 space-y-3 border-b border-zinc-200 pb-6">
				<h3 class="text-sm font-bold tracking-wider text-zinc-700 uppercase">
					Model Routing (Tiers)
				</h3>
				<p class="mb-2 text-xs text-zinc-500">
					Assign your configured profiles to specific capability tiers.
				</p>

				{#each ['fast', 'balanced', 'deep'] as const as tier}
					<div
						class="grid grid-cols-[100px_1fr_1fr] items-center gap-3 rounded border border-zinc-200 bg-zinc-50 p-3"
					>
						<span class="text-xs font-bold text-zinc-700 capitalize">{tier}</span>
						<select
							bind:value={settingsState.tiers[tier].providerId}
							onchange={() => {
								const activeProfile = settingsState.profiles.find(
									(p) => p.id === settingsState.tiers[tier].providerId
								);
								if (activeProfile && activeProfile.models.length > 0) {
									settingsState.tiers[tier].modelId = activeProfile.models[0];
								} else {
									settingsState.tiers[tier].modelId = '';
								}
							}}
							class="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
						>
							{#each settingsState.profiles as p}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
						<select
							bind:value={settingsState.tiers[tier].modelId}
							class="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
						>
							{#each settingsState.profiles.find((p) => p.id === settingsState.tiers[tier].providerId)?.models || [] as m}
								<option value={m}>{m}</option>
							{/each}
						</select>
					</div>
				{/each}
			</div>

			<h3 class="text-sm font-bold tracking-wider text-zinc-700 uppercase">API Profiles</h3>
			<p class="mb-4 text-xs text-zinc-600">
				Configure your API keys and endpoints. These are stored locally in your browser's <code
					>localStorage</code
				> securely.
			</p>

			{#each settingsState.profiles as profile (profile.id)}
				<div class="group relative rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
					<button
						class="absolute top-3 right-3 text-zinc-300 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
						onclick={() => removeProfile(profile.id)}
						disabled={settingsState.profiles.length === 1}
						title="Delete Profile"
					>
						<Trash2 size={16} />
					</button>

					<div class="mb-4 grid grid-cols-2 gap-4">
						<div>
							<label
								class="mb-1 block text-xs font-semibold tracking-wide text-zinc-500 uppercase"
								for="name-{profile.id}">Profile Name</label
							>
							<input
								id="name-{profile.id}"
								type="text"
								bind:value={profile.name}
								class="w-full rounded border border-zinc-300 p-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
							/>
						</div>
						<div>
							<label
								class="mb-1 block text-xs font-semibold tracking-wide text-zinc-500 uppercase"
								for="type-{profile.id}">API Type</label
							>
							<select
								id="type-{profile.id}"
								bind:value={profile.type}
								class="w-full rounded border border-zinc-300 bg-white p-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
							>
								<option value="openai">OpenAI (or Compatible)</option>
								<option value="anthropic">Anthropic</option>
								<option value="gemini">Google Gemini</option>
								<option value="local">Local (Ollama/vLLM)</option>
							</select>
						</div>
					</div>

					<div class="mb-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
						<div class="mb-2 flex items-center justify-between">
							<span class="block text-xs font-semibold tracking-wide text-zinc-500 uppercase"
								>Supported Models</span
							>
							<button
								onclick={() => profile.models.push('')}
								class="flex items-center gap-1 rounded bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-200 hover:text-indigo-700"
							>
								<Plus size={12} /> Add Model
							</button>
						</div>
						<div class="max-h-48 space-y-2 overflow-y-auto pr-1">
							{#each profile.models as model, i}
								<div class="group/model flex items-center gap-2">
									<input
										type="text"
										bind:value={profile.models[i]}
										class="flex-1 rounded border border-zinc-300 bg-white p-1 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
										placeholder="e.g. gpt-4o, llama3..."
									/>
									<button
										onclick={() => (profile.models = profile.models.filter((_, idx) => idx !== i))}
										class="p-1 text-zinc-400 opacity-0 transition-opacity group-hover/model:opacity-100 hover:text-red-500"
										title="Remove Model"
									>
										<Trash2 size={14} />
									</button>
								</div>
							{/each}
							{#if profile.models.length === 0}
								<div class="py-1 text-xs text-zinc-400 italic">
									No models configured. Add one above.
								</div>
							{/if}
						</div>
					</div>

					<div class="mb-4">
						<label
							class="mb-1 block text-xs font-semibold tracking-wide text-zinc-500 uppercase"
							for="url-{profile.id}">Base URL</label
						>
						<input
							id="url-{profile.id}"
							type="url"
							bind:value={profile.baseUrl}
							class="w-full rounded border border-zinc-300 p-2 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label
								class="mb-1 block text-xs font-semibold tracking-wide text-zinc-500 uppercase"
								for="key-{profile.id}">API Key</label
							>
							<input
								id="key-{profile.id}"
								type="password"
								autocomplete="new-password"
								bind:value={profile.apiKey}
								placeholder={profile.type === 'local' ? 'Not needed for Local' : 'sk-...'}
								class="w-full rounded border border-zinc-300 p-2 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
							/>
						</div>
					</div>
				</div>
			{/each}

			<button
				class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 py-3 font-medium text-zinc-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
				onclick={addProfile}
			>
				<Plus size={18} /> Add New Profile
			</button>
		</div>

		<footer class="flex shrink-0 justify-end border-t border-zinc-200 bg-zinc-50 px-6 py-4">
			<button
				onclick={close}
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
			>
				Save & Close
			</button>
		</footer>
	</div>
</div>
