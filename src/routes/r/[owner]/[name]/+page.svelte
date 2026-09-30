<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import ReadmeFrame from '$lib/components/ReadmeFrame.svelte';
	import Block from '$lib/modules/Block.svelte';
	import Lines from '$lib/modules/blocks/Lines.svelte';
	import { timeAgo } from '$lib/time';

	let { data } = $props();
	const r = $derived(data.repo);
	const m = $derived(r.manifest);
	const title = $derived(m.title ?? r.fullName.split('/')[1]);
	const summary = $derived(m.summary ?? r.description);
	let busy = $state(false);
	let coverFailed = $state(false);
	let note = $state('');

	async function refresh() {
		busy = true;
		note = '';
		const res = await fetch(`/api/repos/${r.fullName}/refresh`, { method: 'POST' });
		busy = false;
		if (!res.ok) note = ((await res.json().catch(() => null)) as { message?: string } | null)?.message ?? 'Refresh failed';
		else await invalidateAll();
	}

	async function remove() {
		if (!confirm('Remove this repo from OpenWorld? (Nothing changes on GitHub.)')) return;
		const res = await fetch(`/api/repos/${r.fullName}`, { method: 'DELETE' });
		if (res.ok) location.href = `/u/${data.owner.username}`;
	}

	const size = (n: number) => (n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.ceil(n / 1e3)} KB`);
	const day = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');
</script>

<svelte:head>
	<title>{title} · OpenWorld</title>
	<meta name="description" content={summary ?? `${title} by ${data.owner.username}`} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={summary ?? 'A creative repo on OpenWorld'} />
	<meta property="og:image" content={m.cover ?? `https://opengraph.githubassets.com/1/${r.fullName}`} />
</svelte:head>

