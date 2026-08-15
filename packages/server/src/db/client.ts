import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

// Applied in order; the file's index + 1 is the user_version it leaves behind.
// Append only — never reorder or edit a migration that has shipped.
const MIGRATIONS = ['001-init.sql', '002-add-images.sql'];

const dbPath = process.env.DB_PATH ?? resolve(__dirname, '../../data/pastes.db');

mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Zero freed pages on delete. Without this a deleted PNG stays intact in the
// free list and carves straight back out of the file, which would break the
// guarantee that expired pastes are unrecoverable. Under WAL the old page
// images survive in pastes.db-wal until the next checkpoint.
db.pragma('secure_delete = ON');

const startVersion = db.pragma('user_version', { simple: true }) as number;

for (let i = startVersion; i < MIGRATIONS.length; i++) {
  const sql = readFileSync(resolve(__dirname, 'migrations', MIGRATIONS[i]), 'utf-8');
  db.transaction(() => {
    db.exec(sql);
    db.pragma(`user_version = ${i + 1}`);
  })();
}
