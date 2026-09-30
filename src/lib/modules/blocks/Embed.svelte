<script lang="ts">
	import { matchEmbed } from '../providers';
	import Frame from './Frame.svelte';
	let { data }: { data: { url: string; caption?: string } } = $props();
	const info = $derived(matchEmbed(data.url));
</script>

{#if info}
	<Frame src={info.src} title={data.caption ?? `${info.provider} embed`} aspect={info.aspect} height={info.height} />
{/if}
<p class="cap">
	{#if data.caption}{data.caption} · {/if}<a href={data.url} target="_blank" rel="noopener noreferrer ugc">on {info?.provider ?? 'source'} ↗</a>
</p>

<style>
	.cap { color: var(--text-dim); font-size: .9rem; margin-top: var(--sp-2); }
</style>
