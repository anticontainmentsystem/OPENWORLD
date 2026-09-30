<script lang="ts">
	let { data }: { data: { url: string; preview?: { title: string | null; description: string | null; image: string | null; siteName: string | null } } } = $props();
	const p = $derived(data.preview);
	const host = $derived(new URL(data.url).hostname.replace(/^www\./, ''));
</script>

<a class="card" href={data.url} target="_blank" rel="noopener noreferrer ugc">
	{#if p?.image}<img src={p.image} alt="" loading="lazy" referrerpolicy="no-referrer" />{/if}
	<div class="meta">
		<span class="site">{p?.siteName ?? host}</span>
		<strong>{p?.title ?? data.url}</strong>
		{#if p?.description}<span class="desc">{p.description}</span>{/if}
	</div>
</a>

<style>
	.card { display: block; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; color: var(--text); background: var(--surface); }
	.card:hover { border-color: var(--accent); text-decoration: none; }
	img { width: 100%; max-height: 50vh; object-fit: cover; display: block; background: var(--border); }
	.meta { display: grid; gap: 4px; padding: var(--sp-3) var(--sp-4); }
	.site { color: var(--text-muted); font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; }
	strong { overflow-wrap: anywhere; }
	.desc { color: var(--text-dim); font-size: .92rem; }
</style>
