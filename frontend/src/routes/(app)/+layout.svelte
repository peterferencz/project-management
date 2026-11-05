<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const links = [
		{ href: '/projects', label: 'Projects', match: ['/projects', '/project'] },
		{ href: '/profile', label: 'Profile', match: ['/profile'] }
	];

	const isActive = (match: string[]) =>
		match.some((m) => page.url.pathname === m || page.url.pathname.startsWith(m + '/'));
</script>

<header class="nav">
	<div class="nav-inner">
		<a class="brand" href="/projects">[ pm ]</a>
		<nav aria-label="Main">
			{#each links as link (link.href)}
				<a href={link.href} class:active={isActive(link.match)} aria-current={isActive(link.match) ? 'page' : undefined}>
					{link.label}
				</a>
			{/each}
		</nav>
		<a class="who" href="/profile" aria-label="Profile: {data.user.username}">
			<span class="avatar" aria-hidden="true">{data.user.username.charAt(0).toUpperCase()}</span>
		</a>
	</div>
</header>

<main class="container">
	{@render children()}
</main>

<style>
	.nav {
		position: sticky;
		top: 0;
		z-index: 30;
		border-bottom: 1px solid var(--line);
		background: color-mix(in srgb, var(--bg) 82%, transparent);
		backdrop-filter: blur(10px);
	}

	.nav-inner {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		max-width: 760px;
		margin: 0 auto;
		padding: 0.7rem 1.25rem;
	}

	.brand {
		font-family: var(--mono);
		font-weight: 700;
		color: var(--text-strong);
		text-decoration: none;
	}

	nav {
		display: flex;
		flex: 1;
		gap: 0.25rem;
	}

	nav a {
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		font-family: var(--mono);
		font-size: 0.82rem;
		color: var(--dim);
		text-decoration: none;
		transition:
			background 0.15s,
			color 0.15s;
	}

	nav a:hover,
	nav a:focus-visible {
		color: var(--text-strong);
		outline: none;
	}

	nav a.active {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.avatar {
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		border: 1px solid var(--line-hi);
		border-radius: 8px;
		background: var(--accent-soft);
		color: var(--accent);
		font-family: var(--mono);
		font-size: 0.85rem;
		font-weight: 700;
	}

	.who:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
		border-radius: 8px;
	}
</style>
