import type { Cookies } from '@sveltejs/kit';
import type { SessionUser } from '$lib/types';

export const SESSION_COOKIE = 'ow_session';
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

const b64url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export function randomToken(bytes = 32): string {
	return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256(s: string): Promise<string> {
	return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));
}

async function aesKey(secret: string): Promise<CryptoKey> {
	const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
	return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encrypt(plain: string, secret: string): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), new TextEncoder().encode(plain)));
	return `${b64url(iv)}.${b64url(ct)}`;
}

export async function decrypt(enc: string, secret: string): Promise<string | null> {
	try {
		const [iv, ct] = enc.split('.');
		const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64url(iv) }, await aesKey(secret), fromB64url(ct));
		return new TextDecoder().decode(pt);
	} catch {
		return null;
	}
}

export async function createSession(db: D1Database, cookies: Cookies, userId: number, tokenEnc: string | null, secure: boolean) {
	const token = randomToken();
	const expires = Date.now() + SESSION_TTL;
	await db
		.prepare('INSERT INTO sessions (id, user_id, token_enc, expires_at) VALUES (?, ?, ?, ?)')
		.bind(await sha256(token), userId, tokenEnc, expires)
		.run();
	cookies.set(SESSION_COOKIE, token, { path: '/', httpOnly: true, secure, sameSite: 'lax', expires: new Date(expires) });
}

export async function readSession(db: D1Database, token: string | undefined): Promise<{ id: string; user: SessionUser } | null> {
	if (!token) return null;
	const id = await sha256(token);
	const row = await db
		.prepare(
			`SELECT u.id, u.username, u.name, u.avatar, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`
		)
		.bind(id)
		.first<SessionUser & { expires_at: number }>();
	if (!row) return null;
	if (row.expires_at < Date.now()) {
		await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
		return null;
	}
	return { id, user: { id: row.id, username: row.username, name: row.name, avatar: row.avatar } };
}

export async function destroySession(db: D1Database, cookies: Cookies, sessionId: string | null) {
	if (sessionId) await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export interface GithubProfile {
	id: number;
	login: string;
	name: string | null;
	avatar_url: string;
	bio: string | null;
	blog: string | null;
}

/** Insert or refresh a user from their GitHub profile; returns the local user id. */
export async function upsertGithubUser(db: D1Database, gh: GithubProfile): Promise<number> {
	// GitHub usernames can be renamed and reused: move a stale holder of this name out of the way.
	await db.prepare(`UPDATE users SET username = username || '-' || id WHERE username = ? AND github_id IS NOT ?`).bind(gh.login, String(gh.id)).run();
	const row = await db
		.prepare(
			`INSERT INTO users (github_id, username, name, avatar, bio, website, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(github_id) DO UPDATE SET username = excluded.username, name = excluded.name, avatar = excluded.avatar
			 RETURNING id`
		)
		.bind(String(gh.id), gh.login, gh.name, gh.avatar_url, gh.bio, gh.blog || null, Date.now())
		.first<{ id: number }>();
	return row!.id;
}
