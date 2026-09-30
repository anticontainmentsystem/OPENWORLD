<script lang="ts">
	/** Small single-purpose modules: event, recipe, palette, map, code. */
	import Frame from './Frame.svelte';
	import Lines from './Lines.svelte';
	let { type, data }: { type: string; data: Record<string, any> } = $props();
	const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
</script>

{#if type === 'event'}
	<div class="event">
		<div class="date">{fmtDate(data.date)}</div>
		<strong>{data.title}</strong>
		{#if data.venue}<span class="dim">⌖ {data.venue}</span>{/if}
		{#if data.url}<a href={data.url} target="_blank" rel="noopener noreferrer ugc">Tickets / info ↗</a>{/if}
	</div>
{:else if type === 'recipe'}
	{#if data.title}<h3>{data.title}</h3>{/if}
	<div class="recipe">
		<Lines lines={data.ingredients} style="materials" />
		<ol class="steps">{#each data.steps as s, i (i)}<li>{s}</li>{/each}</ol>
	</div>
{:else if type === 'palette'}
	{#if data.name}<h3>{data.name}</h3>{/if}
	<div class="palette">
		{#each data.colors as c (c)}<div><span style="background:{c}"></span><code>{c}</code></div>{/each}
	</div>
{:else if type === 'map'}
	<Frame src="https://maps.google.com/maps?q={encodeURIComponent(data.place)}&output=embed" title="Map of {data.place}" aspect={16 / 9} />
	<p class="dim cap">⌖ {data.place}{#if data.caption} · {data.caption}{/if}</p>
{:else if type === 'code'}
	<pre><code>{data.code}</code></pre>
	{#if data.language}<p class="dim cap">{data.language}</p>{/if}
{/if}

<style>
	h3 { margin-bottom: var(--sp-2); }
	.dim { color: var(--text-dim); }
	.cap { font-size: .9rem; margin-top: var(--sp-2); }
	.event { display: grid; gap: 4px; border-left: 3px solid var(--accent); padding: var(--sp-2) var(--sp-4); background: var(--surface); }
	.event .date { color: var(--accent); font-size: .85rem; text-transform: uppercase; letter-spacing: .05em; }
	.event strong { font-size: 1.2rem; }
	.recipe { display: grid; gap: var(--sp-4); }
	.steps { padding-left: 1.4em; display: grid; gap: 6px; }
	.palette { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
	.palette div { display: grid; gap: 4px; justify-items: center; }
	.palette span { width: 64px; height: 64px; border-radius: var(--radius); border: 1px solid var(--border); }
	pre { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--sp-4); overflow: auto; max-height: 60vh; font-family: var(--font-mono); font-size: .88rem; }
</style>
