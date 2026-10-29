import { link, num, str, type BlockData } from '@/lib/cms/blocks';
import { siteText } from '@/lib/cms/localize';
import type { Locale } from '@/lib/i18n';
import { getFunnelStats } from '@/lib/stats/funnel';
import { LiveFunnelView } from '../LiveFunnelView';
import { CmsTextLink, Section, SectionHeading } from '../primitives';

/**
 * Where people actually get to, counted from the database rather than typed
 * in. The rates appear only once enough people have finished the test; until
 * then the block says how many have, which is the honest version of a number
 * too small to mean anything.
 */
export async function LiveFunnelBlock({ data, locale }: { data: BlockData; locale: Locale }) {
  const stats = await getFunnelStats();
  const cta = link(data, 'cta');
  const note = str(data, 'note');

  return (
    <Section tone="surface" className="!py-[clamp(28px,4cqi,48px)]">
      <div className="grid grid-cols-1 items-start gap-[clamp(20px,3cqi,40px)] lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
          {note ? <p className="-mt-2 mb-0 max-w-[56ch] text-[15px] leading-[1.6] text-ink-2">{note}</p> : null}
          {cta ? (
            <div className="mt-6">
              <CmsTextLink href={cta.href} label={cta.label} locale={locale} />
            </div>
          ) : null}
        </div>
        <LiveFunnelView
          initial={stats}
          minSample={num(data, 'minSample', 50)}
          pendingText={str(data, 'pendingText')}
          locale={locale}
          labels={{
            completed: str(data, 'completedLabel'),
            qualified: str(data, 'qualifiedLabel'),
            shortlisted: str(data, 'shortlistedLabel'),
            hired: str(data, 'hiredLabel'),
            per100: siteText(locale, 'Out of every 100 people who finish the test'),
            basedOn: siteText(locale, 'based on {{finished}} people so far'),
            live: siteText(locale, 'Live'),
            sampleProgress: siteText(locale, '{{finished}} of {{min_sample}} finished tests'),
            awaitingRates: siteText(locale, 'Live rates appear here once enough people have finished the test.'),
          }}
        />
      </div>
    </Section>
  );
}
