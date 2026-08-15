// tsc only emits .ts, so the .sql migrations client.ts reads at startup would
// be missing from dist/ and `pnpm start` would throw on the first readFileSync.
const { cpSync } = require('fs');
const { resolve } = require('path');

const from = resolve(__dirname, '../src/db/migrations');
const to = resolve(__dirname, '../dist/db/migrations');

cpSync(from, to, { recursive: true });
console.log(`copied migrations to ${to}`);
