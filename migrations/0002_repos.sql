-- Creative repos: GitHub repositories registered by their owners and shown as project pages.
CREATE TABLE repos (
	id INTEGER PRIMARY KEY,
	owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	full_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
	data_json TEXT NOT NULL,        -- synced GitHub data + parsed openworld.yml
	synced_at INTEGER NOT NULL,
	created_at INTEGER NOT NULL
);
CREATE INDEX repos_owner ON repos(owner_id, created_at DESC);
