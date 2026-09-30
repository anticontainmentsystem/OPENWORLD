<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Block from '$lib/modules/Block.svelte';
	import { providerNames } from '$lib/modules/providers';
	import { MAX_BLOCKS, categories, moduleMap, modules, validateBlock } from '$lib/modules/registry';

	let { prefillRepo = null }: { prefillRepo?: string | null } = $props();

	interface Draft {
		key: number;
		type: string;
		values: Record<string, string>;
		/** Server-fetched extras (link preview, repo info) used only for previewing. */
		extra: Record<string, unknown>;
	}

	let drafts = $state<Draft[]>([]);
	let paste = $state('');
	let resolving = $state(false);
	let publishing = $state(false);
	let message = $state('');
	let picker = $state(false);
	let nextKey = 0;

	const toValues = (data: Record<string, unknown>) =>
		Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.join('\n') : typeof v === 'string' ? v : '']));

	function add(type: string, data: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
		if (drafts.length >= MAX_BLOCKS) return (message = `At most ${MAX_BLOCKS} modules per post`);
		const values = Object.fromEntries(moduleMap[type].fields.map((f) => [f.key, '']));
		drafts.push({ key: nextKey++, type, values: { ...values, ...toValues(data) }, extra });
		picker = false;
	}

	async function resolvePaste(e?: Event) {
		e?.preventDefault();
		const url = paste.trim();
		if (!url) return;
		resolving = true;
		message = '';
		const res = await fetch('/api/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
		resolving = false;
		if (!res.ok) return (message = ((await res.json().catch(() => null)) as { message?: string } | null)?.message ?? 'Could not read that link');
		const block = (await res.json()) as { type: string; data: Record<string, unknown> };
		const { preview, info, ...data } = block.data as Record<string, unknown>;
		add(block.type, data, { ...(preview ? { preview } : {}), ...(info ? { info } : {}) });
		paste = '';
	}

	onMount(() => {
		if (prefillRepo) add('github-repo', { repo: prefillRepo });
	});

	const move = (i: number, d: number) => {
		const j = i + d;
		if (j < 0 || j >= drafts.length) return;
		[drafts[i], drafts[j]] = [drafts[j], drafts[i]];
	};

	const checked = $derived(drafts.map((d) => validateBlock({ type: d.type, data: d.values })));
	const allValid = $derived(drafts.length > 0 && checked.every((c) => c.ok));

	async function publish() {
		if (!allValid) return;
		publishing = true;
		message = '';
		const blocks = checked.map((c) => (c.ok ? c.block : null));
		const res = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks }) });
		publishing = false;
		if (!res.ok) return (message = ((await res.json().catch(() => null)) as { message?: string } | null)?.message ?? 'Could not publish');
		const post = (await res.json()) as { id: string };
		goto(`/p/${post.id}`);
	}
</script>

<form class="paste" onsubmit={resolvePaste}>
	<label for="paste">Show something from anywhere</label>
	<div class="row">
		<input id="paste" class="input" bind:value={paste} placeholder="Paste a link — YouTube, Spotify, GitHub, Instagram, Drive, any page…" autocomplete="off" />
		<button class="btn primary" disabled={resolving || !paste.trim()}>{resolving ? 'Reading…' : 'Add'}</button>
	</div>
	<p class="hint muted">Plays inline from: {providerNames.join(', ')}. Anything else becomes a preview card.</p>
</form>

