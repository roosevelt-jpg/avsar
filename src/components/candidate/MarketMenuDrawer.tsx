'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { localHref } from '@/lib/cms/settings';
import type { Locale } from '@/lib/i18n';
import { localePath } from '@/lib/i18n/path';

type DrawerLink = { href: string; label: string };
type DrawerSection = { title: string; links: DrawerLink[] };

/**
 * DSS-style “Browse more” panel: hamburger stays visible on desktop and opens
 * a right-edge drawer with pages beyond the primary header strip. Links come
 * from Site settings (footer columns), so marketing can edit them in the console.
 */
export function MarketMenuDrawer({
  locale,
  sections,
  showLogin,
  cta,
}: {
  locale: Locale;
  sections: DrawerSection[];
  showLogin: boolean;
  cta: { href: string; label: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelId = useId();

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
        aria-controls={panelId}
        aria-label={open ? 'Close menu' : 'Browse more pages'}
        onClick={() => setOpen((value) => !value)}
        className="grid size-9 cursor-pointer place-items-center rounded-[5px] border border-[#8098af] bg-transparent text-[#142438] hover:border-[#b28a49] sm:size-10"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[60] cursor-pointer border-0 bg-[#142438]/45"
            onClick={() => setOpen(false)}
          />
          <aside
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-y-0 end-0 z-[70] flex w-full max-w-[340px] flex-col bg-[#142438] text-white shadow-[-16px_0_40px_rgba(8,20,36,0.35)]"
          >
            <div className="flex items-center justify-between border-b border-white/12 px-5 py-4">
              <div>
                <p id={titleId} className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b28a49]">
                  Browse more
                </p>
                <p className="m-0 mt-1 text-[15px] text-white/70">Pages across the site</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 cursor-pointer place-items-center rounded-[8px] border border-white/20 bg-transparent text-[18px] text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {sections.map((section) =>
                section.links.length > 0 ? (
                  <div key={section.title} className="mb-6">
                    <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{section.title}</p>
                    <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 p-0">
                      {section.links.map((link) => (
                        <li key={`${section.title}-${link.href}`}>
                          <Link
                            href={localHref(locale, link.href)}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between rounded-[8px] px-2.5 py-2.5 text-[15px] font-medium text-white no-underline hover:bg-white/8"
                          >
                            <span>{link.label}</span>
                            <span aria-hidden className="text-[#b28a49]">
                              →
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>

            <div className="border-t border-white/12 px-5 py-4">
              {showLogin ? (
                <Link
                  href={localePath(locale, '/signin')}
                  onClick={() => setOpen(false)}
                  className="mb-2 flex items-center justify-center rounded-[5px] border border-white/25 px-4 py-3 text-[14px] font-semibold text-white no-underline hover:border-[#b28a49]"
                >
                  Log in
                </Link>
              ) : null}
              {cta ? (
                <Link
                  href={localHref(locale, cta.href)}
                  onClick={() => setOpen(false)}
                  className="btn-gradient flex items-center justify-center rounded-[5px] px-4 py-3 text-[14px] font-semibold normal-case tracking-normal no-underline"
                >
                  {cta.label}
                </Link>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
