<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';

	let { children, data } = $props();
	const path = $derived(page.url.pathname);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#0c0c0a" />
</svelte:head>

<header>
	<a class="logo" href="/">◈ OpenWorld</a>
	<nav>
		<a href="/" class:on={path === '/'}>Feed</a>
		<a href="/spaces" class:on={path.startsWith('/spaces')}>Spaces</a>
		<a href="/about" class:on={path === '/about'}>About</a>
	</nav>
	<div class="me">
		{#if data.user}
			<a class="btn primary" href="/new">+ Post</a>
			<a class="who" href="/u/{data.user.username}" title="Your profile"><Avatar src={data.user.avatar} name={data.user.username} size={28} /></a>
			<form method="POST" action="/auth/logout"><button class="btn ghost">Sign out</button></form>
		{:else}
			<a class="btn primary" href="/auth/login">Sign in<span class="wide">&nbsp;with GitHub</span></a>
		{/if}
	</div>
</header>

<main>{@render children()}</main>

<style>
	header {
		position: sticky; top: 0; z-index: 50; height: var(--header-h);
		display: flex; align-items: center; gap: var(--sp-5); padding: 0 var(--sp-4);
		background: rgb(12 12 10 / 0.85); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border);
	}
	.logo { color: var(--text); font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
	.logo:hover { text-decoration: none; color: var(--accent); }
	nav { display: flex; gap: var(--sp-4); }
	nav a { color: var(--text-dim); }
	nav a.on, nav a:hover { color: var(--text); text-decoration: none; }
	.me { margin-left: auto; display: flex; align-items: center; gap: var(--sp-2); }
	.who { display: flex; }
	@media (max-width: 600px) {
		header { gap: var(--sp-3); }
		.logo { font-size: 0; } .logo::first-letter { font-size: 1.3rem; }
		form { display: none; }
		.wide { display: none; }
		nav { gap: var(--sp-3); }
	}
</style>
