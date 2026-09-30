<script lang="ts">
	import { matchEmbed } from '../providers';
	import Frame from './Frame.svelte';
	let { data }: { data: { url: string; title?: string } } = $props();
	const info = $derived(matchEmbed(data.url));
	/** Files inside a GitHub repo can't be framed from raw.githubusercontent.com; GitHub's own viewer renders them. */
	const githubView = $derived.by(() => {
		const m = data.url.match(/^https:\/\/raw\.githubusercontent\.com\/([^/]+\/[^/]+)\/([^/]+)\/(.+)$/);
		return m ? `https://github.com/${m[1]}/blob/${m[2]}/${m[3]}` : null;
	});
	const fileName = $derived(decodeURIComponent(data.url.split('/').pop() ?? 'document'));
</script>

{#if githubView}
	<a class="file" href={githubView} target="_blank" rel="noopener noreferrer">
		<span class="icon">▤</span>
		<span><strong>{data.title ?? fileName}</strong><span class="muted">View in the repo on GitHub ↗</span></span>
	</a>
{:else}
	{#if data.title}<h3>{data.title}</h3>{/if}
	<Frame src={info?.src ?? data.url} title={data.title ?? 'Document'} aspect={info?.aspect ?? 3 / 4} />
	<p class="cap"><a href={data.url} target="_blank" rel="noopener noreferrer ugc">Open document ↗</a></p>
{/if}

<style>
	h3 { margin-bottom: var(--sp-2); }
	.cap { font-size: .9rem; margin-top: var(--sp-2); }
	.file { display: flex; gap: var(--sp-3); align-items: center; padding: var(--sp-3) var(--sp-4); border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--text); }
	.file:hover { border-color: var(--accent); text-decoration: none; }
	.file > span:last-child { display: grid; }
	.icon { font-size: 1.6rem; color: var(--accent); }
	.muted { color: var(--text-dim); font-size: .88rem; }
</style>
