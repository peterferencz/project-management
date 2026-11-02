<script lang="ts">
	import '#lib/theme.css';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';

	type User = { username: string; createdAt: string };

	let user = $state<User | null>(null);
	let loading = $state(true);
	let loggingOut = $state(false);

	// --- error toast (fixed position, auto-dismisses) ---
	const TOAST_MS = 5000;
	let errorMessage = $state('');
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function showError(message: string) {
		errorMessage = message;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(dismiss, TOAST_MS);
	}

	function dismiss() {
		clearTimeout(toastTimer);
		errorMessage = '';
	}

	const memberSince = $derived(
		user
			? new Date(user.createdAt).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})
			: ''
	);

	onMount(() => {
		(async () => {
			try {
				const response = await fetch('/api/user');

				if (response.ok) {
					user = await response.json();
				} else if (response.status == 401) {
					goto('/login');
					return;
				} else {
					showError('Failed to load your profile.');
				}
			} catch {
				showError('Could not reach the server. Check your connection and try again.');
			} finally {
				loading = false;
			}
		})();

		return () => clearTimeout(toastTimer);
	});

	async function handleLogout() {
		loggingOut = true;
		try {
			const response = await fetch('/api/logout', { method: 'POST' });
			if (response.ok) {
				goto('/login');
				return;
			}
			showError('Logout failed. Please try again.');
		} catch {
			showError('Could not reach the server. Check your connection and try again.');
		} finally {
			loggingOut = false;
		}
	}
</script>

<svelte:head>
	<title>Profile</title>
</svelte:head>

<div class="page">
	<main>
		<a class="back" href="/">&lt;- Home</a>

		<header>
			<h1>[ profile ]</h1>
		</header>

		{#if loading}
			<div class="panel empty">loading profile…</div>
		{:else if !user}
			<div class="panel empty">could not load your profile</div>
		{:else}
			<section class="panel">
				<div class="identity">
					<span class="avatar" aria-hidden="true">{user.username.charAt(0).toUpperCase()}</span>
					<span class="username">{user.username}</span>
				</div>

				<dl>
					<div class="row">
						<dt>username</dt>
						<dd>{user.username}</dd>
					</div>
					<div class="row">
						<dt>member since</dt>
						<dd>{memberSince}</dd>
					</div>
				</dl>
			</section>

			<div class="actions">
				<a class="btn secondary" href="/projects">My projects</a>
				<button type="button" class="btn danger" onclick={handleLogout} disabled={loggingOut}>
					{loggingOut ? 'Logging out…' : 'Log out'}
				</button>
			</div>
		{/if}
	</main>

	<!-- Fixed-position toast: floats over the page, never shifts the layout -->
	{#if errorMessage}
		<div class="toast" role="alert" transition:fly={{ x: 24, duration: 180 }}>
			<span class="toast-mark">[ error ]</span>
			<span class="toast-text">{errorMessage}</span>
			<button type="button" class="toast-close" aria-label="Dismiss notification" onclick={dismiss}>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
					<path d="M2 2l8 8M10 2l-8 8" />
				</svg>
			</button>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		background: var(--bg);
	}

	.page {
		--mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		--sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

		min-height: 100vh;
		color: var(--text);
		font-family: var(--sans);
		background:
			radial-gradient(900px 420px at 50% -120px, var(--bg-glow), transparent 70%),
			radial-gradient(var(--bg-dots) 1px, transparent 1px) 0 0 / 22px 22px,
			var(--bg);
		padding: clamp(2rem, 8vw, 5rem) 1.25rem 4rem;
		box-sizing: border-box;
	}

	main {
		max-width: 560px;
		margin: 0 auto;
	}

	/* back link */
	.back {
		display: inline-block;
		margin-bottom: 1.75rem;
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--dim);
		text-decoration: underline;
		text-underline-offset: 4px;
		transition: color 0.15s;
	}

	.back:hover,
	.back:focus-visible {
		color: var(--accent);
		outline: none;
	}

	header {
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
		font-family: var(--mono);
		font-size: clamp(1.6rem, 5vw, 2.4rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text-strong);
	}

	/* panel */
	.panel {
		background: linear-gradient(180deg, var(--surface-2), var(--surface));
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.empty {
		font-family: var(--mono);
		font-size: 0.9rem;
		color: var(--dim);
	}

	.identity {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-bottom: 1.25rem;
		margin-bottom: 1.25rem;
		border-bottom: 1px solid var(--line);
	}

	.avatar {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 3rem;
		height: 3rem;
		border: 1px solid var(--line-hi);
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent);
		font-family: var(--mono);
		font-size: 1.25rem;
		font-weight: 700;
	}

	.username {
		min-width: 0;
		font-family: var(--mono);
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-strong);
		overflow-wrap: anywhere;
	}

	dl {
		margin: 0;
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 0;
	}

	.row + .row {
		border-top: 1px solid var(--line);
	}

	dt {
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--dim);
	}

	dd {
		margin: 0;
		text-align: right;
		font-size: 0.92rem;
		color: var(--text);
		overflow-wrap: anywhere;
	}

	/* buttons */
	.actions {
		display: flex;
		gap: 0.6rem;
	}

	.btn {
		display: inline-block;
		padding: 0.65rem 1.25rem;
		border: 1px solid var(--accent);
		border-radius: 8px;
		background: var(--accent);
		color: var(--on-accent);
		font-family: var(--mono);
		font-size: 0.85rem;
		font-weight: 700;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s,
			opacity 0.15s;
	}

	.btn.secondary {
		background: transparent;
		border-color: var(--line-hi);
		color: var(--text);
	}

	.btn.secondary:hover {
		background: var(--surface-2);
		border-color: var(--accent);
	}

	.btn.danger {
		background: transparent;
		border-color: color-mix(in srgb, var(--danger) 40%, transparent);
		color: var(--danger);
	}

	.btn.danger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--danger) 12%, transparent);
		border-color: var(--danger);
	}

	.btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: wait;
	}

	/* toast */
	.toast {
		position: fixed;
		right: 1.25rem;
		bottom: 1.25rem;
		z-index: 50;
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		width: min(380px, calc(100vw - 2.5rem));
		box-sizing: border-box;
		padding: 0.8rem 0.8rem 0.8rem 1rem;
		border: 1px solid var(--line-hi);
		border-left: 3px solid var(--danger);
		border-radius: 10px;
		background: var(--surface-2);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.toast-mark {
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--danger);
		white-space: nowrap;
		padding-top: 0.1rem;
	}

	.toast-text {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.toast-close {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--dim);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.toast-close:hover {
		background: var(--line);
		color: var(--text-strong);
	}

	.toast-close:focus-visible {
		outline: 2px solid var(--accent);
	}

	@media (max-width: 520px) {
		.actions .btn {
			flex: 1;
		}
		.toast {
			right: 1rem;
			bottom: 1rem;
			width: calc(100vw - 2rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.back,
		.btn,
		.toast-close {
			transition: none;
		}
	}
</style>