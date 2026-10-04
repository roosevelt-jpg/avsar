'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mono } from '@/components/ui/Mono';
import { fill, type Dictionary } from '@/lib/i18n';

/**
 * Records a short spoken introduction.
 *
 * It is not marked, and the screen says so. The recording goes to employers,
 * who judge it by their own criteria; see 0011_voice_intro.sql for why it is
 * not scored by us.
 *
 * Built for a phone on mobile data, which is what this audience has. Everything
 * happens locally until Save: nothing is uploaded while they are still deciding
 * whether they like it, so a bad take costs no data and no embarrassment.
 */

const MAX_SECONDS = 45;

type State = 'idle' | 'asking' | 'recording' | 'review' | 'saving' | 'saved' | 'denied' | 'failed';

/** Whichever of these the browser supports. Android gives webm, iOS mp4. */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

export function VoiceIntro({
  t,
  existingSeconds,
  candidateId,
}: {
  t: Dictionary;
  /** Length of the clip already saved, if any. */
  existingSeconds: number | null;
  candidateId: string;
}) {
  const v = t.voice;

  const [state, setState] = useState<State>(existingSeconds ? 'saved' : 'idle');
  const [seconds, setSeconds] = useState(0);
  const [savedSeconds, setSavedSeconds] = useState(existingSeconds);
  const [clipUrl, setClipUrl] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const blob = useRef<Blob | null>(null);
  const ticker = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);

  /* Release the microphone and the object URL. A page that keeps the mic open
     leaves the recording indicator on, which is alarming and rightly so. */
  const cleanup = useCallback(() => {
    if (ticker.current) window.clearInterval(ticker.current);
    ticker.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);
  useEffect(() => {
    return () => {
      if (clipUrl) URL.revokeObjectURL(clipUrl);
    };
  }, [clipUrl]);

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  async function start() {
    const mimeType = pickMimeType();
    if (!mimeType) return setState('failed');

    setState('asking');
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      /* Refused, or no microphone. Either way it is not an error to apologise
         for: the rest of the profile works without this. */
      return setState('denied');
    }

    stream.current = media;
    chunks.current = [];
    const rec = new MediaRecorder(media, { mimeType });
    recorder.current = rec;

    rec.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    rec.onstop = () => {
      cleanup();
      const made = new Blob(chunks.current, { type: mimeType });
      blob.current = made;
      if (clipUrl) URL.revokeObjectURL(clipUrl);
      setClipUrl(URL.createObjectURL(made));
      setState('review');
    };

    rec.start();
    setSeconds(0);
    setState('recording');

    ticker.current = window.setInterval(() => {
      setSeconds((value) => {
        /* Hard stop rather than a scolding message. Forty-five seconds is the
           brief, and a clip that runs long is the interface's fault. */
        if (value + 1 >= MAX_SECONDS) stop();
        return value + 1;
      });
    }, 1000);
  }

  async function save() {
    if (!blob.current) return;
    setState('saving');
    try {
      const form = new FormData();
      const extension = blob.current.type.includes('mp4') ? 'm4a' : 'webm';
      form.append('audio', new File([blob.current], `intro.${extension}`, { type: blob.current.type }));
      form.append('seconds', String(Math.max(1, seconds)));

      const response = await fetch('/api/profile/voice', { method: 'POST', body: form });
      if (!response.ok) return setState('failed');

      setSavedSeconds(Math.max(1, seconds));
      setState('saved');
    } catch (error) {
      console.error('[voice] save failed', error);
      setState('failed');
    }
  }

  async function remove() {
    setState('saving');
    try {
      await fetch('/api/profile/voice', { method: 'DELETE' });
    } catch (error) {
      console.error('[voice] delete failed', error);
    }
    blob.current = null;
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    setClipUrl(null);
    setSavedSeconds(null);
    setSeconds(0);
    setState('idle');
  }

  const button =
    't-colors cursor-pointer rounded-[10px] border-0 px-4 py-2.5 text-[14px] font-medium disabled:opacity-40';
  const primary = `${button} bg-ink text-white hover:bg-accent`;
  const quiet = `${button} border border-line-strong bg-surface text-ink hover:border-ink`;

  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <Mono className="text-muted">{v.eyebrow}</Mono>
      <h2 className="mt-2 mb-1.5 text-[17px] font-semibold">{v.title}</h2>
      <p className="m-0 max-w-[62ch] text-[14px] leading-[1.6] text-ink-2">{v.lead}</p>
      <p className="mt-2 mb-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted">{v.notMarked}</p>

      <div className="mt-4 rounded-[12px] bg-surface-subtle p-4">
        <p className="m-0 text-[14px] leading-[1.6] text-ink">{v.prompt}</p>
      </div>

      {state === 'idle' && (
        <button type="button" onClick={() => void start()} className={`${primary} mt-4`}>
          {v.record}
        </button>
      )}

      {state === 'asking' && <p className="mt-4 mb-0 text-[14px] text-muted">{v.asking}</p>}

      {state === 'recording' && (
        <div className="mt-4 flex items-center gap-3.5">
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-accent-deep" />
          <Mono className="text-[15px] tabular-nums text-ink">
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')} / 00:{MAX_SECONDS}
          </Mono>
          <button type="button" onClick={stop} className={quiet}>
            {v.stop}
          </button>
        </div>
      )}

      {state === 'review' && clipUrl && (
        <div className="mt-4 flex flex-col gap-3">
          <audio controls src={clipUrl} className="w-full max-w-[420px]" />
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => void save()} className={primary}>
              {v.save}
            </button>
            <button type="button" onClick={() => void start()} className={quiet}>
              {v.again}
            </button>
          </div>
        </div>
      )}

      {state === 'saving' && <p className="mt-4 mb-0 text-[14px] text-muted">{v.saving}</p>}

      {state === 'saved' && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="m-0 text-[14px] text-ink-2">
            {fill(v.saved, { seconds: String(savedSeconds ?? 0) })}
          </p>
          <audio
            controls
            src={`/api/profile/voice/${candidateId}?t=${savedSeconds ?? 0}`}
            className="w-full max-w-[420px]"
          />
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => void start()} className={quiet}>
              {v.again}
            </button>
            <button type="button" onClick={() => void remove()} className={quiet}>
              {v.remove}
            </button>
          </div>
        </div>
      )}

      {state === 'denied' && (
        <p className="mt-4 mb-0 max-w-[62ch] text-[14px] leading-[1.6] text-accent-deep">
          {v.denied}
        </p>
      )}

      {state === 'failed' && (
        <div className="mt-4">
          <p className="m-0 mb-2.5 max-w-[62ch] text-[14px] leading-[1.6] text-accent-deep">
            {v.failed}
          </p>
          <button type="button" onClick={() => void start()} className={quiet}>
            {v.record}
          </button>
        </div>
      )}
    </section>
  );
}
