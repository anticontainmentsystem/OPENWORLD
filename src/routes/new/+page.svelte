<script lang="ts">
	import Composer from '$lib/components/Composer.svelte';
</script>

<svelte:head><title>New post · OpenWorld</title></svelte:head>

<div class="page">
	<h1>New post</h1>
	<p class="muted intro">Your work stays where it lives. Build a post from modules that show it.</p>
	<Composer />
</div>

<style>
	h1 { margin-bottom: var(--sp-1); }
	.intro { margin-bottom: var(--sp-5); }
</style>
