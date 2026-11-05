<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import { api, handleApiError } from '#lib/api.js';
	import { confirmAction } from '#lib/confirm.svelte.js';
	import { notify } from '#lib/toast.svelte.js';
	import { dueLabel, dueState, todayISO } from '#lib/format.js';
	import { LIMITS, type Task, type TaskFormValues } from '#lib/types.js';
	import RowMenu from '#lib/components/RowMenu.svelte';
	import TaskForm from '#lib/components/TaskForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Local copies that start from the loaded data and are updated in place after each mutation
	let project = $derived(data.project);
	let tasks = $derived(data.tasks);

	// --- project editing -------------------------------------------------------
	let editingProject = $state(false);
	let projectName = $state('');
	let projectDescription = $state('');
	let savingProject = $state(false);

	function startProjectEdit() {
		projectName = project.name;
		projectDescription = project.description ?? '';
		editingProject = true;
	}

	async function saveProject(e: SubmitEvent) {
		e.preventDefault();
		savingProject = true;
		try {
			await api.projects.update(project.id, projectName.trim(), projectDescription.trim());
			project = { ...project, name: projectName.trim(), description: projectDescription.trim() };
			editingProject = false;
			notify.success('Project updated');
		} catch (err) {
			await handleApiError(err, 'Error updating project');
		} finally {
			savingProject = false;
		}
	}

	async function deleteProject() {
		const ok = await confirmAction({
			title: 'Delete project?',
			message: `“${project.name}” and all of its tasks will be permanently removed.`,
			confirmLabel: 'Delete project',
			danger: true
		});
		if (!ok) return;
		try {
			await api.projects.remove(project.id);
			await invalidate('app:projects');
			await goto('/projects');
		} catch (err) {
			await handleApiError(err, 'Error deleting project');
		}
	}

	// --- task tree ---------------------------------------------------------------
	type Filter = 'all' | 'open' | 'done';
	let filter = $state<Filter>('all');

	const isDone = (t: Task) => t.completed_at !== null;

	const childrenOf = $derived.by(() => {
		const map = new Map<number | null, Task[]>();
		for (const t of tasks) {
			const list = map.get(t.parent_task_id) ?? [];
			list.push(t);
			map.set(t.parent_task_id, list);
		}
		return map;
	});

	// A task is shown when it matches the filter itself or has a matching descendant
	const visibleIds = $derived.by(() => {
		const set = new Set<number>();
		const matches = (t: Task) => filter === 'all' || (filter === 'done') === isDone(t);
		const visit = (t: Task): boolean => {
			let any = matches(t);
			for (const child of childrenOf.get(t.id) ?? []) {
				if (visit(child)) any = true;
			}
			if (any) set.add(t.id);
			return any;
		};
		(childrenOf.get(null) ?? []).forEach(visit);
		return set;
	});

	const roots = $derived((childrenOf.get(null) ?? []).filter((t) => visibleIds.has(t.id)));

	const stats = $derived.by(() => {
		const today = todayISO();
		const done = tasks.filter(isDone).length;
		const overdue = tasks.filter((t) => !isDone(t) && t.due_date !== null && t.due_date.slice(0, 10) < today).length;
		return {
			total: tasks.length,
			done,
			overdue,
			percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0
		};
	});

	function replaceTask(saved: Task) {
		tasks = tasks.map((t) => (t.id === saved.id ? saved : t));
	}

	/** Ids of a task and everything below it (the database cascades deletes to sub-tasks) */
	function subtreeIds(id: number): Set<number> {
		const ids = new Set<number>([id]);
		const stack = [id];
		while (stack.length) {
			for (const child of childrenOf.get(stack.pop()!) ?? []) {
				ids.add(child.id);
				stack.push(child.id);
			}
		}
		return ids;
	}

	// --- task editing state ------------------------------------------------------
	let showNewTask = $state(false);
	let addingSubTaskTo = $state<number | null>(null);
	let editing = $state<{ id: number; focus: 'name' | 'due' } | null>(null);

	function openNewTask() {
		showNewTask = !showNewTask;
		addingSubTaskTo = null;
		editing = null;
	}

	async function createTask(values: TaskFormValues, parentTaskId?: number) {
		try {
			const { task } = await api.tasks.create({
				projectId: project.id,
				parentTaskId,
				name: values.name,
				description: values.description || undefined,
				dueDate: values.dueDate
			});
			tasks = [...tasks, task];
			showNewTask = false;
			addingSubTaskTo = null;
			notify.success(parentTaskId ? 'Sub-task created' : 'Task created');
		} catch (err) {
			await handleApiError(err, 'Error creating task');
		}
	}

	async function saveTask(task: Task, values: TaskFormValues) {
		try {
			const { task: saved } = await api.tasks.update(task.id, {
				name: values.name,
				description: values.description,
				dueDate: values.dueDate
			});
			replaceTask(saved);
			editing = null;
			notify.success('Task updated');
		} catch (err) {
			await handleApiError(err, 'Error updating task');
		}
	}

	async function toggleDone(task: Task, completed: boolean) {
		const before = tasks;
		// optimistic: flip immediately, roll back if the server rejects it
		replaceTask({ ...task, completed_at: completed ? new Date().toISOString() : null });
		try {
			const { task: saved } = await api.tasks.update(task.id, { completed });
			replaceTask(saved);
		} catch (err) {
			tasks = before;
			await handleApiError(err, 'Error updating task');
		}
	}

	async function deleteTask(task: Task) {
		const count = subtreeIds(task.id).size - 1;
		const ok = await confirmAction({
			title: 'Delete task?',
			message:
				count > 0
					? `“${task.name}” and its ${count} sub-${count === 1 ? 'task' : 'tasks'} will be removed.`
					: `“${task.name}” will be removed.`,
			confirmLabel: 'Delete task',
			danger: true
		});
		if (!ok) return;
		try {
			await api.tasks.remove(task.id);
			const gone = subtreeIds(task.id);
			tasks = tasks.filter((t) => !gone.has(t.id));
			notify.success('Task deleted');
		} catch (err) {
			await handleApiError(err, 'Error deleting task');
		}
	}
