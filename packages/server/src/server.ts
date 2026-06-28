import Fastify from 'fastify';
import { db } from './db/client';
import { registerPasteRoutes } from './routes/pastes';
import { startCleanupSweep } from './lib/cleanup';

const server = Fastify();

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
