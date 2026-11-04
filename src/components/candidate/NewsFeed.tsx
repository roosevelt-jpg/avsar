import { Markdown } from '@/components/cms/Markdown';
import type { Newsletter } from '@/lib/newsletter/data';
import type { Locale } from '@/lib/i18n';

/** Dated editions staff sent from Email subscribers. Plain text body via Markdown. */
export function NewsFeed({ locale, posts }: { locale: Locale; posts: Newsletter[] }) {
  if (posts.length === 0) {
    return (
      <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(40px,7cqi,72px)]">
        <div className="mx-auto w-full max-w-[720px]">
          <h2 className="m-0 text-[clamp(1.5rem,3.5cqi,2rem)] font-semibold tracking-[-0.02em] text-ink">Latest from the team</h2>
          <p className="mt-3 text-[16px] leading-[1.65] text-ink-2">
            We publish here when there is something concrete to share: hiring demand in a sector, a confirmed change to the visa checklist, or practical notes for candidates already on the path.
          </p>
          <p className="mt-3 text-[16px] leading-[1.65] text-ink-2">
            For email updates, leave your address in Stay Connected in the footer. That list is live.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-[clamp(20px,4cqi,56px)] py-[clamp(40px,7cqi,72px)]">
      <div className="mx-auto w-full max-w-[720px]">
        <h2 className="m-0 text-[clamp(1.5rem,3.5cqi,2rem)] font-semibold tracking-[-0.02em] text-ink">Latest from the team</h2>
        <ul className="m-0 mt-8 list-none space-y-10 p-0">
          {posts.map((post) => (
            <li key={post.id} className="border-t border-line pt-8 first:border-0 first:pt-0">
              <p className="m-0 font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                {post.sentAt
                  ? new Date(post.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : ''}
              </p>
              <h3 className="m-0 mt-2 text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">{post.title}</h3>
              <div className="mt-3 text-[16px] leading-[1.65] text-ink-2">
                <Markdown text={post.body} locale={locale} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
