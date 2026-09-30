<script lang="ts">
	let { src, name, size = 32 }: { src: string | null; name: string; size?: number } = $props();
	let failed = $state(false);
</script>

{#if src && !failed}
	<img {src} alt="" width={size} height={size} style="width:{size}px;height:{size}px" onerror={() => (failed = true)} />
{:else}
	<span style="width:{size}px;height:{size}px;font-size:{size * 0.45}px" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
{/if}

<style>
	img, span { border-radius: 50%; flex-shrink: 0; display: inline-grid; place-items: center; object-fit: cover; }
	span { background: var(--moss-700); color: var(--moss-200); font-weight: 600; }
</style>
