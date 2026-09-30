<script lang="ts">
	import { spaces } from '$lib/spaces';
</script>

<svelte:head><title>Spaces · OpenWorld</title></svelte:head>

<div class="page">
	<h1>Spaces</h1>
	<p class="muted intro">Spotlight and collaboration areas where people with shared creative interests gather, form communities, and run workshops. Opening in the next phase — and there will be more than seven.</p>
	<div class="grid">
		{#each spaces as s (s.slug)}
			<div class="space">
				<span class="icon">{s.icon}</span>
				<h2>{s.name}</h2>
				<p>{s.blurb}</p>
				<span class="soon">Opening soon</span>
			</div>
		{/each}
	</div>
</div>

<style>
	h1 { margin-bottom: var(--sp-2); }
	.intro { max-width: 640px; margin-bottom: var(--sp-5); }
	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--sp-3); }
	.space { display: grid; gap: var(--sp-2); align-content: start; padding: var(--sp-4); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
	.icon { font-size: 1.6rem; }
	p { color: var(--text-dim); }
	.soon { color: var(--moss-400); font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; }
</style>
