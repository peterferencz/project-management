<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts } from '#lib/toast.svelte.js';
</script>

<div class="toasts" role="region" aria-live="polite" aria-label="Notifications">
	{#each toasts.items as t (t.id)}
		<div class="toast" class:err={!t.ok} transition:fly={{ x: 24, duration: 180 }}>
			<span class="mark">{t.ok ? '[ ok ]' : '[ error ]'}</span>
			<span class="text">{t.text}</span>
			<button type="button" class="close" aria-label="Dismiss notification" onclick={() => toasts.dismiss(t.id)}>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
					<path d="M2 2l8 8M10 2l-8 8" />
				</svg>
			</button>
		</div>
	{/each}
</div>

<style>
	.toasts {
		position: fixed;
		right: 1.25rem;
		bottom: 1.25rem;
		z-index: 60;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: min(380px, calc(100vw - 2.5rem));
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.8rem 0.8rem 0.8rem 1rem;
		border: 1px solid var(--line-hi);
		border-left: 3px solid var(--accent);
		border-radius: 10px;
		background: var(--surface-2);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
		font-size: 0.9rem;
		line-height: 1.4;
		pointer-events: auto;
	}

	.toast.err {
		border-left-color: var(--danger);
	}

	.mark {
		padding-top: 0.1rem;
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--accent);
		white-space: nowrap;
	}

	.err .mark {
		color: var(--danger);
	}

	.text {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.close {
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

	.close:hover {
		background: var(--line);
		color: var(--text-strong);
	}

	.close:focus-visible {
		outline: 2px solid var(--accent);
	}

	@media (max-width: 520px) {
		.toasts {
			right: 1rem;
			bottom: 1rem;
			width: calc(100vw - 2rem);
		}
	}
</style>
