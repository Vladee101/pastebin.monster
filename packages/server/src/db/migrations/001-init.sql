CREATE TABLE IF NOT EXISTS pastes (
    id             TEXT    PRIMARY KEY,
    slug           TEXT    UNIQUE NOT NULL,
    content        TEXT    NOT NULL,
    created_at     INTEGER NOT NULL,
    last_viewed_at INTEGER,
    expires_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pastes_slug ON pastes(slug);
CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at);
