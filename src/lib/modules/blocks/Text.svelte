<script lang="ts">
	import Linkify from './Linkify.svelte';
	let { data }: { data: { body: string } } = $props();
</script>

<div class="text"><Linkify text={data.body} /></div>

<style>
	.text { white-space: pre-wrap; font-size: 1.15rem; line-height: 1.6; overflow-wrap: anywhere; }
</style>
