import { items, num, str, type BlockData } from '@/lib/cms/blocks';
import type { Locale } from '@/lib/i18n';
import { publishedStories } from '@/lib/relocation/data';
import { CmsImage, CmsVideo, Section, SectionHeading } from '../primitives';

type Props = { data: BlockData; locale: Locale };

export function VideoBlock({ data }: Props) {
  const src = str(data, 'src');
  if (!src) return null;
  return (
    <Section>
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} align="center" />
      <figure className="m-0 mx-auto max-w-[960px]">
        <div className="relative aspect-video overflow-hidden rounded-[28px] bg-night shadow-[0_30px_80px_-30px_rgba(27,26,23,0.45)]">
          <CmsVideo src={src} poster={str(data, 'poster')} title={str(data, 'title') || 'Video'} />
        </div>
        {str(data, 'caption') ? (
          <figcaption className="mt-3 text-center font-mono text-[12px] text-muted">{str(data, 'caption')}</figcaption>
        ) : null}
      </figure>
    </Section>
  );
}

export function GalleryBlock({ data }: Props) {
  const list = items(data, 'items').filter((item) => str(item, 'image'));
  if (!list.length) return null;
  return (
    <Section>
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} />
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3">
        {list.map((item, index) => (
          <li key={index} className={index % 5 === 0 ? 'col-span-2 md:col-span-1 md:row-span-2' : ''}>
            <figure className="m-0">
              <div className={`photo-card relative bg-canvas ${index % 2 === 1 ? 'photo-card-alt' : ''} ${index % 5 === 0 ? 'aspect-[4/3] md:aspect-[3/4]' : 'aspect-[4/3]'}`}>
                <CmsImage src={str(item, 'image')} alt={str(item, 'alt')} sizes="(max-width: 768px) 50vw, 33vw" />
              </div>
              {str(item, 'caption') ? <figcaption className="mt-2 text-[13px] text-muted">{str(item, 'caption')}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Approved stories, in the candidate's own words and chosen name. Renders
 * nothing when there are none: an empty "stories" section reads worse than
 * no section, and inventing filler is not an option.
 */
export async function CandidateStoriesBlock({ data }: Props) {
  const stories = await publishedStories(num(data, 'limit', 3));
  if (!stories.length) return null;
  return (
    <Section tone="surface">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} intro={str(data, 'intro')} />
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
        {stories.map((story) => (
          <li key={story.id} className="blue-card flex flex-col p-6">
            <blockquote className="m-0 flex-1 text-[17px] leading-[1.6] text-ink">“{story.quote}”</blockquote>
            <div className="mt-6">
              <p className="m-0 text-[15px] font-semibold">{story.displayName}</p>
              <p className="m-0 text-[13px] text-muted">{[story.roleLabel, story.cityLabel].filter(Boolean).join(', ')}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function TestimonialsBlock({ data }: Props) {
  const list = items(data, 'items').filter((item) => str(item, 'quote'));
  if (!list.length) return null;
  return (
    <Section tone="surface">
      <SectionHeading eyebrow={str(data, 'eyebrow')} title={str(data, 'title')} />
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
        {list.map((item, index) => (
          <li key={index} className="flex flex-col rounded-[22px] border border-line bg-paper p-6">
            <blockquote className="m-0 flex-1 text-[17px] leading-[1.6] text-ink">“{str(item, 'quote')}”</blockquote>
            <div className="mt-6 flex items-center gap-3">
              {str(item, 'photo') ? (
                <span className="relative size-11 overflow-hidden rounded-full bg-canvas">
                  <CmsImage src={str(item, 'photo')} alt="" sizes="44px" />
                </span>
              ) : (
                <span className="grid size-11 place-items-center rounded-full bg-accent-tint font-semibold text-accent-deep">
                  {str(item, 'name').slice(0, 1)}
                </span>
              )}
              <div>
                <p className="m-0 text-[15px] font-semibold">{str(item, 'name')}</p>
                <p className="m-0 text-[13px] text-muted">{str(item, 'detail')}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
