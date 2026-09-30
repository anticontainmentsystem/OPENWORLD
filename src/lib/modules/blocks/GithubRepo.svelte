<script lang="ts">
	let { data }: { data: { repo: string; info?: { description: string | null; stars: number; forks: number; language: string | null; topics: string[]; homepage: string | null } } } = $props();
	const i = $derived(data.info);
</script>

<a class="repo" href="https://github.com/{data.repo}" target="_blank" rel="noopener noreferrer">
	<img src="https://opengraph.githubassets.com/1/{data.repo}" alt="" loading="lazy" />
	<div class="meta">
		<strong>⎇ {data.repo}</strong>
		{#if i?.description}<span>{i.description}</span>{/if}
		{#if i}
			<span class="stats">★ {i.stars} · ⑂ {i.forks}{#if i.language} · {i.language}{/if}</span>
			{#if i.topics.length}<span class="topics">{#each i.topics as t (t)}<em>{t}</em>{/each}</span>{/if}
		{/if}
	</div>
</a>

<style>
	.repo { display: block; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; color: var(--text); background: var(--surface); }
	.repo:hover { border-color: var(--secondary-hover); text-decoration: none; }
	img { width: 100%; aspect-ratio: 2; object-fit: cover; display: block; background: var(--border); }
	.meta { display: grid; gap: 6px; padding: var(--sp-3) var(--sp-4); }
	.stats { color: var(--text-dim); font-size: .9rem; }
	.topics { display: flex; flex-wrap: wrap; gap: 6px; }
	em { font-style: normal; font-size: .78rem; color: var(--moss-200); background: var(--moss-700); padding: 1px 8px; border-radius: 99px; }
</style>
