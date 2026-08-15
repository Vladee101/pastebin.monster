import Fastify from 'fastify';
import { db } from './db/client';
import { registerPasteRoutes } from './routes/pastes';
import { startCleanupSweep } from './lib/cleanup';

// Headroom above the 5 MB image cap so the route's own 413 fires with a
// message that explains the limit, instead of Fastify's generic body-limit
// rejection at its 1 MB default.
const server = Fastify({ bodyLimit: 6 * 1024 * 1024 });

server.get('/health', async () => {
  return { status: 'ok' };
});

registerPasteRoutes(server);
startCleanupSweep(db);

server.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
