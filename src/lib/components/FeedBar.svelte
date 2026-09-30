<script lang="ts">
	let { scope, view, signedIn }: { scope: string; view: string; signedIn: boolean } = $props();
	const href = (s: string, v: string) => `/?${new URLSearchParams({ ...(s !== 'all' ? { scope: s } : {}), ...(v !== 'focus' ? { view: v } : {}) })}`;
</script>

<div class="bar">
	<div class="seg">
		<a href={href('all', view)} class:on={scope === 'all'}>Everyone</a>
		{#if signedIn}<a href={href('following', view)} class:on={scope === 'following'}>Following</a>{/if}
	</div>
	<div class="seg">
		<a href={href(scope, 'focus')} class:on={view === 'focus'} title="Focus: one at a time">◉ Focus</a>
		<a href={href(scope, 'grid')} class:on={view === 'grid'} title="Grid: skim snapshots">▦ Grid</a>
	</div>
</div>

<style>
	.bar { position: fixed; top: calc(var(--header-h) + 8px); left: 0; right: 0; z-index: 10; display: flex; justify-content: space-between; padding: 0 var(--sp-4); pointer-events: none; }
	.seg { display: flex; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 2px; pointer-events: auto; }
	a { padding: 3px 10px; color: var(--text-dim); font-size: .88rem; border-radius: var(--radius); }
	a:hover { text-decoration: none; color: var(--text); }
	a.on { background: var(--surface-2); color: var(--text); }
</style>
