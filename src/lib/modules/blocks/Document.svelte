<script lang="ts">
	import { matchEmbed } from '../providers';
	import Frame from './Frame.svelte';
	let { data }: { data: { url: string; title?: string } } = $props();
	const info = $derived(matchEmbed(data.url));
</script>

{#if data.title}<h3>{data.title}</h3>{/if}
<Frame src={info?.src ?? data.url} title={data.title ?? 'Document'} aspect={info?.aspect ?? 3 / 4} />
<p class="cap"><a href={data.url} target="_blank" rel="noopener noreferrer ugc">Open document ↗</a></p>

<style>
	h3 { margin-bottom: var(--sp-2); }
	.cap { font-size: .9rem; margin-top: var(--sp-2); }
</style>
