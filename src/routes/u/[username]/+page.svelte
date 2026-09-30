<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import GridView from '$lib/components/GridView.svelte';

	let { data } = $props();
	const p = $derived(data.profile);
	let followed = $state(false);
	let followers = $state(0);
	$effect.pre(() => {
		followed = p.followed;
		followers = p.followers;
	});
	const isMe = $derived(data.user?.id === p.id);

	async function toggleFollow() {
		if (!data.user) return (location.href = '/auth/login');
		const res = await fetch(`/api/follow/${p.username}`, { method: 'POST' });
		if (res.ok) ({ following: followed, followers } = (await res.json()) as { following: boolean; followers: number });
	}
</script>

<svelte:head><title>{p.name || p.username} (@{p.username}) · OpenWorld</title></svelte:head>

<div class="page">
	<section class="head">
		<Avatar src={p.avatar} name={p.username} size={88} />
		<div class="info">
			<h1>{p.name || p.username}</h1>
			<p class="muted">@{p.username}</p>
			{#if p.bio}<p>{p.bio}</p>{/if}
			<p class="stats">
				<span><strong>{p.posts}</strong> posts</span>
				<span><strong>{followers}</strong> followers</span>
				<span><strong>{p.following}</strong> following</span>
			</p>
			<div class="actions">
				{#if !isMe}<button class="btn" class:primary={!followed} onclick={toggleFollow}>{followed ? 'Following' : 'Follow'}</button>{/if}
				{#if p.isGithub}<a class="btn" href="https://github.com/{p.username}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>{/if}
				{#if p.website}<a class="btn" href={p.website} target="_blank" rel="noopener noreferrer ugc">Website ↗</a>{/if}
				{#if data.page.posts.length}<a class="btn" href="/p/{data.page.posts[0].id}?scope=u:{p.username}">◉ Focus view</a>{/if}
			</div>
		</div>
	</section>

	{#key p.id}
		<GridView initial={data.page} scope="u:{p.username}" emptyText={isMe ? 'You haven’t shown anything yet. Make your first post.' : 'No posts yet.'} />
	{/key}
</div>

<style>
	.head { display: flex; gap: var(--sp-5); align-items: flex-start; margin-bottom: var(--sp-6); }
	.info { display: grid; gap: var(--sp-2); }
	h1 { font-size: 1.6rem; }
	.stats { display: flex; gap: var(--sp-4); color: var(--text-dim); }
	.stats strong { color: var(--text); }
	.actions { display: flex; flex-wrap: wrap; gap: var(--sp-2); margin-top: var(--sp-2); }
	@media (max-width: 600px) { .head { flex-direction: column; } }
</style>
