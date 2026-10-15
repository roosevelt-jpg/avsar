/** Video helpers shared by server and client components. Client-safe. */

export function youtubeId(url: string): string | null {
  const match = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url);
  return match?.[1] ?? null;
}

/**
 * The privacy-enhanced embed: no YouTube cookies until the visitor plays.
 * `rel=0` keeps the suggestions at the end to our own channel.
 */
export function youtubeEmbedUrl(id: string, autoplay: boolean): string {
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/** YouTube's own still, used when no poster was uploaded. */
export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
