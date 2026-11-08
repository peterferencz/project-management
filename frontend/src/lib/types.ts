/** Shapes returned by the backend API (see backend/src/entities and endpoints). */

export type User = {
	username: string;
	createdAt: string;
};

export type Project = {
	id: number;
	created_at: string;
	name: string;
	description: string | null;
};

export type Task = {
	id: number;
	created_at: string;
	name: string;
	description: string;
	project_id: number;
	parent_task_id: number | null;
	/** Calendar date "YYYY-MM-DD", or null when no due date is set */
	due_date: string | null;
	/** ISO timestamp once completed, null while the task is open */
	completed_at: string | null;
};

/** Values edited by <TaskForm> */
export type TaskFormValues = {
	name: string;
	description: string;
	dueDate: string | null;
};

/** Limits mirrored from the backend zod schemas, so the UI can validate up front */
export const LIMITS = {
	username: { min: 4, max: 20 },
	password: { min: 8, max: 25 },
	projectName: { min: 1, max: 64 },
	projectDescription: { max: 255 },
	taskName: { min: 1, max: 20 },
	taskDescription: { max: 72 }
} as const;
