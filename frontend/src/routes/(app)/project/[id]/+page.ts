import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { ApiError, createApi, loadError } from '#lib/api.js';

export const load: PageLoad = async ({ params, fetch, depends }) => {
	depends('app:project');

	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) error(404, 'Project not found');

	const api = createApi(fetch);
	try {
		const [project, tasks] = await Promise.all([api.projects.get(id), api.projects.tasks(id)]);
		return { project, tasks };
	} catch (e) {
		if (e instanceof ApiError && e.status === 404) error(404, 'Project not found');
		loadError(e);
	}
};
