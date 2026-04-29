import * as Y from 'yjs';
import type { Project, SceneVersion } from '$lib/state/document.svelte';
import type { SettingsState } from '$lib/state/settings.svelte';

// ─── Yjs → Markdown ──────────────────────────────────────────────────────────

function deltaToMarkdown(delta: any[]): string {
	return delta
		.map((op: any) => {
			if (typeof op.insert !== 'string') return '';
			const t = op.insert;
			const a = op.attributes || {};
			if (a.code) return `\`${t}\``;
			if (a.bold && a.italic) return `***${t}***`;
			if (a.bold) return `**${t}**`;
			if (a.italic) return `*${t}*`;
			if (a.strike) return `~~${t}~~`;
			return t;
		})
		.join('');
}

function getInlineContent(el: Y.XmlElement): string {
	let text = '';
	el.forEach((child: any) => {
		if (child instanceof Y.XmlText) {
			text += deltaToMarkdown(child.toDelta());
		} else if (child instanceof Y.XmlElement) {
			if (child.nodeName === 'hardBreak') text += '\n';
			else text += getInlineContent(child);
		}
	});
	return text;
}

function getPlainText(el: Y.XmlElement): string {
	let text = '';
	el.forEach((child: any) => {
		if (child instanceof Y.XmlText) text += child.toString();
		else if (child instanceof Y.XmlElement) text += getPlainText(child);
	});
	return text;
}

function listItemContent(el: Y.XmlElement, depth: number): string {
	const parts: string[] = [];
	el.forEach((child: any) => {
		if (!(child instanceof Y.XmlElement)) return;
		if (child.nodeName === 'paragraph') {
			parts.push(getInlineContent(child));
		} else if (['bulletList', 'orderedList', 'taskList'].includes(child.nodeName)) {
			const nested = blockToMarkdown(child, depth + 1);
			parts.push(
				nested
					.split('\n')
					.map((l) => '  ' + l)
					.join('\n')
			);
		}
	});
	return parts.join('\n');
}

function blockToMarkdown(el: Y.XmlElement, depth = 0): string {
	const name = el.nodeName;

	if (name === 'paragraph') return getInlineContent(el);

	if (name === 'heading') {
		const level = Number(el.getAttribute('level') ?? 1);
		return '#'.repeat(level) + ' ' + getInlineContent(el);
	}

	if (name === 'blockquote') {
		const inner: string[] = [];
		el.forEach((child: any) => {
			if (child instanceof Y.XmlElement) {
				const md = blockToMarkdown(child, depth);
				if (md) inner.push(md);
			}
		});
		return inner.map((l) => '> ' + l).join('\n');
	}

	if (name === 'codeBlock') {
		const lang = el.getAttribute('language') ?? '';
		return `\`\`\`${lang}\n${getPlainText(el)}\n\`\`\``;
	}

	if (name === 'bulletList') {
		const items: string[] = [];
		el.forEach((child: any) => {
			if (child instanceof Y.XmlElement && child.nodeName === 'listItem')
				items.push('- ' + listItemContent(child, depth));
		});
		return items.join('\n');
	}

	if (name === 'orderedList') {
		const items: string[] = [];
		let i = 1;
		el.forEach((child: any) => {
			if (child instanceof Y.XmlElement && child.nodeName === 'listItem') {
				items.push(`${i}. ` + listItemContent(child, depth));
				i++;
			}
		});
		return items.join('\n');
	}

	if (name === 'taskList') {
		const items: string[] = [];
		el.forEach((child: any) => {
			if (child instanceof Y.XmlElement && child.nodeName === 'taskItem') {
				const checked = child.getAttribute('checked') === 'true';
				items.push((checked ? '- [x] ' : '- [ ] ') + listItemContent(child, depth));
			}
		});
		return items.join('\n');
	}

	if (name === 'horizontalRule') return '---';

	// table, unknown → best-effort plain text
	return getPlainText(el);
}

