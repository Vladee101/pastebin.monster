import { useEffect, useState } from 'react';
import { deletePaste, getPaste, getPasteImage, type Paste } from '../api/client';

type Status = 'loading' | 'found' | 'not-found';

interface LoadedImage {
  blob: Blob;
  url: string;
}

export default function ViewPaste({ slug }: { slug: string }) {
  const [status, setStatus] = useState<Status>('loading');
  const [paste, setPaste] = useState<Paste | null>(null);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
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

  // Fetched as a blob rather than pointed at by <img src> for two reasons: the
  // bytes URL stays off the page (nothing to copy or share), and the same blob
  // is what Copy image and Download need — so it downloads once, not twice.
  useEffect(() => {
    if (paste?.kind !== 'image') return;

    let cancelled = false;
    let url: string | null = null;

    getPasteImage(slug)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ blob, url });
      })
      .catch(() => {
        if (!cancelled) setImageFailed(true);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [paste, slug]);

  async function copyContent() {
    if (!paste) return;
    try {
      if (paste.kind === 'image') {
        if (!image) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': image.blob })]);
      } else {
        await navigator.clipboard.writeText(paste.content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can be refused (permissions, non-secure context).
    }
  }

  function downloadImage() {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${slug}.png`;
    link.click();
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

  const isImage = paste!.kind === 'image';

  return (
    <div className="page page-view">
      <div className="slug-display">{slug}</div>
      <p className="expiry-note">Expires in ~5 minutes</p>

      {isImage ? (
        <div className="paste-image-frame">
          {image ? (
            <img className="paste-image" src={image.url} alt="Shared screenshot" />
          ) : (
            <p className="paste-image-status">
              {imageFailed ? "This image couldn't be loaded" : 'Loading image...'}
            </p>
          )}
        </div>
      ) : (
        <pre className="paste-content">{paste!.content}</pre>
      )}

      <div className="button-row">
        <button
          type="button"
          className="btn btn-accent"
          onClick={copyContent}
          disabled={isImage && !image}
        >
          {copied ? 'Copied!' : isImage ? 'Copy image' : 'Copy content'}
        </button>
        {isImage && (
          <button type="button" className="btn btn-ghost" onClick={downloadImage} disabled={!image}>
            Download
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete paste'}
        </button>
      </div>
    </div>
  );
}
