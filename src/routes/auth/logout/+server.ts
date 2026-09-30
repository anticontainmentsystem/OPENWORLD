import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth';
import { env } from '$lib/server/env';

export async function POST(event) {
	await destroySession(env(event).DB, event.cookies, event.locals.sessionId);
	redirect(303, '/');
}
