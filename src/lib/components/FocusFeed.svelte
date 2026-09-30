<script lang="ts">
	/**
	 * Focus feed: one post at a time.
	 *
	 *   i      live      full modules mounted (after the snap settles)
	 *   i ± 1  snapshot  static preview, half-visible in the fog
	 *   i ± 2  prefetch  data fetched + snapshot image decoded, not rendered
	 *
	 * One gesture = one post. If the next post isn't ready yet, the feed
	 * "powers up": it strains toward the next post and the fog charges until
	 * the snapshot is ready, then releases. If it's ready, it snaps instantly.
	 */
	import { onMount, untrack } from 'svelte';
	import type { FeedPage, Post, SessionUser } from '$lib/types';
	import PostView from './PostView.svelte';
	import SnapshotCard from './SnapshotCard.svelte';

	let {
		initial,
		scope = 'all',
		me,
		newerFrom = null,
		emptyText = 'Nothing here yet.'
	}: {
		initial: FeedPage;
		scope?: string;
		me: SessionUser | null;
		/** Cursor to load newer posts above the first one (when opened mid-feed). */
		newerFrom?: string | null;
		emptyText?: string;
	} = $props();

	const SLIDE = 0.74; // focused post height, fraction of viewport
	const GAP = 0.035;
	const STEP = SLIDE + GAP;
	const PULL = 0.07; // how far the feed strains toward the next post while charging
	const STALL_MS = 4000;
	const SNAP_MS = 380;

	let posts = $state<Post[]>(untrack(() => [...initial.posts]));
	let index = $state(0);
	let olderCursor = $state<string | null>(untrack(() => initial.next));
	let newerCursor = $state<string | null>(untrack(() => newerFrom));
	let loadingOlder = false;
	let loadingNewer = false;
	let loadError = $state(false);

	let ready = $state(new Set<string>());
	let liveId = $state<string | null>(null);
	let animating = $state(false);
	let releasing = $state(false);
	let charge = $state<{ dir: 1 | -1; level: number; stalled: boolean } | null>(null);
	let bump = $state(0); // end-of-feed nudge

	let H = $state(800);
	let reducedMotion = $state(false);
	let scroller = $state<HTMLElement | null>(null);
	let root: HTMLElement;

	const cursorOf = (p: Post) => `${p.createdAt}_${p.id}`;
	const current = $derived(posts[index]);

	// ── Readiness: a post is "ready" when its data is here and its snapshot image has decoded ──
	function preload(p: Post | undefined) {
		if (!p || ready.has(p.id)) return;
		const done = () => (ready = new Set(ready).add(p.id));
		if (!p.snapshot.image) return done();
		const img = new Image();
		img.referrerPolicy = 'no-referrer';
		img.onload = img.onerror = done;
		img.src = p.snapshot.image;
	}

	async function loadOlder() {
		if (loadingOlder || !olderCursor) return;
		loadingOlder = true;
		loadError = false;
		try {
			const res = await fetch(`/api/feed?scope=${encodeURIComponent(scope)}&before=${encodeURIComponent(olderCursor)}`);
			if (!res.ok) throw new Error();
			const page: FeedPage = await res.json();
			const seen = new Set(posts.map((p) => p.id));
			posts = [...posts, ...page.posts.filter((p) => !seen.has(p.id))];
			olderCursor = page.next;
		} catch {
			loadError = true;
		} finally {
			loadingOlder = false;
		}
	}

	async function loadNewer() {
		if (loadingNewer || !newerCursor) return;
		loadingNewer = true;
		loadError = false;
		try {
			const res = await fetch(`/api/feed?scope=${encodeURIComponent(scope)}&after=${encodeURIComponent(newerCursor)}`);
			if (!res.ok) throw new Error();
			const page: FeedPage = await res.json();
			const seen = new Set(posts.map((p) => p.id));
			const fresh = page.posts.filter((p) => !seen.has(p.id));
			posts = [...fresh, ...posts];
			index += fresh.length;
			newerCursor = page.next;
		} catch {
			loadError = true;
		} finally {
			loadingNewer = false;
		}
	}

	// Keep the window around the focused post prepared.
	$effect(() => {
		const i = index;
		const n = posts.length;
		untrack(() => {
			for (let k = i - 2; k <= i + 2; k++) preload(posts[k]);
			if (i + 2 >= n - 1) loadOlder();
			if (i - 2 < 0 && newerCursor) loadNewer();
		});
	});

	const isReady = (k: number) => k >= 0 && k < posts.length && ready.has(posts[k].id);
	const hasMore = (dir: 1 | -1) => (dir === 1 ? index + 1 < posts.length || !!olderCursor : index > 0 || !!newerCursor);

	// ── Movement ──
	function go(dir: 1 | -1, fromCharge = false) {
		liveId = null;
		releasing = fromCharge && !reducedMotion;
		animating = true;
		charge = null;
		index += dir;
		scroller?.scrollTo({ top: 0 });
		setTimeout(
			() => {
				animating = false;
				releasing = false;
				liveId = posts[index]?.id ?? null;
			},
			reducedMotion ? 0 : SNAP_MS
		);
	}

	let raf = 0;
	function startCharge(dir: 1 | -1) {
		const start = performance.now();
		let lastBuzz = 0;
		charge = { dir, level: 0, stalled: false };
		cancelAnimationFrame(raf);
		const tick = (now: number) => {
			if (!charge || charge.dir !== dir) return;
			const t = now - start;
			if (isReady(index + dir)) return go(dir, true);
			if (t > STALL_MS) {
				// Post data is here but its image is slow: advance onto the snapshot anyway.
				if (posts[index + dir]) return go(dir, true);
				// Keep watching: if the post arrives (e.g. after Retry) the charge still releases.
				if (!charge.stalled) charge = { dir, level: charge.level, stalled: true };
				raf = requestAnimationFrame(tick);
				return;
			}
			const level = 1 - Math.exp(-t / 900);
			charge = { dir, level, stalled: false };
			if (t - lastBuzz > 220 && 'vibrate' in navigator) {
				navigator.vibrate(Math.round(8 + level * 24));
				lastBuzz = t;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	}

	function cancelCharge() {
		cancelAnimationFrame(raf);
		charge = null;
	}

	function intent(dir: 1 | -1) {
		if (animating) return;
		if (charge) {
			if (charge.dir !== dir) cancelCharge();
			return;
		}
		if (!hasMore(dir)) {
			bump = dir;
			setTimeout(() => (bump = 0), 220);
			return;
		}
		if (isReady(index + dir)) go(dir);
		else {
			if (dir === 1) loadOlder();
			else loadNewer();
			startCharge(dir);
		}
	}

	function retry() {
		if (!charge) return;
		const dir = charge.dir;
		cancelCharge();
		if (dir === 1) loadOlder();
		else loadNewer();
		startCharge(dir);
	}

	// ── Input normalization ──
	function canScrollInside(dir: 1 | -1, target: EventTarget | null) {
		if (!scroller || !(target instanceof Node) || !scroller.contains(target)) return false;
		return dir === 1 ? scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1 : scroller.scrollTop > 0;
	}

	let wheelAcc = 0;
	let wheelLocked = false;
	let wheelQuiet: ReturnType<typeof setTimeout>;
	function onWheel(e: WheelEvent) {
		if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
		const dir = e.deltaY > 0 ? 1 : -1;
		if (!wheelLocked && canScrollInside(dir, e.target)) return;
		e.preventDefault();
		clearTimeout(wheelQuiet);
		// Trackpads keep emitting inertia events; wait for quiet before accepting a new gesture.
		wheelQuiet = setTimeout(() => {
			wheelLocked = false;
			wheelAcc = 0;
		}, 160);
		if (wheelLocked) return;
		wheelAcc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
		if (Math.abs(wheelAcc) > 40) {
			wheelLocked = true;
			wheelAcc = 0;
			intent(dir);
		}
	}

	let touch: { y: number; edgeDown: boolean; edgeUp: boolean } | null = null;
	function onTouchStart(e: TouchEvent) {
		const inside = scroller?.contains(e.target as Node);
		touch = {
			y: e.touches[0].clientY,
			edgeDown: !inside || !canScrollInside(1, e.target),
			edgeUp: !inside || !canScrollInside(-1, e.target)
		};
	}
	function onTouchMove(e: TouchEvent) {
		if (!touch) return;
		const dy = touch.y - e.touches[0].clientY;
		if ((dy > 0 && touch.edgeDown) || (dy < 0 && touch.edgeUp)) e.preventDefault();
	}
	function onTouchEnd(e: TouchEvent) {
		if (!touch) return;
		const dy = touch.y - e.changedTouches[0].clientY;
		if (dy > 50 && touch.edgeDown) intent(1);
		else if (dy < -50 && touch.edgeUp) intent(-1);
		touch = null;
	}

	function onKey(e: KeyboardEvent) {
		const t = e.target as HTMLElement;
		if (t?.closest?.('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
		if (['ArrowDown', 'PageDown', 'j'].includes(e.key)) {
			e.preventDefault();
			intent(1);
		} else if (['ArrowUp', 'PageUp', 'k'].includes(e.key)) {
			e.preventDefault();
			intent(-1);
		} else if (e.key === 'Escape' && charge) cancelCharge();
	}

	onMount(() => {
		const mq = matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = mq.matches;
		mq.onchange = () => (reducedMotion = mq.matches);
		root.addEventListener('wheel', onWheel, { passive: false });
		root.addEventListener('touchmove', onTouchMove, { passive: false });
		liveId = posts[0]?.id ?? null;
		return () => {
			root.removeEventListener('wheel', onWheel);
			root.removeEventListener('touchmove', onTouchMove);
			cancelAnimationFrame(raf);
		};
	});

	function removePost(id: string) {
		const i = posts.findIndex((p) => p.id === id);
		if (i < 0) return;
		posts = posts.filter((p) => p.id !== id);
		if (index >= posts.length) index = Math.max(0, posts.length - 1);
		liveId = posts[index]?.id ?? null;
	}

	// ── Layout ──
	const top = $derived((1 - SLIDE) / 2);
	const pull = $derived(charge && !reducedMotion ? -charge.dir * charge.level * PULL : bump ? -bump * 0.02 : 0);
	const windowed = $derived(
		[-1, 0, 1].map((d) => ({ d, k: index + d, post: posts[index + d] })).filter((s) => s.post)
	);
</script>

<svelte:window onkeydown={onKey} />

<div
	class="feed"
	class:releasing
	class:reduced={reducedMotion}
	bind:this={root}
	bind:clientHeight={H}
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	role="feed"
	aria-busy={!!charge}
	style="--H:{H}px"
>
	{#if posts.length === 0}
		<div class="empty">
			<p>{emptyText}</p>
		</div>
	{/if}

	{#each windowed as { d, post } (post.id)}
		<article
			class="slide"
			class:focused={d === 0}
			class:fog={d !== 0}
			style="top:{top * H}px; height:{SLIDE * H}px; transform: translateY({(d * STEP + pull) * H}px)"
			aria-hidden={d !== 0}
			aria-label={d === 0 ? `Post by ${post.author.username}` : undefined}
		>
			{#if d === 0}
				<div class="scroller" bind:this={scroller}>
					{#if liveId === post.id}
						<div class="live"><PostView {post} {me} ondelete={removePost} /></div>
					{:else}
						<div class="under"><SnapshotCard {post} /></div>
					{/if}
				</div>
			{:else}
				<button class="peek" class:above={d < 0} tabindex="-1" onclick={() => intent(d as 1 | -1)} aria-label="Go to {d > 0 ? 'next' : 'previous'} post">
					<SnapshotCard {post} />
				</button>
			{/if}
		</article>
	{/each}

	<!-- Fog edges; the one in the charging direction glows with the charge level -->
	<div class="edge top" style="--charge:{charge?.dir === -1 ? charge.level : 0}" aria-hidden="true"></div>
	<div class="edge bottom" style="--charge:{charge?.dir === 1 ? charge.level : 0}" aria-hidden="true"></div>

	{#if charge && reducedMotion}
		<div class="progress {charge.dir === 1 ? 'b' : 't'}" style="--p:{charge.level}" role="progressbar" aria-label="Loading next post"></div>
	{/if}

	{#if charge?.stalled || (loadError && charge)}
		<div class="stall {charge.dir === 1 ? 'b' : 't'}" role="status">
			Still loading… <button class="btn" onclick={retry}>Retry</button>
		</div>
	{/if}

	{#if posts.length > 0 && index === posts.length - 1 && !olderCursor}
		<div class="edge-note" aria-live="polite">The edge of the world — for now.</div>
	{/if}

	<p class="sr-only" aria-live="polite">{current ? `Post ${index + 1} by ${current.author.username}` : ''}</p>
</div>

<style>
	.feed {
		position: relative;
		height: calc(100dvh - var(--header-h));
		overflow: hidden;
		overscroll-behavior: none;
		touch-action: pan-x pinch-zoom;
	}
	.slide {
		position: absolute;
		left: 50%;
		width: min(760px, calc(100% - 24px));
		margin-left: calc(min(760px, calc(100% - 24px)) / -2);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		transition: transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 380ms, filter 380ms;
		will-change: transform;
	}
	.releasing .slide {
		transition: transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 380ms, filter 380ms;
	}
	.reduced .slide {
		transition: none;
	}
	.focused {
		z-index: 2;
		box-shadow: 0 10px 50px rgb(0 0 0 / 0.5);
	}
	.fog {
		opacity: 0.6;
		filter: blur(1px) saturate(0.7);
		z-index: 1;
		overflow: hidden;
	}
	.scroller {
		height: 100%;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: var(--sp-5);
		touch-action: pan-y pinch-zoom;
	}
	.live {
		animation: fadein 260ms ease-out;
	}
	@keyframes fadein {
		from { opacity: 0.35; }
	}
	.reduced .live { animation: none; }
	.peek {
		all: unset;
		display: block;
		width: 100%;
		height: 100%;
		padding: var(--sp-5);
		box-sizing: border-box;
		cursor: pointer;
	}
	/* The post above shows its bottom edge, so align its content to the bottom */
	.peek.above {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.edge {
		--charge: 0;
		position: absolute;
		left: 0;
		right: 0;
		height: calc((1 - 0.74) / 2 * var(--H));
		pointer-events: none;
		z-index: 3;
		transition: opacity 200ms;
	}
	.edge.top {
		top: 0;
		background:
			radial-gradient(ellipse 60% 100% at 50% 0%, rgb(184 115 51 / calc(var(--charge) * 0.55)), transparent 70%),
			linear-gradient(to bottom, rgb(12 12 10 / 0.75) 0%, rgb(12 12 10 / 0.25) 50%, transparent);
	}
	.edge.bottom {
		bottom: 0;
		background:
			radial-gradient(ellipse 60% 100% at 50% 100%, rgb(184 115 51 / calc(var(--charge) * 0.55)), transparent 70%),
			linear-gradient(to top, rgb(12 12 10 / 0.75) 0%, rgb(12 12 10 / 0.25) 50%, transparent);
	}
	.progress {
		position: absolute;
		left: 0;
		height: 3px;
		width: calc(var(--p) * 100%);
		background: var(--accent);
		z-index: 4;
	}
	.progress.b { bottom: 0; }
	.progress.t { top: 0; }
	.stall {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		z-index: 4;
		display: flex;
		gap: var(--sp-2);
		align-items: center;
		color: var(--text-dim);
		font-size: 0.9rem;
	}
	.stall.b { bottom: 12px; }
	.stall.t { top: 12px; }
	.edge-note {
		position: absolute;
		bottom: 14px;
		left: 0;
		right: 0;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.85rem;
		z-index: 4;
	}
	.empty {
		height: 100%;
		display: grid;
		place-items: center;
		color: var(--text-dim);
	}
</style>
