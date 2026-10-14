import { BLOCKS, isBlockType, newBlockId, type Block, type BlockData, type Field } from './blocks';

/**
 * Turns whatever the editor sent into blocks the renderer can trust.
 *
 * Walks the registry's field definitions, so it keeps exactly the fields a
 * block type declares, coerces each to its kind, caps lengths, and drops
 * anything else. The renderer never sees raw HTML (there is no HTML field) and
 * never sees a `javascript:` URL.
 */

const MAX_BLOCKS = 60;

/** Relative paths, anchors, http(s), mailto, tel. Nothing else. */
export function safeUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  const value = input.trim().slice(0, 1000);
  if (!value) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (value.startsWith('#')) return value;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return '';
}

function sanitizeField(field: Field, value: unknown): unknown {
  switch (field.kind) {
    case 'text':
      return typeof value === 'string' ? value.trim().slice(0, field.max ?? 300) : '';
    case 'textarea':
      return typeof value === 'string' ? value.replace(/\r\n/g, '\n').slice(0, field.max ?? 6000) : '';
    case 'url':
    case 'media':
      return safeUrl(value);
    case 'number': {
      const n = Math.round(Number(value));
      return Number.isFinite(n) ? Math.min(field.max, Math.max(field.min, n)) : field.min;
    }
    case 'select': {
      const allowed = field.options.map((option) => option.value);
      return typeof value === 'string' && allowed.includes(value) ? value : (allowed[0] ?? '');
    }
    case 'boolean':
      return value === true;
    case 'link': {
      const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
      return {
        label: typeof raw.label === 'string' ? raw.label.trim().slice(0, 80) : '',
        href: safeUrl(raw.href),
      };
    }
    case 'stringList':
      return Array.isArray(value)
        ? value
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim().slice(0, 300))
            .filter(Boolean)
            .slice(0, field.max ?? 30)
        : [];
    case 'list':
      return Array.isArray(value)
        ? value
            .filter((item) => item && typeof item === 'object')
            .slice(0, field.max ?? 50)
            .map((item) => sanitizeObject(field.fields, item as Record<string, unknown>))
        : [];
  }
}

function sanitizeObject(fields: Field[], raw: Record<string, unknown>): BlockData {
  const out: BlockData = {};
  for (const field of fields) out[field.name] = sanitizeField(field, raw[field.name]);
  return out;
}

export function sanitizeBlocks(input: unknown): Block[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const blocks: Block[] = [];
  for (const raw of input.slice(0, MAX_BLOCKS)) {
    if (!raw || typeof raw !== 'object') continue;
    const candidate = raw as Record<string, unknown>;
    const type = typeof candidate.type === 'string' ? candidate.type : '';
    if (!isBlockType(type)) continue;
    let id = typeof candidate.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(candidate.id) ? candidate.id : newBlockId();
    if (seen.has(id)) id = newBlockId();
    seen.add(id);
    const data = sanitizeObject(BLOCKS[type].fields, (candidate.data ?? {}) as Record<string, unknown>);
    blocks.push({ id, type, hidden: candidate.hidden === true, data });
  }
  return blocks;
}

export type PageSeo = { title: string; description: string; ogImage: string; noindex: boolean };

export function sanitizeSeo(input: unknown): PageSeo {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  return {
    title: typeof raw.title === 'string' ? raw.title.trim().slice(0, 80) : '',
    description: typeof raw.description === 'string' ? raw.description.trim().slice(0, 200) : '',
    ogImage: safeUrl(raw.ogImage),
    noindex: raw.noindex === true,
  };
}
