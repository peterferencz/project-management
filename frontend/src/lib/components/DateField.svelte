<script lang="ts">
	import DatePopover from './DatePopover.svelte';
	import { formatFullDate } from '#lib/format.js';

	let { value = $bindable(''), id }: { value: string; id?: string } = $props();

	let button = $state<HTMLButtonElement>();

	export function focus() {
		button?.focus();
	}
</script>

<div class="date-field">
	<DatePopover value={value || null} onselect={(v) => (value = v ?? '')}>
		{#snippet trigger({ open, toggle })}
			<button
				type="button"
				{id}
				bind:this={button}
				class="field-btn"
				class:empty={!value}
				aria-haspopup="dialog"
				aria-expanded={open}
				onclick={toggle}
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
					<path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
				</svg>
				<span>{value ? formatFullDate(value) : 'No due date'}</span>
			</button>
		{/snippet}
	</DatePopover>

	{#if value}
		<button type="button" class="btn secondary sm" onclick={() => (value = '')}>Clear</button>
	{/if}
</div>

<style>
	.date-field {
		display: flex;
		align-items: stretch;
		gap: 0.6rem;
		max-width: 24rem;
	}

	.field-btn {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.7rem 0.85rem;
		border: 1px solid var(--line-hi);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text);
		font-family: var(--mono);
		font-size: 0.9rem;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.field-btn.empty {
		color: var(--placeholder);
	}

	.field-btn svg {
		flex-shrink: 0;
		color: var(--dim);
	}

	.field-btn:hover,
	.field-btn[aria-expanded='true'] {
		border-color: var(--accent);
	}

	.field-btn:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
</style>
