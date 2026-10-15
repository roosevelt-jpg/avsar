'use client';

import { getBrowserSupabase } from '@/lib/supabase/browser';

/**
 * Uploads a file to the media library.
 *
 *  1. ask the server for a one-time upload URL (it checks type, size, permission)
 *  2. send the file straight to storage from the browser
 *  3. tell the server it arrived, so it is recorded in the library
 *
 * Going direct is what lets a 60 MB film through: a serverless function would
 * reject the body long before that.
 */
export async function uploadMedia(file: File, alt = ''): Promise<{ url: string; id: string; kind: string }> {
  const sign = await fetch('/api/admin/cms/media/sign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, bytes: file.size }),
  });
  const signed = (await sign.json().catch(() => null)) as { path?: string; token?: string; bucket?: string; error?: string; message?: string } | null;
  if (!sign.ok || !signed?.path || !signed.token || !signed.bucket) {
    const reasons: Record<string, string> = {
      unsupported_type: 'This file type is not supported. Use JPG, PNG, WebP, GIF, MP4, WebM or PDF.',
      too_large: 'This file is too large.',
      not_configured: 'The database is not connected, so nothing was saved.',
      forbidden: 'Your role cannot upload media.',
    };
    throw new Error(reasons[signed?.error ?? ''] ?? 'Upload could not start.');
  }

  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error('Storage is not configured.');
  const { error } = await supabase.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file, {
    contentType: file.type,
    cacheControl: '31536000',
  });
  if (error) throw new Error('Upload failed. Check your connection and try again.');

  const dimensions = file.type.startsWith('image/') ? await imageSize(file).catch(() => null) : null;

  const confirm = await fetch('/api/admin/cms/media', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      path: signed.path,
      fileName: file.name,
      mimeType: file.type,
      bytes: file.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      alt,
    }),
  });
  const recorded = (await confirm.json().catch(() => null)) as { url?: string; id?: string; kind?: string } | null;
  if (!confirm.ok || !recorded?.url || !recorded.id) throw new Error('The file uploaded but could not be recorded.');
  return { url: recorded.url, id: recorded.id, kind: recorded.kind ?? 'image' };
}

function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
}
