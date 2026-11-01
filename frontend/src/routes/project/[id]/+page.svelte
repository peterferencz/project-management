<script lang="ts">
	import '#lib/theme.css';
	import { onMount, tick } from 'svelte';
	import { slide, fly, fade } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const projectId = page.params.id as string;

	// --- Project state ---
	let project = $state<any>(null);
	let projectName = $state('');
	let projectDescription = $state('');
	let isEditingProject = $state(false);
	let loadError = $state('');
	let loading = $state(true);

	// --- Tasks state ---
	let tasks = $state<any[]>([]);

	// Top-level task creation (collapsed by default)
	let showTaskForm = $state(false);
	let newTaskName = $state('');
	let newTaskDescription = $state('');
	let newTaskExpectedMinutes = $state<number | '' | null>('');
	let newTaskInput = $state<HTMLInputElement>();

	// Sub-task creation
	let activeSubTaskParentId = $state<number | null>(null);
	let subTaskName = $state('');
	let subTaskDescription = $state('');
	let subTaskExpectedMinutes = $state<number | '' | null>('');

	// Inline task editing
	let editingTaskId = $state<number | null>(null);
	let editTaskName = $state('');
	let editTaskDescription = $state('');
	let editTaskExpectedMinutes = $state<number | '' | null>('');

	// Row action dropdown (task and sub-task ids are unique)
	let openMenuId = $state<number | null>(null);

	// --- Toasts ---
	type Toast = { id: number; text: string; ok: boolean };
	const TOAST_MS = 5000;
	let toasts = $state<Toast[]>([]);
	let toastSeq = 0;

	function notify(text: string | undefined, ok = true) {
		if (!text) return;
		const id = ++toastSeq;
		toasts.push({ id, text, ok });
		setTimeout(() => dismiss(id), TOAST_MS);
	}

	function dismiss(id: number) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	const minutes = (v: number | '' | null) => (v === '' || v == null ? null : v);

	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	// --- Data ---
	async function loadData() {
		try {
			const [projRes, tasksRes] = await Promise.all([
				fetch(`/api/project/${projectId}`),
				fetch(`/api/projects/${projectId}/tasks`)
			]);

			if (projRes.status == 401) {
				goto('/login');
				return;
			}

			if (projRes.ok) {
				project = await projRes.json();
				projectName = project.name;
				projectDescription = project.description;
			} else {
				loadError = 'Project not found';
			}

			if (tasksRes.ok) {
				tasks = await tasksRes.json();
			} else {
				notify('Failed to load tasks', false);
			}
		} catch (err) {
			loadError = 'Error connecting to server';
		} finally {
			loading = false;
		}
	}

	onMount(loadData);

	// --- Project handlers ---
	async function updateProject(e: SubmitEvent) {
		e.preventDefault();
		const res = await fetch(`/api/project/${projectId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project_name: projectName, project_description: projectDescription })
		});
		const data = await res.json();
		notify(data.message ?? (res.ok ? 'Project updated successfully' : 'Error updating project'), res.ok);
		if (res.ok) {
			isEditingProject = false;
			project.name = projectName;
			project.description = projectDescription;
		}
	}

	async function deleteProject() {
		if (!confirm('Are you sure you want to delete this project? All associated tasks will be removed.')) return;
		const res = await fetch(`/api/project/${projectId}`, { method: 'DELETE' });
		if (res.ok) {
			goto('/projects');
		} else {
			const data = await res.json();
			notify(data.message ?? 'Error deleting project', false);
		}
	}

	function cancelProjectEdit() {
		projectName = project.name;
		projectDescription = project.description;
		isEditingProject = false;
	}

	// --- Task handlers ---
	async function toggleTaskForm() {
		showTaskForm = !showTaskForm;
		if (showTaskForm) {
			await tick();
			newTaskInput?.focus();
		}
	}

	async function createTopTask(e: SubmitEvent) {
		e.preventDefault();
		const res = await fetch('/api/tasks/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: newTaskName,
				description: newTaskDescription,
				expected_minutes: minutes(newTaskExpectedMinutes),
				project_id: parseInt(projectId),
				parent_task_id: null
			})
		});

		const data = await res.json();
		if (res.ok) {
			newTaskName = '';
			newTaskDescription = '';
			newTaskExpectedMinutes = '';
			showTaskForm = false;
			notify('Task created successfully');
			await loadData();
		} else {
			notify(data.message || 'Error creating task', false);
		}
	}

	async function createSubTask(e: SubmitEvent, parentId: number) {
		e.preventDefault();
		const res = await fetch('/api/tasks/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: subTaskName,
				description: subTaskDescription,
				expected_minutes: minutes(subTaskExpectedMinutes),
				project_id: null,
				parent_task_id: parentId
			})
		});

		const data = await res.json();
		if (res.ok) {
			subTaskName = '';
			subTaskDescription = '';
			subTaskExpectedMinutes = '';
			activeSubTaskParentId = null;
			notify('Sub-task created successfully');
			await loadData();
		} else {
			notify(data.message || 'Error creating sub-task', false);
		}
	}

	function startEditTask(task: any) {
		editingTaskId = task.id;
		editTaskName = task.name;
		editTaskDescription = task.description;
		editTaskExpectedMinutes = task.expected_minutes ?? '';
	}

	async function updateTask(e: SubmitEvent, taskId: number) {
		e.preventDefault();
		const res = await fetch(`/api/tasks/${taskId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: editTaskName,
				description: editTaskDescription,
				expected_minutes: minutes(editTaskExpectedMinutes)
			})
		});

		const data = await res.json();
		if (res.ok) {
			editingTaskId = null;
			notify('Task updated successfully');
			await loadData();
		} else {
			notify(data.message || 'Error updating task', false);
		}
	}

	async function deleteTask(taskId: number) {
		if (!confirm('Are you sure you want to delete this task?')) return;
		const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
		const data = await res.json();
		if (res.ok) {
			notify('Task deleted successfully');
			await loadData();
		} else {
			notify(data.message || 'Error deleting task', false);
		}
	}
