<script lang="ts">
	import FocusFeed from '$lib/components/FocusFeed.svelte';
	import GridView from '$lib/components/GridView.svelte';
	import FeedBar from '$lib/components/FeedBar.svelte';

	let { data } = $props();
	const empty = $derived(
		data.scope === 'following' ? 'No posts from people you follow yet.' : 'The world is quiet. Be the first to show something.'
	);
</script>

<svelte:head>
	<title>OpenWorld</title>
	<meta name="description" content="A living creative ecosystem. Show anything you’ve made, from wherever it lives." />
</svelte:head>

<FeedBar scope={data.scope} view={data.view} signedIn={!!data.user} />
{#key `${data.scope}-${data.view}`}
	{#if data.view === 'grid'}
		<div class="page grid-page"><GridView initial={data.page} scope={data.scope} emptyText={empty} /></div>
	{:else}
		<FocusFeed initial={data.page} scope={data.scope} me={data.user} emptyText={empty} />
	{/if}
{/key}

<style>
	.grid-page { padding-top: 64px; }
</style>
