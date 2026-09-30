<script lang="ts">
	let { data }: { data: { text: string; source?: string } } = $props();
</script>

<figure>
	<blockquote>{data.text}</blockquote>
	{#if data.source}<figcaption>— {data.source}</figcaption>{/if}
</figure>

<style>
	blockquote { font-size: 1.4rem; line-height: 1.45; border-left: 3px solid var(--accent); padding-left: var(--sp-4); white-space: pre-wrap; }
	figcaption { color: var(--text-dim); margin-top: var(--sp-2); padding-left: var(--sp-4); }
</style>
