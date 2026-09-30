import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, readSession } from '$lib/server/auth';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const handle: Handle = async ({ event, resolve }) => {
	// Reject cross-site state changes (belt and braces on top of SameSite cookies).
	const origin = event.request.headers.get('origin');
	if (!SAFE_METHODS.has(event.request.method) && origin && origin !== event.url.origin) {
		return new Response('Cross-site request blocked', { status: 403 });
	}

	event.locals.user = null;
	event.locals.sessionId = null;
	const db = event.platform?.env.DB;
	if (db) {
		const session = await readSession(db, event.cookies.get(SESSION_COOKIE));
		if (session) {
			event.locals.user = session.user;
			event.locals.sessionId = session.id;
		}
	}
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	return response;
};
