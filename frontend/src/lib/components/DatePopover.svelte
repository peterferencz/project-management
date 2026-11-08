<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import DatePicker from './DatePicker.svelte';

	type Props = {
		value: string | null;
		onselect: (value: string | null) => void;
		/** Which edge of the trigger the calendar lines up with */
		align?: 'start' | 'end';
		/** Renders whatever opens the calendar; call `toggle` from its click handler */
		trigger: Snippet<[{ open: boolean; toggle: () => void }]>;
	};

	let { value, onselect, align = 'start', trigger }: Props = $props();

	// approximate calendar size (px), used to decide whether it fits below / inside the viewport
	const WIDTH = 288;
	const HEIGHT = 372;
	const GAP = 6;
	const MARGIN = 8;

	let open = $state(false);
	let anchor = $state<HTMLElement>();
	let pos = $state({ left: 0, top: 0, bottom: 0, up: false });

	// Fixed positioning so overflow-hidden ancestors (task list, sliding form) cannot clip the calendar
	function toggle() {
		if (open || !anchor) {
			open = false;
			return;
		}
		const r = anchor.getBoundingClientRect();
		const below = window.innerHeight - r.bottom;
		const left = align === 'end' ? r.right - WIDTH : r.left;
		pos = {
			left: Math.max(MARGIN, Math.min(left, window.innerWidth - WIDTH - MARGIN)),
			top: r.bottom + GAP,
			bottom: window.innerHeight - r.top + GAP,
			up: below < HEIGHT + GAP && r.top > below
		};
		open = true;
	}

	async function select(v: string | null) {
		open = false;
		onselect(v);
		// give focus back to the trigger (the first button in the anchor)
		await tick();
		anchor?.querySelector('button')?.focus();
	}
</script>

<svelte:window
	onclick={(e) => {
		// composedPath() is captured at dispatch time, so it still works if the clicked node was re-rendered away
		if (open && anchor && !e.composedPath().includes(anchor)) open = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape' && open) {
			e.stopPropagation();
			select(value);
		}
	}}
	onresize={() => (open = false)}
	onscrollcapture={() => (open = false)}
/>

<span class="anchor" bind:this={anchor}>
	{@render trigger({ open, toggle })}

	{#if open}
		<div
			class="pop"
			style:left="{pos.left}px"
			style:top={pos.up ? undefined : `${pos.top}px`}
			style:bottom={pos.up ? `${pos.bottom}px` : undefined}
			transition:fade={{ duration: 100 }}
		>
			<DatePicker {value} onselect={select} />
		</div>
	{/if}
</span>

<style>
	.anchor {
		display: flex;
		flex: 1 1 auto;
		min-width: 0;
	}

	.pop {
		position: fixed;
		z-index: 40; /* above the sticky nav (30) */
	}
</style>
