<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { mediaState, userHasInteracted } from '../media-state';
	/** Plays a hosted video/audio file. Muted until the viewer has interacted; remembers position. */
	let { data, kind, stateKey }: { data: { url: string; poster?: string; cover?: string; title?: string; caption?: string }; kind: 'video' | 'audio'; stateKey: string } =
		$props();
	let el = $state<HTMLMediaElement>();
	onMount(() => {
		if (!el) return;
		el.muted = !userHasInteracted();
		const t = mediaState.get(stateKey);
		if (t) el.currentTime = t;
	});
	onDestroy(() => {
		if (el && el.currentTime > 0) mediaState.set(stateKey, el.currentTime);
	});
</script>

{#if kind === 'video'}
	<!-- svelte-ignore a11y_media_has_caption -->
	<video bind:this={el} src={data.url} poster={data.poster} controls playsinline preload="metadata"></video>
{:else}
	<div class="audio">
		{#if data.cover}<img src={data.cover} alt="" referrerpolicy="no-referrer" />{/if}
		<div>
			{#if data.title}<strong>{data.title}</strong>{/if}
			<audio bind:this={el} src={data.url} controls preload="metadata"></audio>
		</div>
	</div>
{/if}
{#if data.caption}<p class="cap">{data.caption}</p>{/if}

<style>
	video { width: 100%; max-height: 70vh; border-radius: var(--radius); background: #000; display: block; }
	.audio { display: flex; gap: var(--sp-4); align-items: center; border: 1px solid var(--border); padding: var(--sp-3); border-radius: var(--radius); background: var(--surface); }
	.audio img { width: 96px; height: 96px; object-fit: cover; border-radius: var(--radius); }
	.audio div { display: grid; gap: var(--sp-2); flex: 1; }
	audio { width: 100%; }
	.cap { color: var(--text-dim); font-size: .9rem; margin-top: var(--sp-2); }
</style>
