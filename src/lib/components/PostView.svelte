<script lang="ts">
	import { untrack } from 'svelte';
	import Block from '$lib/modules/Block.svelte';
	import { moduleMap } from '$lib/modules/registry';
	import { timeAgo } from '$lib/time';
	import type { Post, SessionUser } from '$lib/types';
	import Avatar from './Avatar.svelte';

	let { post, me, ondelete }: { post: Post; me: SessionUser | null; ondelete?: (id: string) => void } = $props();
	let fire = $state(untrack(() => post.fire));
	let fired = $state(untrack(() => post.firedByMe));
	let busy = $state(false);

	async function toggleFire() {
		if (!me) return (location.href = '/auth/login');
		busy = true;
		fired = !fired;
		fire += fired ? 1 : -1;
		const res = await fetch(`/api/posts/${post.id}/fire`, { method: 'POST' });
		if (res.ok) ({ fire, firedByMe: fired } = (await res.json()) as { fire: number; firedByMe: boolean });
		busy = false;
	}

	async function share() {
		const url = `${location.origin}/p/${post.id}`;
		if (navigator.share) await navigator.share({ url }).catch(() => {});
		else await navigator.clipboard?.writeText(url);
	}

	async function remove() {
		if (!confirm('Delete this post?')) return;
		const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
		if (res.ok) ondelete?.(post.id);
	}
</script>

<article class="post">
	<header>
		<a class="author" href="/u/{post.author.username}">
			<Avatar src={post.author.avatar} name={post.author.username} />
			<span><strong>{post.author.name || post.author.username}</strong> <span class="muted">@{post.author.username}</span></span>
		</a>
		<a class="muted when" href="/p/{post.id}">{timeAgo(post.createdAt)}</a>
	</header>

	<div class="blocks">
		{#each post.blocks as block, i (i)}
			<Block {block} stateKey="{post.id}:{i}" />
		{/each}
	</div>

	<footer>
		<button class="btn ghost" class:on={fired} onclick={toggleFire} disabled={busy} aria-pressed={fired} aria-label="Fire">🔥 {fire}</button>
		<button class="btn ghost" onclick={share}>Share</button>
		<span class="kinds muted">{post.snapshot.kinds.map((k) => moduleMap[k]?.icon).join(' ')}</span>
		{#if me?.id === post.author.id}<button class="btn ghost del" onclick={remove}>Delete</button>{/if}
	</footer>
</article>

<style>
	.post { display: grid; gap: var(--sp-4); }
	header { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); }
	.author { display: flex; align-items: center; gap: var(--sp-2); color: var(--text); }
	.when { font-size: .9rem; }
	.blocks { display: grid; gap: var(--sp-5); }
	footer { display: flex; align-items: center; gap: var(--sp-2); border-top: 1px solid var(--border); padding-top: var(--sp-2); }
	.on { color: var(--accent); }
	.kinds { margin-left: auto; letter-spacing: .3em; }
	.del { color: var(--text-muted); }
</style>
