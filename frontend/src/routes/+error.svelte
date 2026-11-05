<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status}</title>
</svelte:head>

<main class="container narrow">
	<h1>[ {page.status} ]</h1>
	<p class="lead">{page.error?.message ?? 'Something went wrong'}</p>
	<p class="lead"><a class="link-btn" href="/projects">Back to projects</a></p>
</main>
