import { ENTITY, entityIsComplete } from '@/lib/data/brand';

/**
 * The registered entity, on every policy page.
 *
 * When the details are not filled in, this says so in plain words instead of
 * rendering an empty bracket. A payment aggregator's reviewer reading
 * "[COMPANY NAME]" rejects the application; one reading an honest gap at least
 * knows what is missing.
 */
export function EntityDetails() {
  if (!entityIsComplete()) {
    return (
      <p className="m-0 rounded-[12px] border border-accent bg-accent-tint px-4 py-3.5 text-[14px] leading-[1.6] text-ink">
        The registered company name, address and telephone number are not yet published on this
        site. They must be filled in before this page is shown to a payment provider or to an
        applicant. See <code className="font-mono text-[13px]">ENTITY</code> in{' '}
        <code className="font-mono text-[13px]">src/lib/data/brand.ts</code>.
      </p>
    );
  }

  return (
    <address className="m-0 not-italic text-[15px] leading-[1.7] text-ink-2">
      <strong className="font-semibold text-ink">{ENTITY.legalName}</strong>
      <br />
      {ENTITY.registeredAddress}
      <br />
      {ENTITY.jurisdiction}
      <br />
      <span className="font-mono text-[14px]">{ENTITY.phone}</span>
      <br />
      <span className="font-mono text-[14px]">{ENTITY.supportEmail}</span>
    </address>
  );
}