export function yjsFragmentToMarkdown(fragment: Y.XmlFragment): string {
	const blocks: string[] = [];
	fragment.forEach((child: any) => {
		if (child instanceof Y.XmlElement) {
			const md = blockToMarkdown(child, 0);
			blocks.push(md);
		}
	});
	// Join blocks with double newlines, but collapse 3+ blank lines
	return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function getVersionText(ydoc: Y.Doc, versionId: string): string {
	return yjsFragmentToMarkdown(ydoc.getXmlFragment('scene-' + versionId));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fm(fields: Record<string, unknown>): string {
	const lines = ['---'];
	for (const [k, v] of Object.entries(fields)) {
		if (v !== undefined && v !== null) lines.push(`${k}: ${JSON.stringify(v)}`);
	}
	lines.push('---\n\n');
	return lines.join('\n');
}

export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 40);
}

async function writeFile(
	root: FileSystemDirectoryHandle,
	pathSegments: string[],
	filename: string,
	content: string
): Promise<void> {
	let dir: FileSystemDirectoryHandle = root;
	for (const seg of pathSegments) {
		dir = await dir.getDirectoryHandle(seg, { create: true });
	}
	const fh = await dir.getFileHandle(filename, { create: true });
	const writable = await fh.createWritable();
	await writable.write(content);
	await writable.close();
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface ExportOptions {
	story: boolean;
	scene: boolean;
	recipes: boolean;
	todos: boolean;
	context: boolean;
	versions: boolean;
	historyChat: boolean;
	historyLint: boolean;
	historyTodo: boolean;
	settings: boolean;
}

export async function exportToFolder(
	project: Project,
	activeSceneId: string,
	ydoc: Y.Doc,
	settings: SettingsState,
	options: ExportOptions
): Promise<void> {
	const root: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
		mode: 'readwrite'
	});

	const now = new Date().toISOString();

	for (const scene of project.scenes) {
		const sk = `ch${scene.chapterNumber}sc${scene.sceneNumber}`;
		const isActive = scene.id === activeSceneId;
		const activeVersion = scene.versions.find((v) => v.id === scene.activeVersionId);

		// ── Story (/Story/ch1sc1.md — final or active version) ──────────────
		if (options.story) {
			const v = scene.versions.find((v) => v.isFinalOutput) ?? activeVersion;
			if (v) {
				const vi = scene.versions.indexOf(v) + 1;
				await writeFile(
					root,
					['Story'],
					`${sk}.md`,
					fm({
						type: 'story',
						chapter: scene.chapterNumber,
						scene: scene.sceneNumber,
						scene_title: scene.title,
						version: vi,
						version_name: v.name,
						is_final: v.isFinalOutput,
						exported: now
					}) + getVersionText(ydoc, v.id)
				);
			}
		}

		// ── Scene (/Scene/ch1sc1.md — current scene only, active version) ───
		if (options.scene && isActive && activeVersion) {
			const vi = scene.versions.indexOf(activeVersion) + 1;
			await writeFile(
				root,
				['Scene'],
				`${sk}.md`,
				fm({
					type: 'scene',
					chapter: scene.chapterNumber,
					scene: scene.sceneNumber,
					scene_title: scene.title,
					version: vi,
					version_name: activeVersion.name,
					exported: now
				}) + getVersionText(ydoc, activeVersion.id)
			);
		}

		// ── Recipe (/Recipe/ch1sc1.json) ─────────────────────────────────────
		if (options.recipes && activeVersion) {
			const recipes = activeVersion.reviewRecipes.map(
				({ id: _id, feedback: _f, isGenerating: _ig, chatHistory: _ch, ...r }) => r
			);
			await writeFile(
				root,
				['Recipe'],
				`${sk}.json`,
				fm({
					type: 'recipes',
					chapter: scene.chapterNumber,
					scene: scene.sceneNumber,
					exported: now
				}) + JSON.stringify(recipes, null, 2)
			);
		}

		// ── Context (/Context/ch1sc1.json) ──────────────────────────────────
		if (options.context && activeVersion && (activeVersion.contextItems.length || activeVersion.objectivesText)) {
			await writeFile(
				root,
				['Context'],
				`${sk}.json`,
				fm({
					type: 'context',
					chapter: scene.chapterNumber,
					scene: scene.sceneNumber,
					exported: now
				}) +
					JSON.stringify(
						{ objectivesText: activeVersion.objectivesText, contextItems: activeVersion.contextItems },
						null,
						2
					)
			);
		}

		// ── Todos (/Todo/ch1sc1.md — open + ignored) ─────────────────────────
		if (options.todos && activeVersion) {
			const open = activeVersion.todoList.filter((t) => t.status !== 'completed');
			const lines = open.length
				? open.map((t) => {
						const box = t.status === 'open' ? '[ ]' : '[~]';
						return `- ${box} [${t.source}] ${t.text}`;
					})
				: ['*(No open todos)*'];
			await writeFile(
				root,
				['Todo'],
				`${sk}.md`,
				fm({
					type: 'todos',
					chapter: scene.chapterNumber,
					scene: scene.sceneNumber,
					exported: now
				}) + lines.join('\n')
			);
		}

		// ── Versions (/Version/ch1sc1v1.md … ch1sc1vN.md) ───────────────────
		if (options.versions) {
			for (let i = 0; i < scene.versions.length; i++) {
				const v = scene.versions[i];
				await writeFile(
					root,
					['Version'],
					`${sk}v${i + 1}.md`,
					fm({
						type: 'version',
						chapter: scene.chapterNumber,
						scene: scene.sceneNumber,
						version: i + 1,
						version_name: v.name,
						is_final: v.isFinalOutput,
						created: new Date(v.createdAt).toISOString(),
						exported: now
					}) + getVersionText(ydoc, v.id)
				);
			}
		}

		// ── Histories ─────────────────────────────────────────────────────────
		for (let vi = 0; vi < scene.versions.length; vi++) {
			const v = scene.versions[vi];
			const vk = `${sk}v${vi + 1}`;

			for (const recipe of v.reviewRecipes) {
				const rslug = slugify(recipe.title);

				if (options.historyChat && recipe.outputFormat === 'chat' && recipe.chatHistory?.length) {
					const body = recipe.chatHistory
						.map((m) =>
							m.role === 'user'
								? `**User:**\n\n${m.content}`
								: `**Assistant:**\n\n${m.content}`
						)
						.join('\n\n---\n\n');
					await writeFile(
						root,
						['History', 'Chat'],
						`${vk}_${rslug}.md`,
						fm({
							type: 'chat-history',
							chapter: scene.chapterNumber,
							scene: scene.sceneNumber,
							version: vi + 1,
							recipe_title: recipe.title,
							exported: now
						}) + body
					);
				}

				if (options.historyLint && recipe.outputFormat === 'lints') {
					const lints = v.annotations.filter((a) => a.recipeId === recipe.id);
					if (lints.length) {
						const body = lints
							.map(
								(a) =>
									`### Issue\n\n**Original:** "${a.originalText}"\n\n**Commentary:** ${a.commentary}` +
									(a.suggestion ? `\n\n**Suggestion:** ${a.suggestion}` : '')
							)
							.join('\n\n---\n\n');
						await writeFile(
							root,
							['History', 'Lint'],
							`${vk}_${rslug}.md`,
							fm({
								type: 'lint-history',
								chapter: scene.chapterNumber,
								scene: scene.sceneNumber,
								version: vi + 1,
								recipe_title: recipe.title,
								exported: now
							}) + body
						);
					}
				}
			}

			if (options.historyTodo) {
				const done = v.todoList.filter((t) => t.status === 'completed');
				if (done.length) {
					await writeFile(
						root,
						['History', 'Todo'],
						`${vk}.md`,
						fm({
							type: 'todo-history',
							chapter: scene.chapterNumber,
							scene: scene.sceneNumber,
							version: vi + 1,
							exported: now
						}) +
							done.map((t) => `- [x] [${t.source}] ${t.text}`).join('\n')
					);
				}
			}
		}
	}

	// ── Settings (/Settings/settings.json) ───────────────────────────────────
	if (options.settings) {
		const obfuscateKey = (key: string) => {
			if (!key) return '';
			if (key.length <= 8) return '****';
			return key.slice(0, 4) + '****';
		};
		const safeProfiles = settings.profiles.map((p) => ({
			...p,
			apiKey: obfuscateKey(p.apiKey)
		}));
		await writeFile(
			root,
			['Settings'],
			'settings.json',
			JSON.stringify(
				{
					_note: 'API keys are obfuscated. Re-enter them after import.',
					exported: now,
					profiles: safeProfiles,
					tiers: settings.tiers,
					debugAiCalls: settings.debugAiCalls
				},
				null,
				2
			)
		);
	}
}