</script>

<svelte:head>
	<title>{project.name}</title>
</svelte:head>

<a class="back" href="/projects">&lt;- all projects</a>

<!-- PROJECT DETAILS -->
{#if editingProject}
	<form class="panel" onsubmit={saveProject} transition:slide={{ duration: 180 }}>
		<label class="field">
			<span class="label">name</span>
			<input type="text" bind:value={projectName} maxlength={LIMITS.projectName.max} required />
		</label>
		<label class="field">
			<span class="label">
				<span>description <span class="opt">(optional)</span></span>
				<span class="opt">{projectDescription.length}/{LIMITS.projectDescription.max}</span>
			</span>
			<textarea bind:value={projectDescription} maxlength={LIMITS.projectDescription.max} rows="3"></textarea>
		</label>
		<div class="actions split">
			<button type="button" class="btn danger" onclick={deleteProject}>Delete project</button>
			<div class="group">
				<button type="button" class="btn secondary" onclick={() => (editingProject = false)}>Cancel</button>
				<button type="submit" class="btn" disabled={savingProject}>
					{savingProject ? 'Saving…' : 'Save changes'}
				</button>
			</div>
		</div>
	</form>
{:else}
	<header class="page-head">
		<div>
			<h1>[ {project.name} ]</h1>
			{#if project.description}
				<p class="lead">{project.description}</p>
			{/if}
		</div>
		<button type="button" class="btn secondary" onclick={startProjectEdit}>Edit project</button>
	</header>
{/if}

<!-- TASKS -->
<section aria-labelledby="tasks-h">
	<div class="section-head">
		<div>
			<h2 id="tasks-h"><span class="hash">#</span> tasks</h2>
			<p class="sub">
				{stats.done}/{stats.total} done{#if stats.overdue > 0}
					· <span class="overdue">{stats.overdue} overdue</span>{/if}
			</p>
		</div>
		<button type="button" class="btn" class:secondary={showNewTask} aria-expanded={showNewTask} onclick={openNewTask}>
			{showNewTask ? 'Close' : 'New task'}
		</button>
	</div>

	{#if stats.total > 0}
		<div class="progress" role="progressbar" aria-label="Completed tasks" aria-valuemin="0" aria-valuemax="100" aria-valuenow={stats.percent}>
			<div class="bar" style:width="{stats.percent}%"></div>
		</div>

		<div class="filters" role="group" aria-label="Filter tasks">
			{#each ['all', 'open', 'done'] as const as f (f)}
				<button type="button" class="chip" class:active={filter === f} aria-pressed={filter === f} onclick={() => (filter = f)}>
					{f}
				</button>
			{/each}
		</div>
	{/if}

	{#if showNewTask}
		<TaskForm
			title="New task"
			submitLabel="Add task"
			onsubmit={(v) => createTask(v)}
			oncancel={() => (showNewTask = false)}
		/>
	{/if}

	{#if tasks.length === 0}
		<div class="panel empty">
			<p>no tasks yet</p>
			<p class="hint">Click “New task” to add the first one.</p>
		</div>
	{:else if roots.length === 0}
		<div class="panel empty"><p>no {filter} tasks</p></div>
	{:else}
		<ul class="list">
			{#each roots as task (task.id)}
				{@render node(task)}
			{/each}
		</ul>
	{/if}
</section>

<!-- One task row plus its sub-tasks (recursive) -->
{#snippet node(task: Task)}
	{@const done = isDone(task)}
	{@const kids = (childrenOf.get(task.id) ?? []).filter((t) => visibleIds.has(t.id))}
	<li class="task">
		{#if editing?.id === task.id}
			<TaskForm
				initial={{ name: task.name, description: task.description, dueDate: task.due_date?.slice(0, 10) ?? null }}
				focus={editing.focus}
				submitLabel="Save task"
				onsubmit={(v) => saveTask(task, v)}
				oncancel={() => (editing = null)}
			/>
		{:else}
			<div class="item">
				<input
					type="checkbox"
					class="check"
					checked={done}
					aria-label={done ? `Mark “${task.name}” as not done` : `Mark “${task.name}” as done`}
					onchange={(e) => toggleDone(task, e.currentTarget.checked)}
				/>
				<div class="item-body">
					<div class="task-top">
						<span class="name" class:done>{task.name}</span>
						{#if task.due_date}
							{@const state = dueState(task.due_date, done)}
							<button
								type="button"
								class="chip"
								class:danger={state === 'overdue'}
								class:warn={state === 'today' || state === 'soon'}
								title="Change due date"
								onclick={() => (editing = { id: task.id, focus: 'due' })}
							>
								{dueLabel(task.due_date, done)}
							</button>
						{/if}
						{#if done}
							<span class="chip ok">done</span>
						{/if}
					</div>
					{#if task.description}
						<p class="desc" class:done>{task.description}</p>
					{/if}
				</div>
				<RowMenu
					label={`Actions for ${task.name}`}
					items={[
						{ label: done ? 'Mark as not done' : 'Mark as done', onclick: () => toggleDone(task, !done) },
						{ label: task.due_date ? 'Change due date' : 'Set due date', onclick: () => (editing = { id: task.id, focus: 'due' }) },
						{ label: 'Edit', onclick: () => (editing = { id: task.id, focus: 'name' }) },
						{ label: 'Add sub-task', onclick: () => { addingSubTaskTo = task.id; showNewTask = false; } },
						{ label: 'Delete', danger: true, onclick: () => deleteTask(task) }
					]}
				/>
			</div>
		{/if}

		{#if addingSubTaskTo === task.id}
			<TaskForm
				title={`New sub-task for “${task.name}”`}
				submitLabel="Save sub-task"
				onsubmit={(v) => createTask(v, task.id)}
				oncancel={() => (addingSubTaskTo = null)}
			/>
		{/if}

		{#if kids.length > 0}
			<ul class="subs">
				{#each kids as child (child.id)}
					{@render node(child)}
				{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<style>
	.section-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.hash {
		margin-right: 0.35rem;
		color: var(--accent);
	}

	.section-head .sub {
		margin-top: 0.4rem;
		font-size: 0.8rem;
	}

	.overdue {
		color: var(--danger);
	}

	/* progress + filters */
	.progress {
		height: 4px;
		margin-bottom: 1rem;
		border-radius: 999px;
		background: var(--line);
		overflow: hidden;
	}

	.bar {
		height: 100%;
		background: var(--ok);
		transition: width 0.25s ease;
	}

	.filters {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 1.25rem;
	}

	.filters .chip {
		padding: 0.2rem 0.75rem;
		text-transform: lowercase;
	}

	.filters .chip.active {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
	}

	/* task rows */
	.task {
		padding: 1rem 1.25rem;
	}

	.subs {
		margin: 1rem 0 0 0.55rem;
		padding: 0 0 0 1.1rem;
		list-style: none;
		border-left: 1px solid var(--line-hi);
	}

	.subs > :global(.task) {
		padding: 0;
	}

	.subs > :global(.task + .task) {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}

	.item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.item:hover,
	.item:focus-within {
		--menu-opacity: 1;
	}

	.item-body {
		flex: 1;
		min-width: 0;
	}

	.task-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.6rem;
	}

	.name {
		font-family: var(--mono);
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-strong);
		overflow-wrap: anywhere;
	}

	.name.done,
	.desc.done {
		color: var(--dim);
		text-decoration: line-through;
		text-decoration-color: var(--line-hi);
	}

	.desc {
		margin-top: 0.3rem;
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--dim);
		overflow-wrap: anywhere;
	}

	/* custom checkbox */
	.check {
		appearance: none;
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		margin: 0.15rem 0 0;
		border: 1.5px solid var(--line-hi);
		border-radius: 6px;
		background: var(--bg);
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.check:hover {
		border-color: var(--accent);
	}

	.check:checked {
		border-color: var(--ok);
		background: var(--ok)
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%230a0e16' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3 6-7'/%3E%3C/svg%3E")
			center / 75% no-repeat;
	}

	.check:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	@media (max-width: 520px) {
		.task {
			padding: 1rem;
		}

		.section-head {
			align-items: center;
		}
	}
</style>
