import { useEffect, useState } from 'react';
import { deletePaste, getPaste, type Paste } from '../api/client';

type Status = 'loading' | 'found' | 'not-found';

export default function ViewPaste({ slug }: { slug: string }) {
  const [status, setStatus] = useState<Status>('loading');
  const [paste, setPaste] = useState<Paste | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPaste(slug).then((result) => {
      if (cancelled) return;
      if (result) {
        setPaste(result);
        setStatus('found');
      } else {
        setStatus('not-found');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function copyContent() {
    if (!paste) return;
    navigator.clipboard.writeText(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDelete() {
    setDeleting(true);
    await deletePaste(slug);
    window.location.href = '/?deleted';
  }

  if (status === 'loading') {
    return (
      <div className="page page-view">
        <div className="slug-display slug-display-loading">{slug}</div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="page page-view">
        <div className="center-panel">
          <p className="not-found-message">This paste has expired or doesn't exist</p>
          <a className="btn btn-accent" href="/">
            Create a new paste
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-view">
      <div className="slug-display">{slug}</div>
      <p className="expiry-note">Expires in ~5 minutes</p>
      <pre className="paste-content">{paste!.content}</pre>
      <div className="button-row">
        <button type="button" className="btn btn-accent" onClick={copyContent}>
          {copied ? 'Copied!' : 'Copy content'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete paste'}
        </button>
      </div>
    </div>
  );
}
