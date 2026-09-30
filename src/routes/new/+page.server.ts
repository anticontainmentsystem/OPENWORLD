import { redirect } from '@sveltejs/kit';

import { parseGithubRepo } from '$lib/modules/providers';

export function load({ locals, url }) {
	if (!locals.user) redirect(302, '/auth/login');
	const repo = url.searchParams.get('repo');
	return { prefillRepo: repo ? parseGithubRepo(repo) : null };
}
