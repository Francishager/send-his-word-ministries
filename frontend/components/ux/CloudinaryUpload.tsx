import * as React from 'react';

interface CloudinaryUploadProps {
  folder?: string;
  onUploaded: (url: string, publicId?: string) => void;
  className?: string;
  buttonText?: string;
  accept?: string; // e.g., 'image/*' or 'video/*'
  maxSizeBytes?: number; // optional override
}

export default function CloudinaryUpload({
  folder = 'shwm',
  onUploaded,
  className = '',
  buttonText = 'Upload Image',
  accept = 'image/*',
  maxSizeBytes,
}: CloudinaryUploadProps) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validation: type and size
    const isVideo = (accept || '').startsWith('video');
    const isImage = (accept || '').startsWith('image');
    if (isImage && !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (isVideo && !file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    const defaultLimit = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024; // 200MB videos, 10MB images
    const limit = maxSizeBytes ?? defaultLimit;
    if (file.size > limit) {
      const mb = (limit / (1024 * 1024)).toFixed(0);
      alert(`File too large. Max size is ${mb} MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setBusy(true);
    try {
      // Get signature
      const sigRes = await fetch('/api/upload/cloudinary-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });
      const sig = await sigRes.json();
      if (!sigRes.ok || !sig?.ok) throw new Error(sig?.error || 'Failed to sign');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', String(sig.timestamp));
      fd.append('folder', sig.folder);
      fd.append('signature', sig.signature);
      const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;
      const upRes = await fetch(uploadUrl, { method: 'POST', body: fd });
      const up = await upRes.json();
      if (!upRes.ok) throw new Error(up?.error?.message || 'Upload failed');
      const url = up.secure_url as string;
      onUploaded(url, up.public_id as string | undefined);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert((err as any)?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        className="rounded-md border px-3 py-2 text-sm bg-white hover:bg-gray-50"
      >
        {busy ? 'Uploading…' : buttonText}
      </button>
    </div>
  );
}
