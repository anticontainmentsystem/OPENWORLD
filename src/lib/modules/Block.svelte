<script lang="ts">
	import type { Block } from '$lib/types';
	import BeforeAfter from './blocks/BeforeAfter.svelte';
	import Document from './blocks/Document.svelte';
	import Embed from './blocks/Embed.svelte';
	import Gallery from './blocks/Gallery.svelte';
	import GithubRepo from './blocks/GithubRepo.svelte';
	import Image from './blocks/Image.svelte';
	import Lines from './blocks/Lines.svelte';
	import Link from './blocks/Link.svelte';
	import Media from './blocks/Media.svelte';
	import Misc from './blocks/Misc.svelte';
	import Quote from './blocks/Quote.svelte';
	import Text from './blocks/Text.svelte';

	let { block, stateKey = '' }: { block: Block; stateKey?: string } = $props();
	const d = $derived(block.data as any);
</script>

<div class="block" data-module={block.type}>
	{#if block.type === 'text'}<Text data={d} />
	{:else if block.type === 'quote'}<Quote data={d} />
	{:else if block.type === 'link'}<Link data={d} />
	{:else if block.type === 'embed'}<Embed data={d} />
	{:else if block.type === 'image'}<Image data={d} />
	{:else if block.type === 'gallery'}<Gallery data={d} />
	{:else if block.type === 'before-after'}<BeforeAfter data={d} />
	{:else if block.type === 'video'}<Media data={d} kind="video" {stateKey} />
	{:else if block.type === 'audio'}<Media data={d} kind="audio" {stateKey} />
	{:else if block.type === 'document'}<Document data={d} />
	{:else if block.type === 'github-repo'}<GithubRepo data={d} />
	{:else if block.type === 'credits'}<Lines lines={d.lines} style="credits" title="Credits" />
	{:else if block.type === 'timeline'}<Lines lines={d.lines} style="timeline" title="Process" />
	{:else if block.type === 'tracklist'}<Lines lines={d.lines} style="tracklist" title={d.title} />
	{:else if block.type === 'materials'}<Lines lines={d.lines} style="materials" title="Materials & tools" />
	{:else}<Misc type={block.type} data={d} />
	{/if}
</div>
