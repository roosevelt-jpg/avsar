import { describe, expect, it } from 'vitest';
import { barWidth, per100 } from '@/lib/stats/funnel-shared';
import { youtubeEmbedUrl, youtubeId } from '@/lib/cms/video';
import { BLOCKS } from '@/lib/cms/blocks';
import { sanitizeBlocks } from '@/lib/cms/sanitize';
import { HOME } from '@/lib/cms/defaults/home';
import { DEFAULT_SETTINGS } from '@/lib/cms/settings';

describe('live funnel', () => {
  it('reports per 100, with a decimal only below 10', () => {
    expect(per100(25, 100)).toBe('25');
    expect(per100(4, 1000)).toBe('0.4');
    expect(per100(3, 40)).toBe('7.5');
    expect(per100(0, 100)).toBe('0');
    expect(per100(5, 0)).toBe('0');
  });

  it('keeps small non-zero stages visible and empty ones empty', () => {
    expect(barWidth(1, 1000)).toBe(2);
    expect(barWidth(0, 1000)).toBe(0);
    expect(barWidth(50, 100)).toBe(50);
  });

  it('survives sanitising with its threshold clamped', () => {
    const [block] = sanitizeBlocks([{ id: 'b_1', type: 'live_funnel', data: { ...BLOCKS.live_funnel.empty, minSample: -5 } }]);
    expect(block?.type).toBe('live_funnel');
    expect(block?.data.minSample).toBe(1);
  });
});

describe('YouTube links', () => {
  it('reads the id from every common form', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?t=10',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    ]) {
      expect(youtubeId(url), url).toBe('dQw4w9WgXcQ');
    }
    expect(youtubeId('/video/intro.mp4')).toBeNull();
  });

  it('embeds through the no-cookie domain', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ', true)).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?.*autoplay=1/);
  });
});

describe('one main action', () => {
  it('home and header ask for the same first step', () => {
    const hero = HOME.blocks.find((block) => block.type === 'hero');
    const cta = HOME.blocks.find((block) => block.type === 'cta');
    const heroPrimary = hero?.data.primaryCta as { label: string; href: string };
    const ctaPrimary = cta?.data.primary as { label: string; href: string };
    expect(heroPrimary).toEqual(ctaPrimary);
    expect(DEFAULT_SETTINGS.navigation.headerCta.href).toBe(heroPrimary.href);
    expect(DEFAULT_SETTINGS.navigation.headerCta.label).toBe(heroPrimary.label);
  });

  it('home shows the live funnel', () => {
    expect(HOME.blocks.some((block) => block.type === 'live_funnel')).toBe(true);
  });
});
