<script lang="ts">
	import { moduleMap } from '$lib/modules/registry';
	import type { Post } from '$lib/types';
	import Avatar from './Avatar.svelte';

	/** Static preview of a post: no iframes, no scripts. Used for feed neighbours and grid view. */
	let { post, compact = false }: { post: Post; compact?: boolean } = $props();
	const s = $derived(post.snapshot);
	let broken = $state(false);
</script>

<div class="snap" class:compact>
	<div class="who">
		<Avatar src={post.author.avatar} name={post.author.username} size={22} />
		<span>{post.author.name || post.author.username}</span>
	</div>
	{#if s.image && !broken}<img src={s.image} alt="" loading="lazy" referrerpolicy="no-referrer" onerror={() => (broken = true)} />{/if}
	{#if s.title}<strong>{s.title}</strong>{/if}
	{#if s.excerpt}<p>{s.excerpt}</p>{/if}
	<span class="kinds">{s.kinds.map((k) => `${moduleMap[k]?.icon ?? ''} ${moduleMap[k]?.name ?? k}`).join('  ·  ')}</span>
</div>

<style>
	.snap { display: grid; gap: var(--sp-2); align-content: start; }
	.who { display: flex; align-items: center; gap: var(--sp-2); color: var(--text-dim); font-size: .9rem; }
	img { width: 100%; max-height: 40vh; object-fit: cover; border-radius: var(--radius); background: var(--surface-2); }
	.compact img { aspect-ratio: 4 / 3; max-height: none; }
	strong { font-size: 1.1rem; }
	p { color: var(--text-dim); overflow-wrap: anywhere; }
	.compact p { display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
	.kinds { color: var(--text-muted); font-size: .78rem; }
</style>
