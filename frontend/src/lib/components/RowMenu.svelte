<script lang="ts">
	import { fade } from 'svelte/transition';

	type Item = { label: string; onclick: () => void; danger?: boolean };

	let { label, items }: { label: string; items: Item[] } = $props();

	const ITEM_HEIGHT = 34; // approximate rendered height of one menu entry (px)
	const GAP = 4;

	let open = $state(false);
	let root = $state<HTMLElement>();
	let button = $state<HTMLButtonElement>();
	let pos = $state({ top: 0, right: 0, bottom: 0, up: false });

	// Fixed positioning escapes `overflow: hidden` on ancestors (e.g. the rounded task list).
	// Opens upwards when there is not enough room below the button.
	function toggle() {
		if (open || !button) {
			open = false;
			return;
		}
		const r = button.getBoundingClientRect();
		const needed = items.length * ITEM_HEIGHT + 16;
		pos = {
			top: r.bottom + GAP,
			bottom: window.innerHeight - r.top + GAP,
			right: window.innerWidth - r.right,
			up: window.innerHeight - r.bottom < needed && r.top > needed
		};
		open = true;
	}
</script>

<!-- Close on outside click or Escape -->
<svelte:window
	onclick={(e) => {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') open = false;
	}}
	onresize={() => (open = false)}
	onscrollcapture={() => (open = false)}
/>

<div class="menu" bind:this={root}>
	<button
		type="button"
		class="menu-btn"
		aria-label={label}
		aria-haspopup="menu"
		aria-expanded={open}
		bind:this={button}
		onclick={toggle}
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
			<circle cx="3" cy="8" r="1.4" />
			<circle cx="8" cy="8" r="1.4" />
			<circle cx="13" cy="8" r="1.4" />
		</svg>
	</button>

	{#if open}
		<div
			class="menu-list"
			role="menu"
			style:right="{pos.right}px"
			style:top={pos.up ? undefined : `${pos.top}px`}
			style:bottom={pos.up ? `${pos.bottom}px` : undefined}
			transition:fade={{ duration: 100 }}
		>
			{#each items as item (item.label)}
				<button
					type="button"
					role="menuitem"
					class:danger={item.danger}
					onclick={() => {
						open = false;
						item.onclick();
					}}
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.menu {
		position: relative;
		flex-shrink: 0;
	}

	.menu-btn {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--dim);
		cursor: pointer;
		transition:
			opacity 0.15s,
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}

	/* hover-only on devices that can hover; always visible on touch.
	   The parent row sets --menu-visible on hover / focus. */
	@media (hover: hover) {
		.menu-btn {
			opacity: var(--menu-opacity, 0);
		}
	}

	.menu-btn:hover,
	.menu-btn[aria-expanded='true'] {
		opacity: 1;
		background: var(--surface-2);
		border-color: var(--line-hi);
		color: var(--text-strong);
	}

	.menu-btn:focus-visible {
		opacity: 1;
		outline: 2px solid var(--accent);
	}

	.menu-list {
		position: fixed;
		z-index: 40; /* above the sticky nav (30) */
		display: flex;
		flex-direction: column;
		min-width: 10.5rem;
		padding: 0.3rem;
		border: 1px solid var(--line-hi);
		border-radius: 10px;
		background: var(--surface-2);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
	}

	.menu-list button {
		padding: 0.5rem 0.75rem;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--text);
		font-family: var(--mono);
		font-size: 0.8rem;
		text-align: left;
		cursor: pointer;
		transition: background 0.1s;
	}

	.menu-list button:hover,
	.menu-list button:focus-visible {
		background: var(--line);
		outline: none;
	}

	.menu-list button.danger {
		color: var(--danger);
	}

	.menu-list button.danger:hover,
	.menu-list button.danger:focus-visible {
		background: color-mix(in srgb, var(--danger) 14%, transparent);
	}
</style>
