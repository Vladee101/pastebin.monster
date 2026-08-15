import { useCallback, useEffect, useRef, useState } from 'react';
import { createImagePaste, createPaste, PasteError } from '../api/client';

const MAX_LENGTH = 50000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Status = 'idle' | 'submitting' | 'done';

interface PendingImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreatePaste() {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<PendingImage | null>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'link' | 'slug' | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const acceptImage = useCallback(
    async (blob: Blob) => {
      if (blob.type !== 'image/png') {
        setError('Only PNG images are supported');
        return;
      }
      if (blob.size > MAX_IMAGE_BYTES) {
        setError(`That image is ${formatBytes(blob.size)}. The limit is 5 MB.`);
        return;
      }

      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(blob);
      } catch {
        setError("That PNG couldn't be read");
        return;
      }

      releaseObjectUrl();
      objectUrlRef.current = URL.createObjectURL(blob);
      setImage({ blob, url: objectUrlRef.current, width: bitmap.width, height: bitmap.height });
      bitmap.close();
      setError('');
    },
    [releaseObjectUrl],
  );

  // Bound to the window, not the textarea: the real flow is screenshot →
  // alt-tab back to the browser → Ctrl+V, and nothing is focused at that point.
  useEffect(() => {
    if (status !== 'idle') return;

    function onPaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.kind === 'file' && item.type === 'image/png') {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void acceptImage(file);
          }
          return;
        }
      }
    }

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [status, acceptImage]);

  function clearImage() {
    releaseObjectUrl();
    setImage(null);
    setError('');
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void acceptImage(file);
  }

  function handleDragLeave(event: React.DragEvent) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragging(false);
    }
  }

  async function handleSubmit() {
    if (!image && !content.trim()) return;
    setStatus('submitting');
    setError('');
    try {
      const result = image ? await createImagePaste(image.blob) : await createPaste(content);
      setSlug(result.slug);
      setStatus('done');
    } catch (err) {
      setError(
        err instanceof PasteError && err.status === 413
          ? 'That image is over the 5 MB limit'
          : 'Could not create paste. Try again.',
      );
      setStatus('idle');
    }
  }

  function handleReset() {
    releaseObjectUrl();
    setImage(null);
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
    <div
      className={`page page-create${dragging ? ' page-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {image ? (
        <div className="image-preview">
          <img className="image-preview-thumb" src={image.url} alt="Pasted screenshot" />
          <button
            type="button"
            className="image-preview-clear"
            onClick={clearImage}
            disabled={status === 'submitting'}
            aria-label="Remove image"
          >
            ×
          </button>
        </div>
      ) : (
        <textarea
          className="paste-input"
          placeholder="Paste text, code, or a PNG screenshot"
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          disabled={status === 'submitting'}
          autoFocus
        />
      )}
      <div className="create-footer">
        <span className="char-counter">
          {image ? (
            `PNG · ${image.width}×${image.height} · ${formatBytes(image.blob.size)}`
          ) : (
            <>
              {content.length} / {MAX_LENGTH} ·{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => fileInputRef.current?.click()}
              >
                attach a PNG
              </button>
            </>
          )}
        </span>
        <button
          type="button"
          className="btn btn-accent"
          onClick={handleSubmit}
          disabled={status === 'submitting' || (!image && !content.trim())}
        >
          {status === 'submitting' ? 'Creating...' : 'Create paste'}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void acceptImage(file);
          e.target.value = '';
        }}
      />
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
