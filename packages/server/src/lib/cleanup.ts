import type { Database } from 'better-sqlite3';

const CLEANUP_INTERVAL_MS = 60 * 1000;

export function startCleanupSweep(db: Database): void {
  const deleteExpired = db.prepare('DELETE FROM pastes WHERE expires_at < ?');

  const sweep = () => {
    const result = deleteExpired.run(Date.now());
    if (result.changes > 0) {
      console.log(`[cleanup] deleted ${result.changes} expired pastes`);
    }
  };

  sweep();
  setInterval(sweep, CLEANUP_INTERVAL_MS);
}
