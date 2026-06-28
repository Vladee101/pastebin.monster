import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { generateSlug } from '../lib/sluggen';

const PASTE_TTL_MS = 5 * 60 * 1000;
const MAX_CONTENT_LENGTH = 50000;
const MAX_SLUG_ATTEMPTS = 5;

interface PasteRow {
  id: string;
  slug: string;
  content: string;
  created_at: number;
  last_viewed_at: number | null;
  expires_at: number;
}

const insertPaste = db.prepare(
  'INSERT INTO pastes (id, slug, content, created_at, last_viewed_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
);
const findBySlug = db.prepare('SELECT * FROM pastes WHERE slug = ?');
const touchPaste = db.prepare('UPDATE pastes SET last_viewed_at = ?, expires_at = ? WHERE slug = ?');
const deleteBySlug = db.prepare('DELETE FROM pastes WHERE slug = ?');

function generateUniqueSlug(): string | null {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = generateSlug();
    if (!findBySlug.get(slug)) {
      return slug;
    }
  }
  return null;
}

export function registerPasteRoutes(app: FastifyInstance): void {
  app.post<{ Body: { content?: string } }>('/api/pastes', async (request, reply) => {
    const { content } = request.body ?? {};

    if (!content || content.length === 0 || content.length > MAX_CONTENT_LENGTH) {
      return reply.code(400).send({ error: 'invalid content' });
    }

    const slug = generateUniqueSlug();
    if (!slug) {
      return reply.code(500).send({ error: 'could not generate unique slug' });
    }

    const now = Date.now();
    insertPaste.run(randomUUID(), slug, content, now, null, now + PASTE_TTL_MS);

    return reply.code(201).send({ slug });
  });

  app.get<{ Params: { slug: string } }>('/api/pastes/:slug', async (request, reply) => {
    const { slug } = request.params;
    const paste = findBySlug.get(slug) as PasteRow | undefined;

    if (!paste) {
      return reply.code(404).send({ error: 'not found' });
    }

    const now = Date.now();
    if (paste.expires_at < now) {
      deleteBySlug.run(slug);
      return reply.code(404).send({ error: 'expired' });
    }

    const expiresAt = now + PASTE_TTL_MS;
    touchPaste.run(now, expiresAt, slug);

    return reply.code(200).send({
      slug: paste.slug,
      content: paste.content,
      created_at: paste.created_at,
      expires_at: expiresAt,
    });
  });

  app.delete<{ Params: { slug: string } }>('/api/pastes/:slug', async (request, reply) => {
    const { slug } = request.params;
    const result = deleteBySlug.run(slug);

    if (result.changes === 0) {
      return reply.code(404).send({ error: 'not found' });
    }

    return reply.code(204).send();
  });
}
