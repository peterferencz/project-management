<script lang="ts">
	import { confirmState } from '#lib/confirm.svelte.js';

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (confirmState.current && dialog && !dialog.open) dialog.showModal();
	});

	function close(accepted: boolean) {
		confirmState.current?.resolve(accepted);
		confirmState.current = null;
		dialog?.close();
	}
</script>

{#if confirmState.current}
	{@const req = confirmState.current}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<dialog
		bind:this={dialog}
		aria-labelledby="confirm-title"
		oncancel={(e) => {
			e.preventDefault();
			close(false);
		}}
		onclick={(e) => {
			if (e.target === dialog) close(false);
		}}
	>
		<div class="box">
			<h2 id="confirm-title">{req.title}</h2>
			<p>{req.message}</p>
			<div class="actions">
				<button type="button" class="btn secondary" onclick={() => close(false)}>Cancel</button>
				<button type="button" class="btn" class:danger={req.danger} class:solid={req.danger} onclick={() => close(true)}>
					{req.confirmLabel ?? 'Confirm'}
				</button>
			</div>
		</div>
	</dialog>
{/if}

<style>
	dialog {
		width: min(420px, calc(100vw - 2rem));
		padding: 0;
		border: 1px solid var(--line-hi);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--text);
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
	}

	dialog::backdrop {
		background: rgba(4, 6, 10, 0.7);
	}

	.box {
		padding: 1.25rem;
	}

	p {
		margin: 0.6rem 0 1.25rem;
		color: var(--dim);
		overflow-wrap: anywhere;
	}
</style>
