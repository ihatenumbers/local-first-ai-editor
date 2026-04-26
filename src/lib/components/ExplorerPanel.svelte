<script lang="ts">
	import { documentState } from '$lib/state/document.svelte';
</script>

<aside class="w-64 flex-col border-r border-zinc-200 bg-zinc-100/50 flex shrink-0 transition-all">
	<div class="p-4 border-b border-zinc-200/60">
		<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500">Explorer</h2>
	</div>
	<div class="flex-1 overflow-y-auto p-4">
		<div class="text-sm text-zinc-600 font-medium cursor-pointer hover:text-zinc-900">
			CH {documentState.currentChapter}
			<div class="ml-4 mt-1 text-zinc-500 font-normal">SC {documentState.currentScene}</div>
		</div>
	</div>
</aside>