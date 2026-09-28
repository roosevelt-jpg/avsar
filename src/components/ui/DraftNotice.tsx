/**
 * Marks a page whose wording still needs legal review. These pages carry the
 * fee and selection disclosures, so they must not be published as they stand.
 */
export function DraftNotice({ note }: { note: string }) {
  return (
    <p className="m-0 mb-8 rounded-[12px] border border-line-strong bg-surface-subtle px-4 py-3.5 font-mono text-[12px] leading-[1.6] text-muted">
      DRAFT · {note}
    </p>
  );
}
