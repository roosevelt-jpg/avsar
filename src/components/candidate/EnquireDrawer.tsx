'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ContactForm } from '@/components/contact/ContactForm';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener('scroll', onStoreChange, { passive: true });
  return () => window.removeEventListener('scroll', onStoreChange);
}

/**
 * Right-edge enquire tab after scroll; opens a side drawer with the shared
 * contact form. Marketing pages only — mounted from MarketShell.
 */
export function EnquireDrawer({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const visible = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 280,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="enquire-drawer"
        onClick={() => setOpen(true)}
        className={`fixed end-0 top-1/2 z-40 origin-bottom-right -translate-y-1/2 cursor-pointer rounded-s-[8px] border-0 bg-[#b28a49] px-2.5 py-4 text-[13px] font-semibold tracking-[0.08em] text-[#142438] shadow-[0_8px_24px_rgba(20,36,56,0.25)] transition-[opacity,transform] duration-300 [writing-mode:vertical-rl] rotate-180 hover:bg-[#9a743c] ${
          visible && !open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        Enquire
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close enquire panel"
            className="fixed inset-0 z-50 cursor-pointer border-0 bg-[#142438]/45"
            onClick={() => setOpen(false)}
          />
          <aside
            id="enquire-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Send an enquiry"
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-[420px] translate-x-0 flex-col bg-white text-[#142438] shadow-[-12px_0_40px_rgba(20,36,56,0.2)]"
          >
            <div className="flex items-center justify-between border-b border-[#142438]/12 px-5 py-4">
              <div>
                <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b28a49]">Quick enquire</p>
                <h2 className="m-0 mt-1 text-[20px] font-semibold tracking-[-0.02em]">Talk to our team</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 cursor-pointer place-items-center rounded-[8px] border border-[#142438]/15 bg-transparent text-[18px] text-[#142438]"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <ContactForm locale={locale} />
              <p className="m-0 mt-4 text-[13px] text-[#5c7084]">
                Prefer the full page?{' '}
                <Link href={localHref(locale, '/contact')} className="font-semibold text-[#142438] underline-offset-2 hover:underline">
                  Open contact
                </Link>
              </p>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
