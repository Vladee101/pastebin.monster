import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

const dbPath = process.env.DB_PATH ?? resolve(__dirname, '../../data/pastes.db');
const migration = readFileSync(resolve(__dirname, 'migrations/001-init.sql'), 'utf-8');

mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(migration);
