<script lang="ts">
	let { text }: { text: string } = $props();
	const parts = $derived(text.split(/(https?:\/\/[^\s<>"')\]]+)/g));
</script>

{#each parts as part, i (i)}{#if i % 2 === 1}<a href={part} target="_blank" rel="noopener noreferrer ugc">{part}</a>{:else}{part}{/if}{/each}