{#if m.cover && !coverFailed}
	<img class="cover" src={m.cover} alt="" referrerpolicy="no-referrer" onerror={() => (coverFailed = true)} />
{/if}

<div class="page repo">
	<header class="head">
		<div class="kicker">
			{#if m.medium}<span class="medium">{m.medium}</span>{/if}
			<span class="muted">⎇ {r.fullName}</span>
		</div>
		<h1>{title}</h1>
		{#if summary}<p class="summary">{summary}</p>{/if}
		<div class="by">
			<a href="/u/{data.owner.username}"><Avatar src={data.owner.avatar} name={data.owner.username} size={24} /> {data.owner.name || data.owner.username}</a>
			{#if r.fork && r.parent}<span class="muted">· adapted from <a href="https://github.com/{r.parent}" target="_blank" rel="noopener noreferrer">{r.parent}</a></span>{/if}
		</div>
		<div class="actions">
			<a class="btn" href="https://github.com/{r.fullName}" target="_blank" rel="noopener noreferrer">Open on GitHub ↗</a>
			{#if r.homepage}<a class="btn" href={r.homepage} target="_blank" rel="noopener noreferrer ugc">Website ↗</a>{/if}
			{#each m.links as l (l)}<a class="btn" href={l} target="_blank" rel="noopener noreferrer ugc">{new URL(l).hostname.replace(/^www\./, '')} ↗</a>{/each}
			{#if data.isOwner}
				<a class="btn" href="/new?repo={encodeURIComponent(r.fullName)}">Share to feed</a>
				<button class="btn" onclick={refresh} disabled={busy}>{busy ? 'Reading GitHub…' : '↻ Refresh'}</button>
				<button class="btn ghost" onclick={remove}>Remove</button>
			{/if}
		</div>
		<p class="stats muted">
			★ {r.stars} · ⑂ {r.forks} {r.forks === 1 ? 'adaptation' : 'adaptations'}{#if r.license} · {r.license}{/if}{#if r.pushedAt} · updated {timeAgo(Date.parse(r.pushedAt))}{/if}
		</p>
		{#if r.topics.length}<div class="topics">{#each r.topics as t (t)}<em>{t}</em>{/each}</div>{/if}
		{#if note}<p class="err">{note}</p>{/if}
	</header>

	{#if data.isOwner && !r.hasManifest}
		<aside class="callout">
			<strong>Shape this page with an <code>openworld.yml</code></strong>
			<p>Add a file named <code>openworld.yml</code> to the root of your repo to choose a title, medium, cover and what to showcase — videos, galleries, scripts, recordings, from the repo or anywhere. Then press Refresh.</p>
			<pre>{`title: Bodies in Motion
medium: dance
summary: A 40-minute piece for five dancers.
cover: media/cover.jpg
credits:
  - Choreography — Your Name
showcase:
  - embed: https://youtu.be/…
  - gallery: [media/rehearsal-1.jpg, media/rehearsal-2.jpg]
  - document: score/notation.pdf`}</pre>
			<a href="https://github.com/anticontainmentsystem/OPENWORLD/blob/main/docs/MANIFEST.md" target="_blank" rel="noopener noreferrer">Full guide and templates ↗</a>
		</aside>
	{/if}

	{#if data.isOwner && m.issues.length}
		<aside class="callout warn">
			<strong>Things to fix in openworld.yml</strong>
			<ul>{#each m.issues as issue, i (i)}<li>{issue}</li>{/each}</ul>
		</aside>
	{/if}

	{#if m.showcase.length}
		<section class="showcase">
			{#each m.showcase as block, i (i)}<Block {block} stateKey="repo:{r.fullName}:{i}" />{/each}
		</section>
	{/if}

	<div class="cols">
		<div class="main">
			{#if r.releases.length}
				<section>
					<h2>Deliverables</h2>
					<ol class="releases">
						{#each r.releases as rel (rel.tag)}
							<li>
								<a href={rel.url} target="_blank" rel="noopener noreferrer"><strong>{rel.name}</strong></a>
								<span class="muted"> · {rel.tag}{#if rel.publishedAt} · {day(rel.publishedAt)}{/if}</span>
								{#if rel.notes}<p class="muted notes">{rel.notes}</p>{/if}
								{#if rel.assets.length}
									<ul class="assets">{#each rel.assets as a (a.url)}<li><a href={a.url} rel="noopener noreferrer">⬇ {a.name}</a> <span class="muted">{size(a.size)}</span></li>{/each}</ul>
								{/if}
							</li>
						{/each}
					</ol>
				</section>
			{/if}

			{#if r.readmeHtml}
				<section>
					<h2>README</h2>
					<ReadmeFrame html={r.readmeHtml} base="https://github.com/{r.fullName}/blob/{r.branch}/" />
				</section>
			{/if}
		</div>

		<aside class="side">
			{#if m.credits.length}
				<section><Lines lines={m.credits} style="credits" title="Credits" /></section>
			{/if}
			{#if r.contributors.length}
				<section>
					<h2>Contributors</h2>
					<div class="people">
						{#each r.contributors as c (c.login)}
							<a href="https://github.com/{c.login}" target="_blank" rel="noopener noreferrer" title="{c.login} · {c.contributions} commits"><Avatar src={c.avatar} name={c.login} size={34} /></a>
						{/each}
					</div>
				</section>
			{/if}
			{#if r.commits.length}
				<section>
					<h2>Process</h2>
					<ol class="process">
						{#each r.commits as c (c.url)}
							<li><a href={c.url} target="_blank" rel="noopener noreferrer">{c.message}</a><span class="muted">{c.author ? `${c.author} · ` : ''}{day(c.date)}</span></li>
						{/each}
					</ol>
				</section>
			{/if}
			<p class="muted synced">Read from GitHub {timeAgo(data.syncedAt)}</p>
		</aside>
	</div>
</div>

<style>
	.cover { display: block; width: 100%; height: 34vh; object-fit: cover; border-bottom: 1px solid var(--border); }
	.repo { display: grid; gap: var(--sp-6); }
	.head { display: grid; gap: var(--sp-2); }
	.kicker { display: flex; gap: var(--sp-3); align-items: center; font-size: .88rem; }
	.medium { text-transform: uppercase; letter-spacing: .08em; color: var(--accent); font-weight: 600; }
	h1 { font-size: 2.2rem; }
	.summary { font-size: 1.15rem; color: var(--text-dim); max-width: 720px; }
	.by { display: flex; gap: var(--sp-2); align-items: center; flex-wrap: wrap; }
	.by > a { display: inline-flex; gap: 6px; align-items: center; color: var(--text); }
	.actions { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-2); }
	.stats { font-size: .9rem; }
	.topics { display: flex; flex-wrap: wrap; gap: 6px; }
	.topics em { font-style: normal; font-size: .78rem; color: var(--moss-200); background: var(--moss-700); padding: 1px 8px; border-radius: 99px; }
	.err { color: var(--danger); }
	.callout { border: 1px solid var(--secondary); background: rgb(74 103 65 / .12); border-radius: var(--radius); padding: var(--sp-4); display: grid; gap: var(--sp-2); }
	.callout.warn { border-color: var(--accent); background: rgb(184 115 51 / .1); }
	.callout pre { background: var(--bg); padding: var(--sp-3); border-radius: var(--radius); overflow: auto; font-size: .85rem; }
	.callout ul { padding-left: 1.2em; }
	code { font-family: var(--font-mono); font-size: .9em; }
	.showcase { display: grid; gap: var(--sp-6); max-width: 860px; }
	.cols { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: var(--sp-6); }
	@media (max-width: 860px) { .cols { grid-template-columns: 1fr; } }
	.main, .side { display: grid; gap: var(--sp-6); align-content: start; }
	h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); margin-bottom: var(--sp-3); }
	.releases { list-style: none; display: grid; gap: var(--sp-4); }
	.notes { font-size: .9rem; white-space: pre-wrap; margin-top: 4px; }
	.assets { list-style: none; margin-top: 6px; display: grid; gap: 2px; font-size: .9rem; }
	.people { display: flex; flex-wrap: wrap; gap: 6px; }
	.process { list-style: none; display: grid; gap: var(--sp-3); border-left: 2px solid var(--secondary); padding-left: var(--sp-3); }
	.process li { display: grid; font-size: .9rem; }
	.process a { color: var(--text); }
	.process span { font-size: .8rem; }
	.synced { font-size: .8rem; }
</style>
