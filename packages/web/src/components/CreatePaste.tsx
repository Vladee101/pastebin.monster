import { useState } from 'react';
import { createPaste } from '../api/client';

const MAX_LENGTH = 50000;

type Status = 'idle' | 'submitting' | 'done';

export default function CreatePaste() {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'link' | 'slug' | null>(null);

  async function handleSubmit() {
    if (!content.trim()) return;
    setStatus('submitting');
    setError('');
    try {
      const result = await createPaste(content);
      setSlug(result.slug);
      setStatus('done');
    } catch {
      setError('Could not create paste. Try again.');
      setStatus('idle');
    }
  }

  function handleReset() {
    setContent('');
    setSlug('');
    setError('');
    setStatus('idle');
  }

  function copy(text: string, which: 'link' | 'slug') {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  if (status === 'done') {
    const url = `pastebin.monster/${slug}`;
    return (
      <div className="page page-create">
        <div className="done-panel">
          <div className="slug-display">{slug}</div>
          <div className="full-url">{url}</div>
          <div className="button-row">
            <button type="button" className="btn btn-accent" onClick={() => copy(`https://${url}`, 'link')}>
              {copied === 'link' ? 'Copied!' : 'Copy link'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => copy(slug, 'slug')}>
              {copied === 'slug' ? 'Copied!' : 'Copy slug'}
            </button>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleReset}>
            Create another
          </button>
          <p className="hint">Link expires 5 minutes after last view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-create">
      <textarea
        className="paste-input"
        placeholder="Paste text, code, or anything you need to transfer"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
        disabled={status === 'submitting'}
        autoFocus
      />
      <div className="create-footer">
        <span className="char-counter">
          {content.length} / {MAX_LENGTH}
        </span>
        <button
          type="button"
          className="btn btn-accent"
          onClick={handleSubmit}
          disabled={status === 'submitting' || !content.trim()}
        >
          {status === 'submitting' ? 'Creating...' : 'Create paste'}
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
