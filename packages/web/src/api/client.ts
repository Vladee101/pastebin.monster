const BASE = '/api';

export interface Paste {
  slug: string;
  content: string;
  kind: 'text' | 'image';
  created_at: number;
  expires_at: number;
}

export class PasteError extends Error {
  status: number;

  constructor(status: number) {
    super(`Request failed with ${status}`);
    this.status = status;
  }
}

export async function createPaste(content: string): Promise<{ slug: string }> {
  const res = await fetch(`${BASE}/pastes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (res.status !== 201) {
    throw new PasteError(res.status);
  }

  return res.json();
}

export async function createImagePaste(image: Blob): Promise<{ slug: string }> {
  const res = await fetch(`${BASE}/pastes`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/png' },
    body: image,
  });

  if (res.status !== 201) {
    throw new PasteError(res.status);
  }

  return res.json();
}

export async function getPaste(slug: string): Promise<Paste | null> {
  const res = await fetch(`${BASE}/pastes/${slug}`);

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new PasteError(res.status);
  }

  return res.json();
}

// X-Paste-Client is what makes the bytes URL first-party only: an <img> tag, a
// direct navigation and a link-unfurl bot cannot set it. Same-origin requests
// don't preflight, so the custom header is free.
export async function getPasteImage(slug: string): Promise<Blob> {
  const res = await fetch(`${BASE}/pastes/${slug}/image`, {
    headers: { 'X-Paste-Client': '1' },
  });

  if (!res.ok) {
    throw new PasteError(res.status);
  }

  return res.blob();
}

export async function deletePaste(slug: string): Promise<boolean> {
  const res = await fetch(`${BASE}/pastes/${slug}`, { method: 'DELETE' });

  if (res.status === 404) {
    return false;
  }
  if (res.status !== 204) {
    throw new PasteError(res.status);
  }

  return true;
}
