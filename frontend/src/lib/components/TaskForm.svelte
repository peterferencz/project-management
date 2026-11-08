<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { LIMITS, type TaskFormValues } from '#lib/types.js';
	import DateField from './DateField.svelte';

	type Props = {
		/** Heading shown above the fields */
		title?: string;
		initial?: Partial<TaskFormValues>;
		submitLabel: string;
		/** Which field receives focus when the form opens */
		focus?: 'name' | 'due';
		onsubmit: (values: TaskFormValues) => Promise<void>;
		oncancel: () => void;
	};

	let { title, initial, submitLabel, focus = 'name', onsubmit, oncancel }: Props = $props();

	// The form edits a private copy; `initial` is only read when it opens
	let name = $state(untrack(() => initial?.name ?? ''));
	let description = $state(untrack(() => initial?.description ?? ''));
	let dueDate = $state(untrack(() => initial?.dueDate ?? ''));
	let submitting = $state(false);

	let nameInput = $state<HTMLInputElement>();
	let dateField = $state<ReturnType<typeof DateField>>();

	onMount(() => (focus === 'due' ? dateField : nameInput)?.focus());

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;
		try {
			await onsubmit({
				name: name.trim(),
				description: description.trim(),
				dueDate: dueDate || null
			});
		} finally {
			submitting = false;
		}
	}
</script>

<form class="panel inline" onsubmit={handleSubmit} transition:slide={{ duration: 160 }}>
	{#if title}
		<p class="form-title">{title}</p>
	{/if}

	<label class="field">
		<span class="label">name</span>
		<input
			type="text"
			bind:this={nameInput}
			bind:value={name}
			minlength={LIMITS.taskName.min}
			maxlength={LIMITS.taskName.max}
			placeholder="what needs doing?"
			autocomplete="off"
			required
		/>
	</label>

	<label class="field">
		<span class="label">
			<span>description <span class="opt">(optional)</span></span>
			<span class="opt">{description.length}/{LIMITS.taskDescription.max}</span>
		</span>
		<textarea
			bind:value={description}
			maxlength={LIMITS.taskDescription.max}
			rows="2"
			placeholder="add some detail"
		></textarea>
	</label>

	<div class="field">
		<label class="label" for="due-input">
			<span>due date <span class="opt">(optional)</span></span>
		</label>
		<DateField id="due-input" bind:this={dateField} bind:value={dueDate} />
	</div>

	<div class="actions">
		<button type="button" class="btn secondary sm" onclick={oncancel}>Cancel</button>
		<button type="submit" class="btn sm" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</button>
	</div>
</form>

<style>
	.form-title {
		margin-bottom: 1rem;
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--dim);
		overflow-wrap: anywhere;
	}

</style>
