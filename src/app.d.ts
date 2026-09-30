// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SessionUser } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			sessionId: string | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				GITHUB_CLIENT_ID: string;
				GITHUB_CLIENT_SECRET: string;
				SESSION_SECRET: string;
				DEV_LOGIN?: string;
				/** Optional server token (read-only, public repos) to raise GitHub rate limits. */
				GITHUB_TOKEN?: string;
				/** Dev/test only: point GitHub API calls at a mock server. */
				GITHUB_API_BASE?: string;
			};
			ctx: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
