<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { api, handleApiError } from '#lib/api.js';
	import { formatLongDate } from '#lib/format.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let loggingOut = $state(false);

	async function logout() {
		loggingOut = true;
		try {
			await api.auth.logout();
			await invalidate('app:user');
			await goto('/login');
		} catch (e) {
			await handleApiError(e, 'Logout failed. Please try again.');
		} finally {
			loggingOut = false;
		}
	}
</script>

<svelte:head>
	<title>Profile</title>
</svelte:head>

<header class="page-head">
	<h1>[ profile ]</h1>
</header>

<section class="panel">
	<div class="identity">
		<span class="avatar" aria-hidden="true">{data.user.username.charAt(0).toUpperCase()}</span>
		<span class="username">{data.user.username}</span>
	</div>

	<dl>
		<div class="row">
			<dt>username</dt>
			<dd>{data.user.username}</dd>
		</div>
		<div class="row">
			<dt>member since</dt>
			<dd>{formatLongDate(data.user.createdAt)}</dd>
		</div>
	</dl>
</section>

<div class="actions split">
	<button type="button" class="btn danger" onclick={logout} disabled={loggingOut}>
		{loggingOut ? 'Logging out…' : 'Log out'}
	</button>
</div>

<style>
	.identity {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.25rem;
		padding-bottom: 1.25rem;
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
		overflow-wrap: anywhere;
	}
</style>
