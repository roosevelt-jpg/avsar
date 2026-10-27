import Link from 'next/link';
import type { PersonLink } from '@/lib/console/same-person';

/**
 * The other files that belong to this phone number or email.
 * Shown on the application and on the lead, so staff do not work the same
 * person twice.
 */
export function SamePerson({ person }: { person: PersonLink }) {
  const rows = [
    ...person.applications.map((item) => ({
      key: `app-${item.id}`,
      href: `/admin/applications/${item.id}`,
      label: item.jobTitle || 'Application',
      meta: `${item.reference} · ${item.status.replaceAll('_', ' ')}`,
    })),
    ...person.leads.map((item) => ({
      key: `lead-${item.id}`,
      href: `/admin/inbox/${item.id}`,
      label: item.fullName,
      meta: `Message · ${item.topic.replaceAll('_', ' ')} · ${item.status}`,
    })),
  ];
  if (rows.length === 0) return null;

  return (
    <section className="rounded-[16px] border border-line bg-surface p-5">
      <h2 className="m-0 text-[16px] font-semibold">Same person</h2>
      <p className="m-0 mt-2 text-[14px] leading-[1.5] text-ink-2">
        {person.candidate
          ? `${person.candidate.fullName} already has a profile. These are the other files on that phone or email.`
          : 'These messages use the same phone or email.'}
      </p>
      {rows.length > 0 ? (
        <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          {rows.map((row) => (
            <li key={row.key}>
              <Link href={row.href} className="block rounded-[12px] bg-paper px-3 py-2 text-ink no-underline hover:text-employer">
                <span className="block text-[14px] font-medium">{row.label}</span>
                <span className="block text-[12px] text-muted">{row.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 mt-3 text-[14px] text-muted">No other file yet.</p>
      )}
    </section>
  );
}
