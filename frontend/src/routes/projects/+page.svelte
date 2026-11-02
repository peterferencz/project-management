<script lang="ts">
	import '#lib/theme.css';
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { slide } from 'svelte/transition';

	type Project = { id: string | number; name: string; description: string };

	let projects = $state<Project[]>([]);
	let projectName = $state('');
	let projectDescription = $state('');
	let message = $state('');
	let messageOk = $state(true);
	let loading = $state(true);
	let submitting = $state(false);
	let showForm = $state(false);
	let nameInput = $state<HTMLInputElement>();

	async function fetchProjects() {
		try {
			const res = await fetch('/api/projects');
			if (res.ok) {
				projects = await res.json();
			} else if (res.status == 401) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	onMount(fetchProjects);

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
			const res = await fetch('/api/project/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					project_name: projectName,
					project_description: projectDescription
				})
			});
			const data = await res.json();
			message = data.message;
			messageOk = res.ok;
			if (res.ok) {
				projectName = '';
				projectDescription = '';
				showForm = false;
				await fetchProjects();
			}
		} catch {
			message = 'Could not reach the server. Check your connection and try again.';
			messageOk = false;
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Projects</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	<main>
		<a class="back" href="/">&lt;- Home</a>

		<header>
			<div>
				<h1>[ projects ]</h1>
				<p class="sub">
					{loading
						? 'loading…'
						: `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
				</p>
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

		{#if message}
			<p class="status" class:err={!messageOk} role="status" aria-live="polite">
				<span class="status-mark">{messageOk ? '[ ok ]' : '[ error ]'}</span>
				{message}
			</p>
		{/if}

		{#if showForm}
			<form id="create-form" class="panel" onsubmit={createProject} transition:slide={{ duration: 180 }}>
				<label class="field">
					<span class="label">name</span>
					<input
						type="text"
						bind:this={nameInput}
						bind:value={projectName}
						placeholder="my-new-project"
						autocomplete="off"
						required
					/>
				</label>

				<label class="field">
					<span class="label">description</span>
					<textarea
						bind:value={projectDescription}
						rows="3"
						placeholder="what is this project about?"
						required
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

		{#if loading}
			<div class="panel empty">fetching projects…</div>
		{:else if projects.length === 0}
			<div class="panel empty">
				<p>no projects yet</p>
				<p class="hint">Click “New project” to create your first one.</p>
			</div>
		{:else}
			<ul class="list">
				{#each projects as p (p.id)}
					<li>
						<a class="row" href={`/project/${p.id}`}>
							<span class="name">{p.name}</span>
							<span class="desc">{p.description}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		background: var(--bg);
	}

	.page {
		--mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		--sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

		min-height: 100vh;
		color: var(--text);
		font-family: var(--sans);
		background:
			radial-gradient(900px 420px at 50% -120px, var(--bg-glow), transparent 70%),
			radial-gradient(var(--bg-dots) 1px, transparent 1px) 0 0 / 22px 22px,
			var(--bg);
		padding: clamp(2rem, 8vw, 5rem) 1.25rem 4rem;
		box-sizing: border-box;
	}

	main {
		max-width: 760px;
		margin: 0 auto;
	}

	/* header */
	header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
		font-family: var(--mono);
		font-size: clamp(1.6rem, 5vw, 2.4rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text-strong);
	}

	.sub {
		margin: 0.6rem 0 0;
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--dim);
	}

	/* buttons */
	.btn {
		padding: 0.65rem 1.25rem;
		border: 1px solid var(--accent);
		border-radius: 8px;
		background: var(--accent);
		color: var(--on-accent);
		font-family: var(--mono);
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s,
			box-shadow 0.15s,
			opacity 0.15s;
	}

	.btn:hover:not(:disabled) {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
		box-shadow: 0 0 24px var(--accent-glow);
	}

	.btn.secondary {
		background: transparent;
		border-color: var(--line-hi);
		color: var(--text);
	}

	.btn.secondary:hover:not(:disabled) {
		background: var(--surface-2);
		border-color: var(--accent);
		box-shadow: none;
	}

	.btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: wait;
	}

	/* status line */
	.status {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		margin: 0 0 1.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--line-hi);
		border-left: 3px solid var(--accent);
		border-radius: 8px;
		background: var(--surface);
		font-size: 0.9rem;
	}

	.status.err {
		border-left-color: var(--danger);
	}

	.status-mark {
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--accent);
		white-space: nowrap;
	}

	.status.err .status-mark {
		color: var(--danger);
	}

	/* panels + form */
	.panel {
		background: linear-gradient(180deg, var(--surface-2), var(--surface));
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.field {
		display: block;
		margin-bottom: 1rem;
	}

	.label {
		display: block;
		margin-bottom: 0.4rem;
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--dim);
	}

	input,
	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 0.7rem 0.85rem;
		background: var(--bg);
		color: var(--text);
		border: 1px solid var(--line-hi);
		border-radius: 8px;
		font-family: var(--mono);
		font-size: 0.9rem;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	textarea {
		resize: vertical;
		min-height: 5rem;
	}

	input::placeholder,
	textarea::placeholder {
		color: var(--placeholder);
	}

	input:focus-visible,
	textarea:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
	}

	/* project list */
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		background: var(--surface);
	}

	.list li + li {
		border-top: 1px solid var(--line);
	}

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

	/* back link */
	.back {
		display: inline-block;
		margin-bottom: 1.75rem;
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--dim);
		text-decoration: underline;
		text-underline-offset: 4px;
		transition: color 0.15s;
	}

	.back:hover,
	.back:focus-visible {
		color: var(--accent);
		outline: none;
	}

	/* empty / loading */
	.empty {
		margin-bottom: 0;
		font-family: var(--mono);
		font-size: 0.9rem;
		color: var(--dim);
	}

	.empty p {
		margin: 0;
	}

	.hint {
		margin-top: 0.35rem !important;
		color: var(--accent);
		opacity: 0.8;
	}

	@media (max-width: 520px) {
		.row {
			padding: 1rem;
		}
		.actions .btn {
			flex: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row,
		.name,
		.btn,
		input,
		textarea {
			transition: none;
		}
	}
</style>