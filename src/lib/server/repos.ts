import { fetchRepo, type RepoData } from './github';

/** Re-read repos from GitHub at most this often when someone views them. */
export const STALE_MS = 6 * 60 * 60 * 1000;

export interface RepoRow {
	id: number;
	owner_id: number;
	full_name: string;
	data: RepoData;
	synced_at: number;
	created_at: number;
}

export async function getRepo(db: D1Database, fullName: string): Promise<RepoRow | null> {
	const row = await db.prepare('SELECT * FROM repos WHERE full_name = ?').bind(fullName).first<Omit<RepoRow, 'data'> & { data_json: string }>();
	if (!row) return null;
	const { data_json, ...rest } = row;
	return { ...rest, data: JSON.parse(data_json) as RepoData };
}

export async function listRepos(db: D1Database, ownerId: number): Promise<RepoRow[]> {
	const { results } = await db
		.prepare('SELECT * FROM repos WHERE owner_id = ? ORDER BY created_at DESC LIMIT 100')
		.bind(ownerId)
		.all<Omit<RepoRow, 'data'> & { data_json: string }>();
	return results.map(({ data_json, ...rest }) => ({ ...rest, data: JSON.parse(data_json) as RepoData }));
}

/** Fetch from GitHub and store. Returns the fresh data. */
export async function syncRepo(db: D1Database, fullName: string, token: string | null, apiBase?: string): Promise<RepoData & { ownerLogin: string }> {
	const data = await fetchRepo(fullName, token, apiBase);
	const { ownerLogin: _, ...stored } = data;
	await db.prepare('UPDATE repos SET data_json = ?, synced_at = ?, full_name = ? WHERE full_name = ?')
		.bind(JSON.stringify(stored), Date.now(), data.fullName, fullName)
		.run();
	return data;
}
