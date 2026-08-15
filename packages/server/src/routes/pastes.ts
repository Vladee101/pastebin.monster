import { randomUUID } from 'crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/client';
import { generateSlug } from '../lib/sluggen';

const PASTE_TTL_MS = 5 * 60 * 1000;
const MAX_CONTENT_LENGTH = 50000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_SLUG_ATTEMPTS = 5;

// 89 50 4E 47 0D 0A 1A 0A. Checked against the bytes themselves — never against
// the client-declared type. PNG-only is a security boundary here: it excludes
// SVG, which is a scripting context.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

interface PasteMetaRow {
  slug: string;
  content: string;
  kind: 'text' | 'image';
  created_at: number;
  expires_at: number;
}

interface PasteImageRow {
  image: Buffer | null;
  expires_at: number;
}

const insertPaste = db.prepare(
  'INSERT INTO pastes (id, slug, content, kind, image, created_at, last_viewed_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
);
const findMetaBySlug = db.prepare(
  'SELECT slug, content, kind, created_at, expires_at FROM pastes WHERE slug = ?',
);
const findImageBySlug = db.prepare('SELECT image, expires_at FROM pastes WHERE slug = ?');
const slugExists = db.prepare('SELECT 1 FROM pastes WHERE slug = ?');
const touchPaste = db.prepare('UPDATE pastes SET last_viewed_at = ?, expires_at = ? WHERE slug = ?');
const deleteBySlug = db.prepare('DELETE FROM pastes WHERE slug = ?');

function generateUniqueSlug(): string | null {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = generateSlug();
    if (!slugExists.get(slug)) {
      return slug;
    }
  }
  return null;
}

// The bytes URL is deliberately not shareable. Sec-Fetch-* are set by the
// browser and cannot be forged by page script; a custom header cannot be sent
// by an <img> tag, a navigation, or a link-unfurl bot. Together these reject
// hotlinking, direct navigation and messenger prefetch — the cases that would
// otherwise let a paste be viewed (or burned) outside the SPA. Absent
// Sec-Fetch-* is tolerated for older browsers; the custom header still gates.
function isFirstPartyFetch(request: FastifyRequest): boolean {
  const site = request.headers['sec-fetch-site'];
  const dest = request.headers['sec-fetch-dest'];

  if (request.headers['x-paste-client'] !== '1') return false;
  if (site !== undefined && site !== 'same-origin') return false;
  if (dest !== undefined && dest !== 'empty') return false;

  return true;
}

export function registerPasteRoutes(app: FastifyInstance): void {
  app.addContentTypeParser('image/png', { parseAs: 'buffer' }, (_request, body, done) => {
    done(null, body);
  });

  app.post('/api/pastes', async (request, reply) => {
    const slug = generateUniqueSlug();
    if (!slug) {
      return reply.code(500).send({ error: 'could not generate unique slug' });
    }

    const now = Date.now();
    const id = randomUUID();

    if (Buffer.isBuffer(request.body)) {
      const image = request.body;

      if (image.length === 0 || image.length > MAX_IMAGE_BYTES) {
        return reply.code(413).send({ error: 'image too large' });
      }
      if (!image.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
        return reply.code(400).send({ error: 'not a png' });
      }

      insertPaste.run(id, slug, '', 'image', image, now, null, now + PASTE_TTL_MS);
      return reply.code(201).send({ slug });
    }

    const { content } = (request.body ?? {}) as { content?: string };

    if (!content || content.length === 0 || content.length > MAX_CONTENT_LENGTH) {
      return reply.code(400).send({ error: 'invalid content' });
    }

    insertPaste.run(id, slug, content, 'text', null, now, null, now + PASTE_TTL_MS);

    return reply.code(201).send({ slug });
  });

  app.get<{ Params: { slug: string } }>('/api/pastes/:slug', async (request, reply) => {
    const { slug } = request.params;
    const paste = findMetaBySlug.get(slug) as PasteMetaRow | undefined;

    if (!paste) {
      return reply.code(404).send({ error: 'not found' });
    }

    const now = Date.now();
    if (paste.expires_at < now) {
      deleteBySlug.run(slug);
      return reply.code(404).send({ error: 'expired' });
    }

    // This route is the sole view event: fetching the bytes does not extend the
    // TTL, so a cache miss or a re-render can't keep a paste alive forever.
    const expiresAt = now + PASTE_TTL_MS;
    touchPaste.run(now, expiresAt, slug);

    return reply.code(200).send({
      slug: paste.slug,
      content: paste.content,
      kind: paste.kind,
      created_at: paste.created_at,
      expires_at: expiresAt,
    });
  });

  app.get<{ Params: { slug: string } }>('/api/pastes/:slug/image', async (request, reply) => {
    if (!isFirstPartyFetch(request)) {
      return reply.code(403).send({ error: 'forbidden' });
    }

    const { slug } = request.params;
    const paste = findImageBySlug.get(slug) as PasteImageRow | undefined;

    if (!paste || !paste.image) {
      return reply.code(404).send({ error: 'not found' });
    }
    if (paste.expires_at < Date.now()) {
      deleteBySlug.run(slug);
      return reply.code(404).send({ error: 'expired' });
    }

    return reply
      .code(200)
      .header('Content-Type', 'image/png') // literal, never derived from the row
      .header('X-Content-Type-Options', 'nosniff')
      .header('Cache-Control', 'no-store')
      .send(paste.image);
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
