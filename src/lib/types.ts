export interface SessionUser {
	id: number;
	username: string;
	name: string | null;
	avatar: string | null;
}

export interface Author {
	id: number;
	username: string;
	name: string | null;
	avatar: string | null;
}

/** One module instance inside a post. `data` is validated against the module's fields. */
export interface Block {
	type: string;
	data: Record<string, unknown>;
}

/** Lightweight static preview used for feed neighbours and grid view. */
export interface Snapshot {
	title: string | null;
	excerpt: string | null;
	image: string | null;
	kinds: string[];
}

export interface Post {
	id: string;
	author: Author;
	blocks: Block[];
	snapshot: Snapshot;
	createdAt: number;
	fire: number;
	firedByMe: boolean;
}

export interface FeedPage {
	posts: Post[];
	/** Cursor for older posts, or null at the end. */
	next: string | null;
}
