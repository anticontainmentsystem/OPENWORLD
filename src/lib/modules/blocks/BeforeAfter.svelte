<script lang="ts">
	let { data }: { data: { before: string; after: string; caption?: string } } = $props();
	let pos = $state(50);
</script>

<div class="ba">
	<img src={data.after} alt="After" referrerpolicy="no-referrer" />
	<img class="before" src={data.before} alt="Before" referrerpolicy="no-referrer" style="clip-path: inset(0 {100 - pos}% 0 0)" />
	<div class="line" style="left:{pos}%"></div>
	<input type="range" min="0" max="100" bind:value={pos} aria-label="Compare before and after" />
	<span class="tag l">Before</span><span class="tag r">After</span>
</div>
{#if data.caption}<p class="cap">{data.caption}</p>{/if}

<style>
	.ba { position: relative; border-radius: var(--radius); overflow: hidden; user-select: none; }
	img { display: block; width: 100%; max-height: 70vh; object-fit: contain; background: var(--surface); }
	.before { position: absolute; inset: 0; height: 100%; }
	.line { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--accent); pointer-events: none; }
	input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: ew-resize; margin: 0; }
	.tag { position: absolute; top: var(--sp-2); font-size: .75rem; background: rgb(0 0 0 / .6); padding: 2px 6px; border-radius: var(--radius); pointer-events: none; }
	.l { left: var(--sp-2); } .r { right: var(--sp-2); }
	.cap { color: var(--text-dim); font-size: .9rem; margin-top: var(--sp-2); }
</style>
