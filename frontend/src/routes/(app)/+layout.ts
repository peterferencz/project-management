import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

// Everything inside the (app) group requires a signed-in user
export const load: LayoutLoad = async ({ parent }) => {
	const { user } = await parent();
	if (!user) redirect(307, '/login');
	return { user };
};
