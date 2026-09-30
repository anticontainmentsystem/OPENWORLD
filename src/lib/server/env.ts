import { error, type RequestEvent } from '@sveltejs/kit';
import { decrypt } from './auth';

export function env(event: Pick<RequestEvent, 'platform'>) {
	const e = event.platform?.env;
	if (!e?.DB) error(500, 'Database binding missing. Run through wrangler or `npm run dev`.');
	return e;
}

export function requireUser(event: Pick<RequestEvent, 'locals'>) {
	if (!event.locals.user) error(401, 'Sign in first');
	return event.locals.user;
}

/** Best GitHub token for server calls: the signed-in user's, else the optional server token. */
export async function githubToken(event: Pick<RequestEvent, 'platform' | 'locals'>): Promise<string | null> {
	const e = env(event);
	if (event.locals.sessionId && e.SESSION_SECRET) {
		const row = await e.DB.prepare('SELECT token_enc FROM sessions WHERE id = ?').bind(event.locals.sessionId).first<{ token_enc: string | null }>();
		if (row?.token_enc) {
			const t = await decrypt(row.token_enc, e.SESSION_SECRET);
			if (t) return t;
		}
	}
	return e.GITHUB_TOKEN || null;
}
