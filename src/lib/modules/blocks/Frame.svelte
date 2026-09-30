<script lang="ts">
	/** Sandboxed third-party iframe with a fixed aspect ratio or height. */
	let { src, title, aspect, height }: { src: string; title: string; aspect?: number; height?: number } = $props();
</script>

<div class="frame" style={height ? `height:${height}px` : `aspect-ratio:${aspect ?? 16 / 9}`} class:tall={(aspect ?? 1) < 1}>
	<iframe
		{src}
		{title}
		loading="lazy"
		referrerpolicy="strict-origin-when-cross-origin"
		sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
		allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write; xr-spatial-tracking"
		allowfullscreen
	></iframe>
</div>

<style>
	.frame { width: 100%; border-radius: var(--radius); overflow: hidden; background: #000; }
	.frame.tall { max-width: min(100%, 420px); margin-inline: auto; }
	iframe { width: 100%; height: 100%; border: 0; display: block; }
</style>
