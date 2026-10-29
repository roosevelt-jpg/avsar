import type { Block } from '@/lib/cms/blocks';
import type { SiteSettings } from '@/lib/cms/settings';
import { applyTokensDeep, tokenValues } from '@/lib/cms/tokens';
import type { Locale } from '@/lib/i18n';
import { HeroBlock } from './blocks/Hero';
import {
  ContactFormBlock,
  CtaBlock,
  DocumentBlock,
  FeaturesBlock,
  NoticeBlock,
  RichTextBlock,
  SplitBlock,
  StatsBlock,
  StepsBlock,
  TrustBarBlock,
} from './blocks/Content';
import { FeaturedEmployersBlock, FeaturedJobsBlock, JobCategoriesBlock } from './blocks/Jobs';
import { LiveFunnelBlock } from './blocks/LiveFunnel';
import { CandidateStoriesBlock, GalleryBlock, TestimonialsBlock, VideoBlock } from './blocks/Media';
import { ContactCardsBlock, FaqBlock } from './blocks/Faq';

/**
 * Renders a page's blocks in order.
 *
 * Tokens ({{fee_inr}} and friends) are applied here, once, so every block
 * component receives final text. Hidden blocks are skipped. An unknown type,
 * which can only come from a newer database than this code, renders nothing
 * rather than breaking the page.
 */
export function BlockRenderer({ blocks, locale, settings }: { blocks: Block[]; locale: Locale; settings: SiteSettings }) {
  const values = tokenValues(settings);
  const visible = blocks.filter((block) => !block.hidden);

  return (
    <>
      {visible.map((block, index) => {
        const data = applyTokensDeep(block.data, values);
        const props = { data, locale };
        switch (block.type) {
          case 'hero':
            return <HeroBlock key={block.id} {...props} first={index === 0} />;
          case 'trust_bar':
            return <TrustBarBlock key={block.id} {...props} />;
          case 'stats':
            return <StatsBlock key={block.id} {...props} />;
          case 'live_funnel':
            return <LiveFunnelBlock key={block.id} {...props} />;
          case 'steps':
            return <StepsBlock key={block.id} {...props} />;
          case 'features':
            return <FeaturesBlock key={block.id} {...props} />;
          case 'split':
            return <SplitBlock key={block.id} {...props} />;
          case 'featured_jobs':
            return <FeaturedJobsBlock key={block.id} {...props} />;
          case 'job_categories':
            return <JobCategoriesBlock key={block.id} {...props} />;
          case 'featured_employers':
            return <FeaturedEmployersBlock key={block.id} {...props} />;
          case 'video':
            return <VideoBlock key={block.id} {...props} />;
          case 'gallery':
            return <GalleryBlock key={block.id} {...props} />;
          case 'testimonials':
            return <TestimonialsBlock key={block.id} {...props} />;
          case 'candidate_stories':
            return <CandidateStoriesBlock key={block.id} {...props} />;
          case 'faq':
            return <FaqBlock key={block.id} {...props} />;
          case 'cta':
            return <CtaBlock key={block.id} {...props} />;
          case 'rich_text':
            return <RichTextBlock key={block.id} {...props} />;
          case 'notice':
            return <NoticeBlock key={block.id} {...props} />;
          case 'document':
            return <DocumentBlock key={block.id} {...props} />;
          case 'contact_form':
            return <ContactFormBlock key={block.id} {...props} />;
          case 'contact_cards':
            return <ContactCardsBlock key={block.id} {...props} settings={settings} />;
          default:
            return null;
        }
      })}
    </>
  );
}
