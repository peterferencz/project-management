<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { api } from '#lib/api.js';
	import { notify } from '#lib/toast.svelte.js';
	import { LIMITS } from '#lib/types.js';

	type Mode = 'login' | 'register';

	let mode = $state<Mode>('login');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);
	let usernameInput = $state<HTMLInputElement>();

	onMount(() => usernameInput?.focus());

	function switchMode(next: Mode) {
		mode = next;
		password = '';
		confirmPassword = '';
		usernameInput?.focus();
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (mode === 'register' && password !== confirmPassword) {
			notify.error('Passwords do not match.');
			return;
		}

		submitting = true;
		try {
			if (mode === 'register') {
				await api.auth.register(username, password);
			}

			try {
				await api.auth.login(username, password);
			} catch (err) {
				if (mode === 'register') {
					// the account exists now, so send the user to the login form
					switchMode('login');
					notify.error('Account created, but signing in failed. Please log in.');
					return;
				}
				throw err;
			}

			await invalidate('app:user');
			await goto('/projects');
		} catch (err) {
			notify.error(err instanceof Error ? err.message : 'Something went wrong');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Login' : 'Register'}</title>
</svelte:head>

<main class="container narrow center">
	<header class="page-head">
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
				minlength={mode === 'register' ? LIMITS.username.min : undefined}
				maxlength={LIMITS.username.max}
				required
			/>
			{#if mode === 'register'}
				<span class="hint" transition:slide={{ duration: 150 }}>
					{LIMITS.username.min} to {LIMITS.username.max} characters
				</span>
			{/if}
		</label>

		<label class="field">
			<span class="label">password</span>
			<input
				type="password"
				bind:value={password}
				autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
				minlength={mode === 'register' ? LIMITS.password.min : undefined}
				maxlength={LIMITS.password.max}
				required
			/>
			{#if mode === 'register'}
				<span class="hint" transition:slide={{ duration: 150 }}>
					{LIMITS.password.min} to {LIMITS.password.max} characters
				</span>
			{/if}
		</label>

		{#if mode === 'register'}
			<label class="field" transition:slide={{ duration: 150 }}>
				<span class="label">confirm password</span>
				<input
					type="password"
					bind:value={confirmPassword}
					autocomplete="new-password"
					maxlength={LIMITS.password.max}
					required
				/>
			</label>
		{/if}

		<button type="submit" class="btn block" disabled={submitting}>
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
			<button type="button" class="link-btn" onclick={() => switchMode('register')}>Register</button>
		{:else}
			Already have an account?
			<button type="button" class="link-btn" onclick={() => switchMode('login')}>Log in</button>
		{/if}
	</p>
</main>

<style>
	.center {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.switch {
		text-align: center;
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--dim);
	}
</style>
