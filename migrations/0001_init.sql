-- OpenWorld core schema (phase 1)

CREATE TABLE users (
	id INTEGER PRIMARY KEY,
	github_id TEXT UNIQUE,
	username TEXT NOT NULL UNIQUE COLLATE NOCASE,
	name TEXT,
	avatar TEXT,
	bio TEXT,
	website TEXT,
	created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
	id TEXT PRIMARY KEY,            -- SHA-256 of the cookie value
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token_enc TEXT,                 -- encrypted GitHub access token
	expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE posts (
	id TEXT PRIMARY KEY,
	author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	space_id TEXT,
	blocks_json TEXT NOT NULL,
	snapshot_json TEXT NOT NULL,
	created_at INTEGER NOT NULL,
	edited_at INTEGER,
	deleted_at INTEGER
);
CREATE INDEX posts_feed ON posts(deleted_at, created_at DESC, id DESC);
CREATE INDEX posts_author ON posts(author_id, created_at DESC);

CREATE TABLE follows (
	follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at INTEGER NOT NULL,
	PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX follows_followee ON follows(followee_id);

CREATE TABLE reactions (
	post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	kind TEXT NOT NULL,
	created_at INTEGER NOT NULL,
	PRIMARY KEY (post_id, user_id, kind)
);

CREATE TABLE link_cache (
	url TEXT PRIMARY KEY,
	data_json TEXT,
	status TEXT NOT NULL,           -- ok | error
	fetched_at INTEGER NOT NULL
);

CREATE TABLE oauth_states (
	state TEXT PRIMARY KEY,
	created_at INTEGER NOT NULL
);