{#each drafts as draft, i (draft.key)}
	{@const def = moduleMap[draft.type]}
	{@const c = checked[i]}
	<section class="draft">
		<header>
			<span class="name">{def.icon} {def.name}</span>
			<span class="tools">
				<button type="button" class="btn ghost" onclick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
				<button type="button" class="btn ghost" onclick={() => move(i, 1)} disabled={i === drafts.length - 1} aria-label="Move down">↓</button>
				<button type="button" class="btn ghost" onclick={() => drafts.splice(i, 1)} aria-label="Remove">✕</button>
			</span>
		</header>
		<div class="cols">
			<div class="fields">
				{#each def.fields as f (f.key)}
					<label>
						<span>{f.label}{f.required ? '' : ' (optional)'}</span>
						{#if f.type === 'textarea' || f.type === 'code' || f.type === 'lines' || f.type === 'urls' || f.type === 'colors'}
							<textarea class="input" class:mono={f.type === 'code'} bind:value={draft.values[f.key]} placeholder={f.placeholder} rows={f.type === 'code' ? 8 : 4}></textarea>
						{:else if f.type === 'enum'}
							<select class="input" bind:value={draft.values[f.key]}>
								<option value="">Default</option>
								{#each f.options ?? [] as o (o)}<option value={o}>{o}</option>{/each}
							</select>
						{:else}
							<input class="input" type={f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'} bind:value={draft.values[f.key]} placeholder={f.placeholder} />
						{/if}
					</label>
				{/each}
				{#if !c.ok}<p class="err">{c.error}</p>{/if}
			</div>
			<div class="preview">
				{#if c.ok}
					<Block block={{ type: c.block.type, data: { ...c.block.data, ...draft.extra } }} />
				{:else}
					<p class="muted">Preview appears when the required fields are filled.</p>
				{/if}
			</div>
		</div>
	</section>
{/each}

<div class="add">
	<button type="button" class="btn" onclick={() => (picker = !picker)} aria-expanded={picker}>+ Add a module</button>
	{#if picker}
		<div class="picker">
			{#each categories as cat (cat.id)}
				<div>
					<h4>{cat.name}</h4>
					{#each modules.filter((m) => m.category === cat.id) as m (m.id)}
						<button type="button" class="mod" onclick={() => add(m.id)}>
							<strong>{m.icon} {m.name}</strong>
							<span>{m.description}</span>
						</button>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

<div class="publish">
	{#if message}<p class="err" role="alert">{message}</p>{/if}
	<button class="btn primary" onclick={publish} disabled={!allValid || publishing}>{publishing ? 'Publishing…' : 'Publish'}</button>
</div>

<style>
	.paste { display: grid; gap: var(--sp-2); margin-bottom: var(--sp-5); }
	.paste label { font-weight: 600; font-size: 1.1rem; }
	.row { display: flex; gap: var(--sp-2); }
	.hint { font-size: .82rem; }
	.draft { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); margin-bottom: var(--sp-4); }
	.draft header { display: flex; justify-content: space-between; align-items: center; padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border); }
	.name { font-weight: 600; }
	.tools { display: flex; }
	.tools .btn { padding: 4px 8px; }
	.cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: var(--sp-4); padding: var(--sp-4); }
	@media (max-width: 760px) { .cols { grid-template-columns: 1fr; } }
	.fields { display: grid; gap: var(--sp-3); align-content: start; }
	.fields label { display: grid; gap: 4px; font-size: .88rem; color: var(--text-dim); }
	.mono { font-family: var(--font-mono); font-size: .85rem; }
	.preview { min-width: 0; }
	.err { color: var(--danger); font-size: .88rem; }
	.add { margin: var(--sp-4) 0; }
	.picker { margin-top: var(--sp-3); display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--sp-4); }
	h4 { color: var(--text-muted); text-transform: uppercase; font-size: .75rem; letter-spacing: .08em; margin-bottom: var(--sp-2); }
	.mod { display: grid; gap: 2px; text-align: left; width: 100%; padding: var(--sp-2) var(--sp-3); margin-bottom: var(--sp-2); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; }
	.mod:hover { border-color: var(--accent); }
	.mod span { color: var(--text-dim); font-size: .82rem; }
	.publish { display: flex; justify-content: flex-end; align-items: center; gap: var(--sp-3); border-top: 1px solid var(--border); padding-top: var(--sp-4); }
</style>
