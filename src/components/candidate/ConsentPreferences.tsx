'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT,
  readConsentPrefs,
  writeConsentPrefs,
  type ConsentPrefs,
} from '@/lib/privacy/consent-prefs';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';

function subscribeConsent(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('sa:consent', onStoreChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('sa:consent', onStoreChange);
  };
}

function consentSnapshot(): ConsentPrefs {
  return readConsentPrefs();
}

function subscribeNothing() {
  return () => undefined;
}

/**
 * First-visit consent panel + revisit FAB. Essential always on; marketing
 * embeds are optional and stored in localStorage. Client-only after mount so
 * localStorage never fights the server HTML.
 */
export function ConsentPreferences({ locale }: { locale: Locale }) {
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const prefs = useSyncExternalStore(subscribeConsent, consentSnapshot, () => DEFAULT_CONSENT);
  const [override, setOverride] = useState<'banner' | 'prefs' | 'hidden' | null>(null);
  const [draftMarketing, setDraftMarketing] = useState(false);

  useEffect(() => {
    const openPrefs = () => {
      setDraftMarketing(readConsentPrefs().marketing);
      setOverride('prefs');
    };
    window.addEventListener('sa:consent-open', openPrefs);
    return () => window.removeEventListener('sa:consent-open', openPrefs);
  }, []);

  if (!mounted) return null;

  const panel = override ?? (prefs.decided ? 'hidden' : 'banner');

  function save(next: ConsentPrefs) {
    writeConsentPrefs(next);
    setDraftMarketing(next.marketing);
    setOverride('hidden');
  }

  return (
    <>
      {panel === 'banner' || panel === 'prefs' ? (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed bottom-4 start-4 z-50 w-[min(100%-2rem,360px)] rounded-[12px] border border-[#142438]/15 bg-white p-4 text-[#142438] shadow-[0_16px_40px_rgba(20,36,56,0.22)]"
        >
          {panel === 'banner' ? (
            <>
              <p className="m-0 text-[15px] font-semibold">Cookies on this site</p>
              <p className="m-0 mt-2 text-[13px] leading-[1.45] text-[#3d5168]">
                Essential cookies keep you signed in and remember your language. Optional marketing embeds (for example YouTube) load only if you allow them.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-[8px] border-0 bg-[#b28a49] px-3.5 py-2 text-[13px] font-semibold text-[#142438]"
                  onClick={() => save({ decided: true, marketing: true })}
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-[8px] border border-[#142438]/2 bg-transparent px-3.5 py-2 text-[13px] font-semibold text-[#142438]"
                  onClick={() => save({ decided: true, marketing: false })}
                >
                  Essential only
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-[8px] border-0 bg-transparent px-2 py-2 text-[13px] font-semibold text-[#142438] underline-offset-2 hover:underline"
                  onClick={() => {
                    setDraftMarketing(prefs.marketing);
                    setOverride('prefs');
                  }}
                >
                  Preferences
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="m-0 text-[15px] font-semibold">Preferences</p>
              <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
                <li className="rounded-[8px] border border-[#142438]/12 px-3 py-2.5">
                  <p className="m-0 text-[14px] font-semibold">Essential</p>
                  <p className="m-0 mt-1 text-[12px] text-[#5c7084]">Always on — sign-in and language.</p>
                </li>
                <li className="rounded-[8px] border border-[#142438]/12 px-3 py-2.5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-[#b28a49]"
                      checked={draftMarketing}
                      onChange={(e) => setDraftMarketing(e.target.checked)}
                    />
                    <span>
                      <span className="block text-[14px] font-semibold">Marketing embeds</span>
                      <span className="mt-1 block text-[12px] text-[#5c7084]">YouTube and similar players when you press play.</span>
                    </span>
                  </label>
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-[8px] border-0 bg-[#b28a49] px-3.5 py-2 text-[13px] font-semibold text-[#142438]"
                  onClick={() => save({ decided: true, marketing: draftMarketing })}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-[8px] border border-[#142438]/2 bg-transparent px-3.5 py-2 text-[13px] font-semibold"
                  onClick={() => setOverride(prefs.decided ? 'hidden' : 'banner')}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          <p className="m-0 mt-3 text-[12px] text-[#5c7084]">
            Details in the{' '}
            <Link href={localHref(locale, '/cookie-policy')} className="font-semibold text-[#142438] underline-offset-2 hover:underline">
              cookie policy
            </Link>
            .
          </p>
        </div>
      ) : null}

      {prefs.decided && panel === 'hidden' ? (
        <button
          type="button"
          aria-label="Cookie preferences"
          title="Cookie preferences"
          onClick={() => {
            setDraftMarketing(prefs.marketing);
            setOverride('prefs');
          }}
          className="fixed bottom-4 start-4 z-40 grid size-11 cursor-pointer place-items-center rounded-full border border-[#142438]/15 bg-white text-[#142438] shadow-[0_10px_28px_rgba(20,36,56,0.18)] hover:border-[#b28a49]"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <circle cx="12" cy="12" r="8" />
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="14" cy="9" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="13" cy="14" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </button>
      ) : null}
    </>
  );
}
