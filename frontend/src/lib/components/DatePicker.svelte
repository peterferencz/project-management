<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import {
		addDays,
		addMonths,
		formatFullDate,
		monthGrid,
		monthTitle,
		todayISO,
		weekdayLabels
	} from '#lib/format.js';

	type Props = {
		/** Selected date ("YYYY-MM-DD") or null */
		value: string | null;
		onselect: (value: string | null) => void;
	};

	let { value, onselect }: Props = $props();

	const today = todayISO();
	const weekdays = weekdayLabels();

	// The keyboard-focused day is the single source of truth; the visible month follows it
	let focused = $state(untrack(() => value ?? todayISO()));
	const days = $derived(monthGrid(focused));
	const month = $derived(focused.slice(0, 7));

	let root = $state<HTMLElement>();

	async function focusDay() {
		await tick();
		root?.querySelector<HTMLElement>(`[data-iso="${focused}"]`)?.focus();
	}

	onMount(focusDay);

	function onkeydown(e: KeyboardEvent) {
		const moves: Record<string, string> = {
			ArrowLeft: addDays(focused, -1),
			ArrowRight: addDays(focused, 1),
			ArrowUp: addDays(focused, -7),
			ArrowDown: addDays(focused, 7),
			PageUp: addMonths(focused, -1),
			PageDown: addMonths(focused, 1)
		};
		const next = moves[e.key];
		if (!next) return;
		e.preventDefault();
		focused = next;
		focusDay();
	}
</script>

<div class="picker" role="dialog" aria-label="Choose a due date" bind:this={root}>
	<div class="head">
		<button type="button" class="nav" aria-label="Previous month" onclick={() => (focused = addMonths(focused, -1))}>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2.5L4.5 7 9 11.5" /></svg>
		</button>
		<span class="title" aria-live="polite">{monthTitle(focused)}</span>
		<button type="button" class="nav" aria-label="Next month" onclick={() => (focused = addMonths(focused, 1))}>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 2.5L9.5 7 5 11.5" /></svg>
		</button>
	</div>

	<div class="weekdays" aria-hidden="true">
		{#each weekdays as w (w)}<span>{w}</span>{/each}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="days" {onkeydown}>
		{#each days as d (d)}
			<button
				type="button"
				class="day"
				class:outside={d.slice(0, 7) !== month}
				class:today={d === today}
				class:selected={d === value}
				data-iso={d}
				tabindex={d === focused ? 0 : -1}
				aria-label={formatFullDate(d)}
				aria-pressed={d === value}
				aria-current={d === today ? 'date' : undefined}
				onclick={() => onselect(d)}
			>
				{Number(d.slice(8))}
			</button>
		{/each}
	</div>

    {#if value}
	    <div class="foot">
           <button type="button" class="clear btn secondary" onclick={() => onselect(null)}>Clear</button>
        </div>
	{/if}
</div>

<style>
	.picker {
		width: 18rem;
		padding: 0.75rem;
		border: 1px solid var(--line-hi);
		border-radius: var(--radius);
		background: var(--surface-2);
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
		font-family: var(--mono);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.title {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-strong);
	}

	.nav {
		display: grid;
		place-items: center;
		width: 1.9rem;
		height: 1.9rem;
		padding: 0;
		border: 1px solid transparent;
		border-radius: 6px;
		background: transparent;
		color: var(--dim);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.nav:hover,
	.nav:focus-visible {
		background: var(--line);
		color: var(--text-strong);
		outline: none;
	}

	.nav:focus-visible {
		border-color: var(--accent);
	}

	.weekdays,
	.days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.weekdays span {
		padding: 0.2rem 0;
		text-align: center;
		font-size: 0.65rem;
		text-transform: lowercase;
		color: var(--placeholder);
	}

	.day {
		aspect-ratio: 1;
		padding: 0;
		border: 1px solid transparent;
		border-radius: 6px;
		background: transparent;
		color: var(--text);
		font-family: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		transition:
			background 0.1s,
			color 0.1s,
			border-color 0.1s;
	}

	.day.outside {
		color: var(--placeholder);
	}

	.day:hover {
		background: var(--line);
		color: var(--text-strong);
	}

	.day.today {
		border-color: var(--line-hi);
		color: var(--accent);
	}

	.day.selected {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
		font-weight: 700;
	}

	.day:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.7rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--line);
	}

	.foot .clear {
		margin-left: auto;
		color: var(--danger);
        padding: 0.2rem 0.65rem;
	}

	.foot .clear:hover,
	.foot .clear:focus-visible {
		border-color: var(--danger);
		color: var(--danger);
	}
</style>
