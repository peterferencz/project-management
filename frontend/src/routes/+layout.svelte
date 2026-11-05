<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Toasts from '#lib/components/Toasts.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<Toasts />
<ConfirmDialog />
