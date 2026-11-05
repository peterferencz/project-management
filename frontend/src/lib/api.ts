import { invalidate, goto } from '$app/navigation';
import { redirect } from '@sveltejs/kit';
import { notify } from './toast.svelte.js';
import type { Project, Task, User } from './types.js';

export class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Typed client for the backend. Every path here maps 1:1 to a route in backend/src/endpoints.
 * Pass SvelteKit's `fetch` inside load functions; components use the default client.
 */
export function createApi(fetchFn: typeof fetch = (...args) => fetch(...args)) {
	async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
		let res: Response;
		try {
			res = await fetchFn(`/api${path}`, {
				method,
				headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
				body: body !== undefined ? JSON.stringify(body) : undefined
			});
		} catch {
			throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
		}

		// The body may not be JSON (e.g. a proxy error page), so parse defensively
		const data = await res.json().catch(() => null);
		if (!res.ok) {
			throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`);
		}
		return data as T;
	}

	return {
		auth: {
			login: (username: string, password: string) =>
				request<{ message: string }>('POST', '/auth/login', { username, password }),
			register: (username: string, password: string) =>
				request<{ message: string }>('POST', '/auth/register', { username, password }),
			logout: () => request<{ message: string }>('POST', '/auth/logout')
		},

		user: {
			me: () => request<User>('GET', '/auth/user')
		},

		projects: {
			list: () => request<Project[]>('GET', '/project'),
			get: (id: number) => request<Project>('GET', `/project/${id}`),
			create: (name: string, description: string) =>
				request<{ message: string }>('POST', '/project/create', {
					project_name: name,
					project_description: description
				}),
			update: (id: number, name: string, description: string) =>
				request<{ message: string }>('PUT', `/project/${id}`, {
					project_name: name,
					project_description: description
				}),
			remove: (id: number) => request<{ message: string }>('DELETE', `/project/${id}`),
			tasks: (id: number) => request<Task[]>('GET', `/project/${id}/tasks`)
		},

		tasks: {
			create: (input: {
				projectId: number;
				parentTaskId?: number;
				name: string;
				description?: string;
				dueDate?: string | null;
			}) => request<{ message: string; task: Task }>('POST', '/task/create', input),
			update: (
				id: number,
				input: { name?: string; description?: string; dueDate?: string | null; completed?: boolean }
			) => request<{ message: string; task: Task }>('PUT', `/task/${id}`, input),
			remove: (id: number) => request<{ message: string }>('DELETE', `/task/${id}`)
		}
	};
}

export const api = createApi();

/**
 * Use in components: an expired session sends the user to the login page,
 * anything else is shown as an error toast.
 */
export async function handleApiError(e: unknown, fallback = 'Something went wrong') {
	if (e instanceof ApiError && e.status === 401) {
		await invalidate('app:user');
		await goto('/login');
		return;
	}
	notify.error(e instanceof Error ? e.message : fallback);
}

/** Use in load functions: turns API failures into redirects / error pages. */
export function loadError(e: unknown): never {
	if (e instanceof ApiError && e.status === 401) redirect(307, '/login');
	throw e;
}
