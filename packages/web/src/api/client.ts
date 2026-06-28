const BASE = '/api';

export interface Paste {
  slug: string;
  content: string;
  created_at: number;
  expires_at: number;
}

export async function createPaste(content: string): Promise<{ slug: string }> {
  const res = await fetch(`${BASE}/pastes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (res.status !== 201) {
    throw new Error('Failed to create paste');
  }

  return res.json();
}

export async function getPaste(slug: string): Promise<Paste | null> {
  const res = await fetch(`${BASE}/pastes/${slug}`);

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error('Failed to fetch paste');
  }

  return res.json();
}

export async function deletePaste(slug: string): Promise<boolean> {
  const res = await fetch(`${BASE}/pastes/${slug}`, { method: 'DELETE' });

  if (res.status === 404) {
    return false;
  }
  if (res.status !== 204) {
    throw new Error('Failed to delete paste');
  }

  return true;
}
