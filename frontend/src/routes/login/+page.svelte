<script lang="ts">
	import '#lib/theme.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';

	type Mode = 'login' | 'register';

	let mode = $state<Mode>('login');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);
	let usernameInput = $state<HTMLInputElement>();

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

	onMount(() => {
		usernameInput?.focus();
		return () => clearTimeout(toastTimer);
	});

	function switchMode(next: Mode) {
		mode = next;
		password = '';
		confirmPassword = '';
		dismiss();
		usernameInput?.focus();
	}

	// POST JSON and parse the reply defensively (the body may not be JSON, e.g. a proxy error page)
	async function post(path: string, body: unknown) {
		const response = await fetch(path, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await response.json().catch(() => null);
		return { ok: response.ok, message: data?.message as string | undefined };
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		dismiss();

		if (mode === 'register' && password !== confirmPassword) {
			showError('Passwords do not match.');
			return;
		}

		submitting = true;
		try {
			if (mode === 'register') {
				const created = await post('/api/register', { username, password });
				if (!created.ok) {
					showError(created.message || 'Registration failed');
					return;
				}
			}

			const login = await post('/api/login', { username, password });
			if (login.ok) {
				goto('/profile');
				return;
			}

			if (mode === 'register') {
				// the account exists now, so send the user to the login form
				switchMode('login');
				showError('Account created, but signing in failed. Please log in.');
			} else {
				showError(login.message || 'Login failed');
			}
		} catch {
			showError('Could not reach the server. Check your connection and try again.');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Login' : 'Register'}</title>
</svelte:head>

<div class="page">
	<main>
		<header>
			<h1>[ {mode} ]</h1>
		</header>

		<form class="panel" onsubmit={handleSubmit}>
			<label class="field">
				<span class="label">username</span>
				<input
					type="text"
					bind:this={usernameInput}
					bind:value={username}
					autocomplete="username"
					minlength={mode === 'register' ? 3 : undefined}
					maxlength="100"
					required
				/>
			</label>

			<label class="field">
				<span class="label">password</span>
				<input
					type="password"
					bind:value={password}
					autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
					minlength={mode === 'register' ? 10 : undefined}
					maxlength="72"
					required
				/>
				{#if mode === 'register'}
					<span class="hint" transition:slide={{ duration: 150 }}>10 to 72 characters</span>
				{/if}
			</label>

			{#if mode === 'register'}
				<label class="field" transition:slide={{ duration: 150 }}>
					<span class="label">confirm password</span>
					<input
						type="password"
						bind:value={confirmPassword}
						autocomplete="new-password"
						maxlength="72"
						required
					/>
				</label>
			{/if}

			<button type="submit" class="btn" disabled={submitting}>
				{#if mode === 'login'}
					{submitting ? 'Signing in…' : 'Log in'}
				{:else}
					{submitting ? 'Creating account…' : 'Create account'}
				{/if}
			</button>
		</form>

		<p class="switch">
			{#if mode === 'login'}
				No account yet?
				<button type="button" class="link" onclick={() => switchMode('register')}>Register</button>
			{:else}
				Already have an account?
				<button type="button" class="link" onclick={() => switchMode('login')}>Log in</button>
			{/if}
		</p>
	</main>

	<!-- Fixed-position toast: appears over the page, so it never shifts the layout -->
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
		display: grid;
		place-items: center;
		color: var(--text);
		font-family: var(--sans);
		background:
			radial-gradient(900px 420px at 50% -120px, var(--bg-glow), transparent 70%),
			radial-gradient(var(--bg-dots) 1px, transparent 1px) 0 0 / 22px 22px,
			var(--bg);
		padding: 2rem 1.25rem;
		box-sizing: border-box;
	}

	main {
		width: 100%;
		max-width: 420px;
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

	.panel {
		background: linear-gradient(180deg, var(--surface-2), var(--surface));
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 1.25rem;
	}

	.field {
		display: block;
		margin-bottom: 1rem;
	}

	.label {
		display: block;
		margin-bottom: 0.4rem;
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--dim);
	}

	.hint {
		display: block;
		margin-top: 0.4rem;
		font-family: var(--mono);
		font-size: 0.75rem;
		color: var(--dim);
	}

	input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.7rem 0.85rem;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--line-hi);
		border-radius: 8px;
		font-family: var(--mono);
		font-size: 0.9rem;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	input:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	.btn {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: 1px solid var(--accent);
		border-radius: 8px;
		background: var(--accent);
		color: var(--on-accent);
		font-family: var(--mono);
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			box-shadow 0.15s,
			opacity 0.15s;
	}

	.btn:hover:not(:disabled) {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
		box-shadow: 0 0 24px var(--accent-glow);
	}

	.btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: wait;
	}

	/* switch between login and register */
	.switch {
		margin: 1.25rem 0 0;
		text-align: center;
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--dim);
	}

	.link {
		padding: 0;
		border: 0;
		background: none;
		color: var(--text);
		font: inherit;
		text-decoration: underline;
		text-underline-offset: 4px;
		cursor: pointer;
		transition: color 0.15s;
	}

	.link:hover,
	.link:focus-visible {
		color: var(--accent);
		outline: none;
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
		.toast {
			right: 1rem;
			bottom: 1rem;
			width: calc(100vw - 2rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.btn,
		.link,
		input,
		.toast-close {
			transition: none;
		}
	}
</style>