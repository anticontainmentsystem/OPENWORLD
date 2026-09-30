<script lang="ts">
	import { untrack } from 'svelte';
	import type { FeedPage, Post } from '$lib/types';
	import SnapshotCard from './SnapshotCard.svelte';

	/** Snapshot-only overview. Opening a card continues in the focus feed from that post. */
	let { initial, scope = 'all', emptyText = 'Nothing here yet.' }: { initial: FeedPage; scope?: string; emptyText?: string } = $props();
	let posts = $state<Post[]>(untrack(() => [...initial.posts]));
	let next = $state<string | null>(untrack(() => initial.next));
	let loading = $state(false);

	async function more() {
		if (!next || loading) return;
		loading = true;
		const res = await fetch(`/api/feed?scope=${encodeURIComponent(scope)}&before=${encodeURIComponent(next)}`);
		if (res.ok) {
			const page: FeedPage = await res.json();
			posts = [...posts, ...page.posts];
			next = page.next;
		}
		loading = false;
	}
</script>

{#if posts.length === 0}
	<p class="muted empty">{emptyText}</p>
{:else}
	<div class="grid">
		{#each posts as post (post.id)}
			<a class="cell" href="/p/{post.id}?scope={encodeURIComponent(scope)}"><SnapshotCard {post} compact /></a>
		{/each}
	</div>
	{#if next}
		<div class="more"><button class="btn" onclick={more} disabled={loading}>{loading ? 'Loading…' : 'Load more'}</button></div>
	{/if}
{/if}

<style>
	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: var(--sp-3); }
	.cell { display: block; padding: var(--sp-3); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); }
	.cell:hover { border-color: var(--accent); text-decoration: none; }
	.more { display: flex; justify-content: center; margin-top: var(--sp-5); }
	.empty { text-align: center; padding: var(--sp-6); }
</style>
