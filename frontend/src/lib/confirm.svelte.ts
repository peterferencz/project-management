export type ConfirmRequest = {
	title: string;
	message: string;
	confirmLabel?: string;
	danger?: boolean;
	resolve: (accepted: boolean) => void;
};

export const confirmState = $state<{ current: ConfirmRequest | null }>({ current: null });

/** Opens the app's confirm dialog; resolves true when the user confirms. */
export function confirmAction(opts: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
	return new Promise((resolve) => {
		confirmState.current = { ...opts, resolve };
	});
}
