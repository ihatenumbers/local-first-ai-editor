<script lang="ts">
	// We will import our Tiptap and Sidebar components here soon!
</script>

<main class="flex h-screen w-full overflow-hidden bg-zinc-50 text-zinc-900 font-sans">

	<aside class="hidden lg:flex w-64 flex-col border-r border-zinc-200 bg-zinc-100/50 p-4">
		<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Explorer</h2>
		<div class="flex-1 overflow-y-auto">
			<p class="text-sm text-zinc-400 italic">File tree will go here...</p>
		</div>
	</aside>

	<section class="flex flex-1 flex-col overflow-y-auto bg-white relative shadow-sm z-10">
		<header class="sticky top-0 border-b border-zinc-100 bg-white/80 backdrop-blur px-8 py-4 z-20">
			<h1 class="text-lg font-semibold text-zinc-800">Chapter 1: The Beginning</h1>
		</header>
		
		<div class="mx-auto w-full max-w-2xl px-8 py-12">
			<p class="text-zinc-400 italic">Tiptap editor will mount here...</p>
		</div>
	</section>

	<aside class="hidden xl:flex w-80 flex-col border-l border-zinc-200 bg-zinc-50 p-4">
		<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">AI Review</h2>
		<div class="flex-1 overflow-y-auto space-y-4">
			<div class="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
				<p class="text-xs font-semibold text-indigo-600 mb-1">Suggestion</p>
				<p class="text-sm text-zinc-600">Consider showing rather than telling in this paragraph. What does the room smell like?</p>
			</div>
		</div>
	</aside>

	<aside class="hidden 2xl:flex w-80 flex-col border-l border-zinc-200 bg-zinc-100/50 p-4">
		<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Context Board</h2>
		<div class="flex-1 overflow-y-auto space-y-6">
			
			<div>
				<h3 class="text-sm font-semibold text-zinc-700 mb-2">Writing Objectives</h3>
				<textarea class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white resize-none h-24" placeholder="Scene goals..."></textarea>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-zinc-700 mb-2">Review Recipes</h3>
				<textarea class="w-full rounded-md border-zinc-300 shadow-sm text-sm p-2 bg-white font-mono resize-none h-32" placeholder="1. Check for passive voice&#10;2. Analyze sensory details"></textarea>
			</div>

		</div>
	</aside>

</main>