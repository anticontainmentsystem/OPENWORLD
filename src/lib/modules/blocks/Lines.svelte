<script lang="ts">
	/** Shared renderer for list-style modules (credits, timeline, tracklist, materials). */
	let { title, lines, style }: { title?: string; lines: string[]; style: 'credits' | 'timeline' | 'tracklist' | 'materials' } = $props();
	const split = (l: string) => {
		const m = l.match(/^(.*?)\s+[—–-]{1,2}\s+(.*)$/);
		return m ? [m[1], m[2]] : [l, ''];
	};
</script>

{#if title}<h3>{title}</h3>{/if}
<ol class={style}>
	{#each lines as line, i (i)}
		{@const [a, b] = split(line)}
		<li>
			{#if style === 'credits'}<span class="k">{a}</span><span>{b}</span>
			{:else if style === 'timeline'}<span class="k">{a}</span><span>{b}</span>
			{:else if style === 'tracklist'}<span class="n">{i + 1}</span><span>{a}</span><span class="k">{b}</span>
			{:else}<span>{line}</span>{/if}
		</li>
	{/each}
</ol>

<style>
	h3 { margin-bottom: var(--sp-2); }
	ol { list-style: none; display: grid; gap: 6px; }
	li { display: flex; gap: var(--sp-3); }
	.k { color: var(--text-dim); }
	.credits li { justify-content: space-between; border-bottom: 1px dashed var(--border); padding-bottom: 4px; }
	.timeline { border-left: 2px solid var(--secondary); padding-left: var(--sp-4); gap: var(--sp-3); }
	.timeline li { flex-direction: column; gap: 0; position: relative; }
	.timeline li::before { content: ''; position: absolute; left: calc(-1 * var(--sp-4) - 6px); top: 6px; width: 10px; height: 10px; border-radius: 50%; background: var(--secondary-hover); }
	.timeline .k { font-size: .85rem; text-transform: uppercase; letter-spacing: .05em; }
	.tracklist .n { color: var(--text-muted); width: 1.5em; text-align: right; }
	.tracklist .k { margin-left: auto; font-variant-numeric: tabular-nums; }
	.materials { display: flex; flex-wrap: wrap; }
	.materials li { border: 1px solid var(--border); padding: 2px 10px; border-radius: 99px; font-size: .9rem; }
</style>
