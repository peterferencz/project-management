import type { LayoutLoad } from './$types';
import { createApi } from '#lib/api.js';

// The app talks to the API through the nginx proxy from the browser, so render client-side only
export const ssr = false;

export const load: LayoutLoad = async ({ fetch, depends }) => {
	depends('app:user');
	try {
		return { user: await createApi(fetch).user.me() };
	} catch {
		// 401 (not logged in) or the API is unreachable: treat as signed out
		return { user: null };
	}
};
