<script lang="ts">
	let { data }: { data: { urls: string[]; layout?: 'grid' | 'masonry' | 'carousel'; caption?: string } } = $props();
	let open = $state<string | null>(null);
</script>

<div class="g {data.layout ?? 'grid'}">
	{#each data.urls as url, i (i)}
		<button type="button" onclick={() => (open = url)} aria-label="View image {i + 1}">
			<img src={url} alt="" loading="lazy" referrerpolicy="no-referrer" />
		</button>
	{/each}
</div>
{#if data.caption}<p class="cap">{data.caption}</p>{/if}

{#if open}
	<button type="button" class="lightbox" onclick={() => (open = null)} aria-label="Close">
		<img src={open} alt="" referrerpolicy="no-referrer" />
	</button>
{/if}

<style>
	button { padding: 0; border: 0; background: none; cursor: zoom-in; display: block; }
	img { width: 100%; display: block; border-radius: var(--radius); }
	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--sp-2); }
	.grid img { aspect-ratio: 1; object-fit: cover; }
	.masonry { columns: 3 180px; column-gap: var(--sp-2); }
	.masonry button { margin-bottom: var(--sp-2); break-inside: avoid; }
	.carousel { display: flex; gap: var(--sp-2); overflow-x: auto; scroll-snap-type: x mandatory; }
	.carousel button { flex: 0 0 85%; scroll-snap-align: center; }
	.carousel img { max-height: 60vh; object-fit: contain; background: var(--surface); }
	.cap { color: var(--text-dim); font-size: .9rem; margin-top: var(--sp-2); }
	.lightbox { position: fixed; inset: 0; z-index: 100; background: rgb(0 0 0 / .92); display: grid; place-items: center; cursor: zoom-out; }
	.lightbox img { max-width: 94vw; max-height: 94vh; width: auto; object-fit: contain; }
</style>
