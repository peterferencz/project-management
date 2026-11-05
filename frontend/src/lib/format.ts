/** Date helpers. Due dates are calendar dates ("YYYY-MM-DD") compared in the user's local time zone. */

const MS_PER_DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Normalise API values: tolerate a full ISO timestamp by keeping the date part only */
const day = (iso: string) => iso.slice(0, 10);

export function todayISO(now = new Date()): string {
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whole days from today until the given date (negative when in the past) */
export function daysUntil(iso: string, now = new Date()): number {
	const [y, m, d] = day(iso).split('-').map(Number);
	const [ty, tm, td] = todayISO(now).split('-').map(Number);
	return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / MS_PER_DAY);
}

export function formatDate(iso: string): string {
	const [y, m, d] = day(iso).split('-').map(Number);
	const sameYear = y === new Date().getFullYear();
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: sameYear ? undefined : 'numeric'
	}).format(new Date(y, m - 1, d));
}

export function formatLongDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export type DueState = 'done' | 'overdue' | 'today' | 'soon' | 'later';

export function dueState(due: string, done: boolean): DueState {
	if (done) return 'done';
	const diff = daysUntil(due);
	if (diff < 0) return 'overdue';
	if (diff === 0) return 'today';
	if (diff <= 2) return 'soon';
	return 'later';
}

export function dueLabel(due: string, done: boolean): string {
	if (done) return `Due ${formatDate(due)}`;
	const diff = daysUntil(due);
	if (diff === 0) return 'Due today';
	if (diff === 1) return 'Due tomorrow';
	if (diff === -1) return 'Overdue · yesterday';
	if (diff < 0) return `Overdue · ${-diff} days`;
	return `Due ${formatDate(due)}`;
}
