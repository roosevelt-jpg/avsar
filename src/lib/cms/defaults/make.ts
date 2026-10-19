import type { Block, BlockData, BlockType } from '../blocks';

export type DefaultPage = {
  slug: string;
  /** Public URL under the locale: '' is the home page. */
  path: string;
  title: string;
  /** Shown in the console list, so editors know what each page is for. */
  purpose: string;
  seo: { title: string; description: string };
  blocks: Block[];
};

/** Deterministic ids, so the default content renders with stable keys. */
export function makeBlocks(slug: string, list: [BlockType, BlockData][]): Block[] {
  return list.map(([type, data], index) => ({ id: `${slug}-${index}`, type, data }));
}
