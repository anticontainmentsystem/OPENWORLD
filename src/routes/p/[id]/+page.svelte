<script lang="ts">
	import FocusFeed from '$lib/components/FocusFeed.svelte';
	let { data } = $props();
	const s = $derived(data.post.snapshot);
	const title = $derived(s.title ?? `${data.post.author.name || data.post.author.username} on OpenWorld`);
	const desc = $derived(s.excerpt ?? 'Creative work on OpenWorld');
</script>

<svelte:head>
	<title>{title} · OpenWorld</title>
	<meta name="description" content={desc} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="OpenWorld" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={desc} />
	{#if s.image}
		<meta property="og:image" content={s.image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>

{#key data.post.id}
	<FocusFeed initial={data.page} scope={data.scope} me={data.user} newerFrom={data.newerFrom} />
{/key}
