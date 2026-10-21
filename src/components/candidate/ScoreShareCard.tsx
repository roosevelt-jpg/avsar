'use client';

import { useState } from 'react';

/**
 * A card the candidate can send to family: score and whether it sits above
 * the shortlist line. The image is drawn in the browser. It does not include
 * a name, phone, or documents.
 */
export function ScoreShareCard({
  scoreOutOf10,
  above,
  thresholdLabel,
}: {
  scoreOutOf10: string;
  above: boolean;
  thresholdLabel: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  function draw(): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.reject(new Error('canvas'));
    ctx.fillStyle = '#1B1A17';
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = '#C4A574';
    ctx.font = '600 28px sans-serif';
    ctx.fillText('SKILLS SCORE', 80, 160);
    ctx.fillStyle = '#F7F4EF';
    ctx.font = '700 160px sans-serif';
    ctx.fillText(`${scoreOutOf10} / 10`, 80, 420);
    ctx.font = '500 40px sans-serif';
    ctx.fillStyle = above ? '#B7D7A8' : '#E7C27A';
    const line = above
      ? `Above the shortlist line (${thresholdLabel})`
      : `Below the shortlist line (${thresholdLabel})`;
    wrap(ctx, line, 80, 520, 920, 56);
    ctx.fillStyle = '#A39E96';
    ctx.font = '400 32px sans-serif';
    wrap(
      ctx,
      'Applying stays free. The optional career package does not change shortlist chances.',
      80,
      760,
      920,
      48,
    );
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/png');
    });
  }

  async function share() {
    setMessage(null);
    try {
      const blob = await draw();
      const file = new File([blob], 'score.png', { type: 'image/png' });
      const text = above
        ? `My skills score is ${scoreOutOf10} out of 10, above the shortlist line (${thresholdLabel}). Applying is free.`
        : `My skills score is ${scoreOutOf10} out of 10, below the shortlist line (${thresholdLabel}). Applying is still free.`;
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text, title: 'Skills score' });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'score.png';
      a.click();
      URL.revokeObjectURL(url);
      const page = `${window.location.origin}${window.location.pathname}#package`;
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${page}`)}`, '_blank', 'noopener,noreferrer');
      setMessage('Image saved. WhatsApp opened so you can attach it.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setMessage('Could not create the card. Try again.');
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void share()}
        className="t-colors cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2 text-[14px] font-medium text-ink hover:border-ink"
      >
        Share score with family
      </button>
      {message ? <p className="m-0 mt-2 text-[13px] text-muted">{message}</p> : null}
    </div>
  );
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let top = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      ctx.fillText(line, x, top);
      line = word;
      top += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, top);
}
