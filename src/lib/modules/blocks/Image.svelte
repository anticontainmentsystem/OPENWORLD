<script lang="ts">
	let { data }: { data: { url: string; alt?: string; caption?: string } } = $props();
</script>

<figure>
	<img src={data.url} alt={data.alt ?? ''} loading="lazy" referrerpolicy="no-referrer" />
	{#if data.caption}<figcaption>{data.caption}</figcaption>{/if}
</figure>

<style>
	img { display: block; max-width: 100%; max-height: 70vh; margin-inline: auto; border-radius: var(--radius); }
	figcaption { color: var(--text-dim); font-size: .9rem; margin-top: var(--sp-2); text-align: center; }
</style>
