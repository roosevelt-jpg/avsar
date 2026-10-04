'use client';

import { useState } from 'react';

/**
 * Plays a candidate's voice introduction, in a table row.
 *
 * The audio element is created only when asked for, so a page of twenty-five
 * results does not open twenty-five connections to fetch recordings nobody
 * played. The route behind it re-checks who is asking.
 */
export function VoicePlayer({ candidateId, name }: { candidateId: string; name: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Play ${name}'s introduction`}
        className="t-colors cursor-pointer rounded-[8px] border border-line-strong bg-surface px-2.5 py-1 text-[13px] text-ink-2 hover:border-ink hover:text-ink"
      >
        ▸ Listen
      </button>
    );
  }

  return (
    <audio
      controls
      autoPlay
      preload="none"
      src={`/api/profile/voice/${candidateId}`}
      aria-label={`${name}'s introduction`}
      className="h-[34px] w-[210px] align-middle"
    />
  );
}