</script>

<svelte:head>
	<title>{project ? project.name : 'Project'}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Close any open row menu on outside click or Escape -->
<svelte:window
	onclick={() => (openMenuId = null)}
	onkeydown={(e) => {
		if (e.key === 'Escape') openMenuId = null;
	}}
/>

{#snippet editForm(id: number)}
	<form class="panel inline" onsubmit={(e) => updateTask(e, id)}>
		<label class="field">
			<span class="label">name</span>
			<input type="text" bind:value={editTaskName} required use:focusOnMount />
		</label>
		<label class="field">
			<span class="label">description</span>
			<textarea bind:value={editTaskDescription} rows="2" required></textarea>
		</label>
		<label class="field narrow">
			<span class="label">expected minutes</span>
			<input type="number" bind:value={editTaskExpectedMinutes} min="0" placeholder="optional" />
		</label>
		<div class="actions">
			<button type="button" class="btn secondary sm" onclick={() => (editingTaskId = null)}>Cancel</button>
			<button type="submit" class="btn sm">Save task</button>
		</div>
	</form>
{/snippet}

{#snippet rowMenu(item: any, isTop: boolean)}
	<div class="menu">
		<button
			type="button"
			class="menu-btn"
			aria-label={`Actions for ${item.name}`}
			aria-haspopup="menu"
			aria-expanded={openMenuId === item.id}
			onclick={(e) => {
				e.stopPropagation();
				openMenuId = openMenuId === item.id ? null : item.id;
			}}
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
				<circle cx="3" cy="8" r="1.4" />
				<circle cx="8" cy="8" r="1.4" />
				<circle cx="13" cy="8" r="1.4" />
			</svg>
		</button>

		{#if openMenuId === item.id}
			<div class="menu-list" role="menu" transition:fade={{ duration: 100 }}>
				<button
					type="button"
					role="menuitem"
					onclick={() => {
						openMenuId = null;
						startEditTask(item);
					}}
				>
					Edit
				</button>
				{#if isTop}
					<button
						type="button"
						role="menuitem"
						onclick={() => {
							openMenuId = null;
							activeSubTaskParentId = item.id;
						}}
					>
						Add sub-task
					</button>
				{/if}
				<button
					type="button"
					role="menuitem"
					class="danger"
					onclick={() => {
						openMenuId = null;
						deleteTask(item.id);
					}}
				>
					Delete
				</button>
			</div>
		{/if}
	</div>
{/snippet}

<div class="page">
	<main>
		<a class="back" href="/projects">&lt;- all projects</a>

		{#if loading}
			<div class="panel empty">loading project…</div>
		{:else if !project}
			<div class="panel empty">
				<p>{loadError || 'Project not found.'}</p>
			</div>
		{:else}
			<!-- PROJECT DETAILS -->
			{#if isEditingProject}
				<form class="panel" onsubmit={updateProject} transition:slide={{ duration: 180 }}>
					<label class="field">
						<span class="label">name</span>
						<input type="text" bind:value={projectName} required />
					</label>
					<label class="field">
						<span class="label">description</span>
						<textarea bind:value={projectDescription} rows="3" required></textarea>
					</label>
					<div class="actions split">
						<button type="button" class="btn danger" onclick={deleteProject}>Delete project</button>
						<div class="group">
							<button type="button" class="btn secondary" onclick={cancelProjectEdit}>Cancel</button>
							<button type="submit" class="btn">Save changes</button>
						</div>
					</div>
				</form>
			{:else}
				<header>
					<div class="head-text">
						<h1>[ {project.name} ]</h1>
						<p class="project-desc">{project.description}</p>
					</div>
					<div class="head-actions">
						<button class="btn secondary" onclick={() => (isEditingProject = true)}>Edit project</button>
					</div>
				</header>
			{/if}

			<!-- TASKS -->
			<section aria-labelledby="tasks-h">
				<div class="section-head">
					<div>
						<h2 id="tasks-h"><span class="hash">#</span> tasks</h2>
						<p class="sub">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</p>
					</div>
					<button
						type="button"
						class="btn"
						class:secondary={showTaskForm}
						aria-expanded={showTaskForm}
						aria-controls="task-form"
						onclick={toggleTaskForm}
					>
						{showTaskForm ? 'Close' : 'New task'}
					</button>
				</div>

				{#if showTaskForm}
					<form id="task-form" class="panel" onsubmit={createTopTask} transition:slide={{ duration: 180 }}>
						<label class="field">
							<span class="label">name</span>
							<input
								type="text"
								bind:this={newTaskInput}
								bind:value={newTaskName}
								placeholder="what needs doing?"
								autocomplete="off"
								required
							/>
						</label>
						<label class="field">
							<span class="label">description</span>
							<textarea
								bind:value={newTaskDescription}
								rows="3"
								placeholder="add some detail"
								required
							></textarea>
						</label>
						<label class="field narrow">
							<span class="label">expected minutes</span>
							<input type="number" bind:value={newTaskExpectedMinutes} min="0" placeholder="optional" />
						</label>
						<div class="actions">
							<button type="button" class="btn secondary" onclick={toggleTaskForm}>Cancel</button>
							<button type="submit" class="btn">Add task</button>
						</div>
					</form>
				{/if}

				{#if tasks.length === 0}
					<div class="panel empty">
						<p>no tasks yet</p>
						<p class="hint">Click “New task” to add the first one.</p>
					</div>
				{:else}
					<ul class="list">
						{#each tasks as task (task.id)}
							<li class="task">
								{#if editingTaskId === task.id}
									{@render editForm(task.id)}
								{:else}
									<div class="item">
										<div class="item-body">
											<div class="task-top">
												<span class="name">{task.name}</span>
												{#if task.expected_minutes}
													<span class="mins">[ {task.expected_minutes} min ]</span>
												{/if}
											</div>
											<p class="desc">{task.description}</p>
										</div>
										{@render rowMenu(task, true)}
									</div>
								{/if}

								{#if activeSubTaskParentId === task.id}
									<form
										class="panel inline"
										onsubmit={(e) => createSubTask(e, task.id)}
										transition:slide={{ duration: 180 }}
									>
										<p class="form-title">New sub-task for “{task.name}”</p>
										<label class="field">
											<span class="label">name</span>
											<input
												type="text"
												bind:value={subTaskName}
												autocomplete="off"
												required
												use:focusOnMount
											/>
										</label>
										<label class="field">
											<span class="label">description</span>
											<textarea bind:value={subTaskDescription} rows="2" required></textarea>
										</label>
										<label class="field narrow">
											<span class="label">expected minutes</span>
											<input
												type="number"
												bind:value={subTaskExpectedMinutes}
												min="0"
												placeholder="optional"
											/>
										</label>
										<div class="actions">
											<button
												type="button"
												class="btn secondary sm"
												onclick={() => (activeSubTaskParentId = null)}
											>
												Cancel
											</button>
											<button type="submit" class="btn sm">Save sub-task</button>
										</div>
									</form>
								{/if}

								{#if task.subTasks && task.subTasks.length > 0}
									<ul class="subs">
										{#each task.subTasks as sub (sub.id)}
											<li class="sub-task">
												{#if editingTaskId === sub.id}
													{@render editForm(sub.id)}
												{:else}
													<div class="item">
														<div class="item-body">
															<div class="task-top">
																<span class="name small">{sub.name}</span>
																{#if sub.expected_minutes}
																	<span class="mins">[ {sub.expected_minutes} min ]</span>
																{/if}
															</div>
															<p class="desc">{sub.description}</p>
														</div>
														{@render rowMenu(sub, false)}
													</div>
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
	</main>

	<!-- TOASTS -->
	<div class="toasts" role="region" aria-live="polite" aria-label="Notifications">
		{#each toasts as t (t.id)}
			<div class="toast" class:err={!t.ok} transition:fly={{ x: 24, duration: 180 }}>
				<span class="toast-mark">{t.ok ? '[ ok ]' : '[ error ]'}</span>
				<span class="toast-text">{t.text}</span>
				<button type="button" class="toast-close" aria-label="Dismiss notification" onclick={() => dismiss(t.id)}>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
						<path d="M2 2l8 8M10 2l-8 8" />
					</svg>
				</button>
			</div>
		{/each}
	</div>
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

	/* header */
	header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.25rem;
		margin-bottom: 2rem;
	}

	.head-text {
		flex: 1 1 320px;
		min-width: 0;
	}

	h1 {
		margin: 0;
		font-family: var(--mono);
		font-size: clamp(1.6rem, 5vw, 2.4rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text-strong);
		overflow-wrap: anywhere;
	}

	.project-desc {
		margin: 0.8rem 0 0;
		max-width: 60ch;
		line-height: 1.6;
		color: var(--dim);
		overflow-wrap: anywhere;
	}

	.head-actions {
		display: flex;
		gap: 0.6rem;
	}

	/* section header */
	section {
		margin-bottom: 3rem;
	}

	.section-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	h2 {
		margin: 0;
		font-family: var(--mono);
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text);
	}

	.hash {
		color: var(--accent);
		margin-right: 0.35rem;
	}

	.sub {
		margin: 0.4rem 0 0;
		font-family: var(--mono);
		font-size: 0.8rem;
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

	.btn.danger {
		background: transparent;
		border-color: color-mix(in srgb, var(--danger) 40%, transparent);
		color: var(--danger);
	}

	.btn.danger:hover:not(:disabled) {
		background: color-mix(in srgb, var(--danger) 12%, transparent);
		border-color: var(--danger);
		box-shadow: none;
	}

	.btn.sm {
		padding: 0.35rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.btn.sm:not(.secondary):not(.danger) {
		font-weight: 700;
	}

	.btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: wait;
	}

	/* toasts */
	.toasts {
		position: fixed;
		right: 1.25rem;
		bottom: 1.25rem;
		z-index: 50;
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

	.toast-mark {
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--accent);
		white-space: nowrap;
		padding-top: 0.1rem;
	}

	.toast.err .toast-mark {
		color: var(--danger);
	}

	.toast-text {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.toast-close {
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

	.toast-close:hover {
		background: var(--line);
		color: var(--text-strong);
	}

	.toast-close:focus-visible {
		outline: 2px solid var(--accent);
	}

	/* panels + forms */
	.panel {
		background: linear-gradient(180deg, var(--surface-2), var(--surface));
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.panel.inline {
		margin: 1rem 0 0;
		padding: 1rem;
		background: var(--bg);
	}

	.form-title {
		margin: 0 0 1rem;
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--dim);
		overflow-wrap: anywhere;
	}

	.field {
		display: block;
		margin-bottom: 1rem;
	}

	.field.narrow {
		max-width: 12rem;
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

	.panel.inline input,
	.panel.inline textarea {
		background: var(--surface);
	}

	textarea {
		resize: vertical;
		min-height: 4.5rem;
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

	.actions.split {
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.group {
		display: flex;
		gap: 0.6rem;
	}

	/* task list */
	.list,
	.subs {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.list {
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--surface);
	}

	.list > li + li {
		border-top: 1px solid var(--line);
	}

	.task {
		padding: 1.1rem 1.25rem;
	}

	.item {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.item-body {
		flex: 1;
		min-width: 0;
	}

	.task-top {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
	}

	.name {
		font-family: var(--mono);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-strong);
		overflow-wrap: anywhere;
	}

	.name.small {
		font-size: 0.95rem;
	}

	.mins {
		font-family: var(--mono);
		font-size: 0.8rem;
		color: var(--accent);
		opacity: 0.8;
		white-space: nowrap;
	}

	.desc {
		margin: 0.3rem 0 0;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--dim);
		overflow-wrap: anywhere;
	}

	/* row dropdown menu */
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
		border-radius: 8px;
		background: transparent;
		color: var(--dim);
		cursor: pointer;
		transition:
			opacity 0.15s,
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}

	/* hover-only on devices that can hover; always visible on touch */
	@media (hover: hover) {
		.menu-btn {
			opacity: 0;
		}
	}

	.item:hover .menu-btn,
	.item:focus-within .menu-btn,
	.menu-btn[aria-expanded='true'] {
		opacity: 1;
	}

	.menu-btn:hover,
	.menu-btn[aria-expanded='true'] {
		background: var(--surface-2);
		border-color: var(--line-hi);
		color: var(--text-strong);
	}

	.menu-btn:focus-visible {
		outline: 2px solid var(--accent);
	}

	.menu-list {
		position: absolute;
		top: calc(100% + 0.3rem);
		right: 0;
		z-index: 20;
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

	/* sub-tasks: indented with a guide line */
	.subs {
		margin: 1rem 0 0 0.3rem;
		padding-left: 1.1rem;
		border-left: 1px solid var(--line-hi);
	}

	.sub-task + .sub-task {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
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
		.task {
			padding: 1rem;
		}
		.head-actions {
			width: 100%;
		}
		.head-actions .btn {
			flex: 1;
		}
		.field.narrow {
			max-width: none;
		}
		.actions.split .btn.danger {
			order: 2;
			width: 100%;
		}
		.actions.split .group {
			width: 100%;
		}
		.actions.split .group .btn {
			flex: 1;
		}
		.toasts {
			right: 1rem;
			bottom: 1rem;
			width: calc(100vw - 2rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.back,
		.btn,
		.menu-btn,
		.toast-close,
		input,
		textarea {
			transition: none;
		}
	}
</style>