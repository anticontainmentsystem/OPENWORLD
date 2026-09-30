import { error, type RequestEvent } from '@sveltejs/kit';

export function env(event: Pick<RequestEvent, 'platform'>) {
	const e = event.platform?.env;
	if (!e?.DB) error(500, 'Database binding missing. Run through wrangler or `npm run dev`.');
	return e;
}

export function requireUser(event: Pick<RequestEvent, 'locals'>) {
	if (!event.locals.user) error(401, 'Sign in first');
	return event.locals.user;
}
