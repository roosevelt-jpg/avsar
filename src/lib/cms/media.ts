/** Storage bucket for the media library. Created by migration 0014. */
export const MEDIA_BUCKET = 'cms-media';

/** What the library accepts. SVG is excluded: it can carry script. */
export const MEDIA_TYPES: Record<string, { kind: 'image' | 'video' | 'document'; maxBytes: number }> = {
  'image/jpeg': { kind: 'image', maxBytes: 15 * 1024 * 1024 },
  'image/png': { kind: 'image', maxBytes: 15 * 1024 * 1024 },
  'image/webp': { kind: 'image', maxBytes: 15 * 1024 * 1024 },
  'image/avif': { kind: 'image', maxBytes: 15 * 1024 * 1024 },
  'image/gif': { kind: 'image', maxBytes: 15 * 1024 * 1024 },
  'video/mp4': { kind: 'video', maxBytes: 100 * 1024 * 1024 },
  'video/webm': { kind: 'video', maxBytes: 100 * 1024 * 1024 },
  'application/pdf': { kind: 'document', maxBytes: 20 * 1024 * 1024 },
};

export function safeFileName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (cleaned || 'file').slice(-120);
}
