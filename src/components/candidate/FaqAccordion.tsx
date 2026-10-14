'use client';

import { useState } from 'react';

/** One item open at a time, +/- sign, per the handoff. */
export function FaqAccordion({ items }: { items: readonly (readonly [string, string])[] }) {
  const [open, setOpen] = useState(0);

  return (
    <ul className="m-0 list-none border-t border-line p-0">
      {items.map(([question, answer], index) => {
        const isOpen = open === index;
        return (
          <li key={question} className="border-b border-line">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
              onClick={() => setOpen(isOpen ? -1 : index)}
              className="t-colors flex w-full cursor-pointer items-start justify-between gap-5 border-0 bg-transparent px-0 py-5 text-left text-[17px] font-medium hover:text-accent"
            >
              {question}
              <span aria-hidden className="shrink-0 font-mono text-[18px] text-muted">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            <div
              id={`faq-panel-${index}`}
              hidden={!isOpen}
              className="max-w-[72ch] pb-6 text-[15px] leading-[1.6] text-ink-2"
            >
              {answer}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
