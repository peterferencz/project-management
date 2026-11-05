import type { PageLoad } from './$types';
import { createApi, loadError } from '#lib/api.js';

export const load: PageLoad = async ({ fetch, depends }) => {
	depends('app:projects');
	try {
		return { projects: await createApi(fetch).projects.list() };
	} catch (e) {
		loadError(e);
	}
};
