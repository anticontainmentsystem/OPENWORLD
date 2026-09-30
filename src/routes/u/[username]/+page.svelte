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

	let repoInput = $state('');
	let repoBusy = $state(false);
	let repoMsg = $state('');
	async function addRepo(e: Event) {
		e.preventDefault();
		repoBusy = true;
		repoMsg = '';
		const res = await fetch('/api/repos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo: repoInput }) });
		repoBusy = false;
		const body = (await res.json().catch(() => null)) as { message?: string; fullName?: string } | null;
		if (!res.ok) return (repoMsg = body?.message ?? 'Could not add that repo');
		location.href = `/r/${body!.fullName}`;
	}

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

	{#if data.repos.length || isMe}
		<section class="repos">
			<h2>Creative repos</h2>
			{#if data.repos.length}
				<div class="repo-grid">
					{#each data.repos as r (r.fullName)}
						<a class="repo" href="/r/{r.fullName}">
							<img src={r.cover} alt="" loading="lazy" referrerpolicy="no-referrer" />
							<div>
								{#if r.medium}<span class="medium">{r.medium}</span>{/if}
								<strong>{r.title}</strong>
								{#if r.summary}<p class="muted">{r.summary}</p>{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
			{#if isMe}
				<form class="add-repo" onsubmit={addRepo}>
					<input class="input" bind:value={repoInput} placeholder="Add one of your GitHub repos — github.com/{p.username}/…" aria-label="GitHub repo" />
					<button class="btn primary" disabled={repoBusy || !repoInput.trim()}>{repoBusy ? 'Reading GitHub…' : 'Add repo'}</button>
				</form>
				{#if repoMsg}<p class="err">{repoMsg}</p>{/if}
			{/if}
		</section>
	{/if}

	<h2 class="posts-h">Posts</h2>
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
	h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); margin-bottom: var(--sp-3); }
	.repos { margin-bottom: var(--sp-6); }
	.repo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--sp-3); margin-bottom: var(--sp-3); }
	.repo { display: block; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; color: var(--text); }
	.repo:hover { border-color: var(--secondary-hover); text-decoration: none; }
	.repo img { width: 100%; aspect-ratio: 2; object-fit: cover; display: block; background: var(--surface-2); }
	.repo div { padding: var(--sp-3); display: grid; gap: 2px; }
	.repo p { font-size: .9rem; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.medium { text-transform: uppercase; letter-spacing: .08em; color: var(--accent); font-size: .72rem; font-weight: 600; }
	.add-repo { display: flex; gap: var(--sp-2); max-width: 640px; }
	.err { color: var(--danger); font-size: .9rem; margin-top: var(--sp-2); }
</style>
