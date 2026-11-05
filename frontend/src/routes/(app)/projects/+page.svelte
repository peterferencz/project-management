<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import { api, handleApiError } from '#lib/api.js';
	import { notify } from '#lib/toast.svelte.js';
	import { LIMITS } from '#lib/types.js';
	import { formatDate } from '#lib/format.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let name = $state('');
	let description = $state('');
	let submitting = $state(false);
	let showForm = $state(false);
	let nameInput = $state<HTMLInputElement>();

	async function toggleForm() {
		showForm = !showForm;
		if (showForm) {
			await tick();
			nameInput?.focus();
		}
	}

	async function createProject(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;
		try {
			await api.projects.create(name.trim(), description.trim());
			name = '';
			description = '';
			showForm = false;
			notify.success('Project created');
			await invalidate('app:projects');
		} catch (err) {
			await handleApiError(err, 'Error creating project');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Projects</title>
</svelte:head>

<header class="page-head">
	<div>
		<h1>[ projects ]</h1>
		<p class="sub">{data.projects.length} {data.projects.length === 1 ? 'project' : 'projects'}</p>
	</div>

	<button
		type="button"
		class="btn"
		class:secondary={showForm}
		aria-expanded={showForm}
		aria-controls="create-form"
		onclick={toggleForm}
	>
		{showForm ? 'Close' : 'New project'}
	</button>
</header>

{#if showForm}
	<form id="create-form" class="panel" onsubmit={createProject} transition:slide={{ duration: 180 }}>
		<label class="field">
			<span class="label">name</span>
			<input
				type="text"
				bind:this={nameInput}
				bind:value={name}
				maxlength={LIMITS.projectName.max}
				placeholder="my-new-project"
				autocomplete="off"
				required
			/>
		</label>

		<label class="field">
			<span class="label">
				<span>description <span class="opt">(optional)</span></span>
				<span class="opt">{description.length}/{LIMITS.projectDescription.max}</span>
			</span>
			<textarea
				bind:value={description}
				maxlength={LIMITS.projectDescription.max}
				rows="3"
				placeholder="what is this project about?"
			></textarea>
		</label>

		<div class="actions">
			<button type="button" class="btn secondary" onclick={toggleForm}>Cancel</button>
			<button type="submit" class="btn" disabled={submitting}>
				{submitting ? 'Creating…' : 'Create project'}
			</button>
		</div>
	</form>
{/if}

{#if data.projects.length === 0}
	<div class="panel empty">
		<p>no projects yet</p>
		<p class="hint">Click “New project” to create your first one.</p>
	</div>
{:else}
	<ul class="list">
		{#each data.projects as p (p.id)}
			<li>
				<a class="row" href={`/project/${p.id}`}>
					<span class="name">{p.name}</span>
					{#if p.description}
						<span class="desc">{p.description}</span>
					{/if}
					<span class="meta">created {formatDate(p.created_at)}</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.row {
		display: grid;
		gap: 0.3rem;
		padding: 1.1rem 1.25rem;
		color: inherit;
		text-decoration: none;
		box-shadow: inset 3px 0 0 transparent;
		transition:
			background 0.15s,
			box-shadow 0.15s;
	}

	.row:hover,
	.row:focus-visible {
		background: var(--surface-2);
		box-shadow: inset 3px 0 0 var(--accent);
		outline: none;
	}

	.name {
		font-family: var(--mono);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-strong);
		overflow-wrap: anywhere;
		transition: color 0.15s;
	}

	.row:hover .name,
	.row:focus-visible .name {
		color: var(--accent);
	}

	.desc {
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--dim);
		overflow-wrap: anywhere;
	}

	.meta {
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--placeholder);
	}

	@media (max-width: 520px) {
		.row {
			padding: 1rem;
		}
	}
</style>
