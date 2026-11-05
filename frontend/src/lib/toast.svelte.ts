export type Toast = { id: number; text: string; ok: boolean };

const TOAST_MS = 5000;

class ToastStore {
	items = $state<Toast[]>([]);
	#seq = 0;

	push(text: string, ok: boolean) {
		const id = ++this.#seq;
		this.items.push({ id, text, ok });
		setTimeout(() => this.dismiss(id), TOAST_MS);
	}

	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new ToastStore();

export const notify = {
	success: (text: string) => toasts.push(text, true),
	error: (text: string) => toasts.push(text, false)
};
