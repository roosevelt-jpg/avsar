'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { BLOCKS, BLOCK_TYPES, emptyBlock, type Block, type BlockType } from '@/lib/cms/blocks';
import { TOKEN_HELP } from '@/lib/cms/tokens';
import type { PageSeo } from '@/lib/cms/sanitize';
import { MediaField } from '../MediaPicker';
import { FieldInput } from './FieldInput';

type Seo = PageSeo;
type Version = { id: number; kind: string; note: string | null; createdAt: string; createdBy: string | null };

const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

/**
 * The page editor.
 *
 * Left: the blocks, each a collapsible form generated from the registry.
 * Right: what the page is, its status, SEO, versions and the actions.
 *
 * Save writes the draft only; the public site changes on Publish. Reset
 * deletes the stored page so the site returns to the default content shipped
 * in code.
 */
export function PageEditor(props: {
  slug: string;
  locale: string;
  publicPath: string;
  initial: { title: string; blocks: Block[]; seo: Seo };
  stored: boolean;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
  canEdit: boolean;
  canPublish: boolean;
  versions: Version[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(props.initial.title);
  const [blocks, setBlocks] = useState<Block[]>(props.initial.blocks);
  const [seo, setSeo] = useState<Seo>(props.initial.seo);
  const [openId, setOpenId] = useState<string | null>(props.initial.blocks[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify({ title: props.initial.title, blocks: props.initial.blocks, seo: props.initial.seo }));

  const dirty = useMemo(() => JSON.stringify({ title, blocks, seo }) !== savedSnapshot, [title, blocks, seo, savedSnapshot]);

  function updateBlock(id: string, next: Partial<Block>) {
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...next } : block)));
  }

  function move(index: number, delta: number) {
    setBlocks((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      const [moved] = copy.splice(index, 1);
      if (moved) copy.splice(target, 0, moved);
      return copy;
    });
  }

  function add(type: BlockType) {
    const block = emptyBlock(type);
    setBlocks((current) => [...current, block]);
    setOpenId(block.id);
    setAdding(false);
  }

  async function call(action: 'save' | 'publish' | 'reset' | 'unpublish', note?: string) {
    setBusy(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/cms/pages/${props.slug}`, {
        method: action === 'reset' ? 'DELETE' : 'PUT',
        headers: { 'content-type': 'application/json' },
        body: action === 'reset' ? JSON.stringify({ locale: props.locale }) : JSON.stringify({ locale: props.locale, title, blocks, seo, action, note }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) {
        const reasons: Record<string, string> = {
          not_configured: 'The database is not connected, so nothing was saved.',
          forbidden: 'Your role does not allow this action.',
        };
        setMessage({ tone: 'error', text: reasons[data?.error ?? ''] ?? data?.message ?? 'That did not work. Try again.' });
        return;
      }
      setSavedSnapshot(JSON.stringify({ title, blocks, seo }));
      setMessage({
        tone: 'ok',
        text: action === 'publish' ? 'Published. The live page is updated.' : action === 'reset' ? 'Reset to the default content.' : action === 'unpublish' ? 'Unpublished. The site shows the default content.' : 'Draft saved.',
      });
      router.refresh();
      if (action === 'reset') window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  async function restore(versionId: number) {
    if (!confirm('Replace the current draft with this version? The draft is not published until you press Publish.')) return;
    setBusy('restore');
    const response = await fetch(`/api/admin/cms/pages/${props.slug}/versions/${versionId}`, { method: 'POST' });
    setBusy(null);
    if (response.ok) window.location.reload();
    else setMessage({ tone: 'error', text: 'Could not restore that version.' });
  }

  const readOnly = !props.canEdit;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-2">Page title (for the console and browser tab)</span>
          <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnly} />
        </label>

        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {blocks.map((block, index) => {
            const def = BLOCKS[block.type];
            const open = openId === block.id;
            const headline = (block.data.title ?? block.data.eyebrow ?? '') as string;
            return (
              <li key={block.id} className={`rounded-[16px] border bg-surface ${open ? 'border-ink' : 'border-line'} ${block.hidden ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <button type="button" onClick={() => setOpenId(open ? null : block.id)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-start">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-paper font-mono text-[11px] text-muted">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-ink">
                        {def.label}
                        {block.hidden ? <span className="ms-2 font-mono text-[11px] font-normal text-muted">hidden</span> : null}
                      </span>
                      <span className="block truncate text-[13px] text-muted">{headline || def.description}</span>
                    </span>
                  </button>
                  {!readOnly && (
                    <span className="flex gap-1">
                      <button type="button" aria-label="Move up" onClick={() => move(index, -1)} className="cursor-pointer rounded-[8px] border border-line bg-paper px-2 py-1 text-[12px]">↑</button>
                      <button type="button" aria-label="Move down" onClick={() => move(index, 1)} className="cursor-pointer rounded-[8px] border border-line bg-paper px-2 py-1 text-[12px]">↓</button>
                      <button type="button" onClick={() => updateBlock(block.id, { hidden: !block.hidden })} className="cursor-pointer rounded-[8px] border border-line bg-paper px-2 py-1 text-[12px]">
                        {block.hidden ? 'Show' : 'Hide'}
                      </button>
                      <button
                        type="button"
                        onClick={() => confirm(`Remove this ${def.label} block?`) && setBlocks((current) => current.filter((b) => b.id !== block.id))}
                        className="cursor-pointer rounded-[8px] border border-line bg-paper px-2 py-1 text-[12px] text-accent-deep"
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </div>
                {open && (
                  <fieldset disabled={readOnly} className="m-0 flex flex-col gap-4 border-0 border-t border-line px-4 py-4">
                    {def.fields.map((field) => (
                      <FieldInput
                        key={field.name}
                        field={field}
                        value={block.data[field.name]}
                        onChange={(value) => updateBlock(block.id, { data: { ...block.data, [field.name]: value } })}
                      />
                    ))}
                  </fieldset>
                )}
              </li>
            );
          })}
        </ol>

        {!readOnly &&
          (adding ? (
            <div className="rounded-[16px] border border-dashed border-line-strong bg-paper p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="m-0 text-[14px] font-semibold">Add a block</p>
                <button type="button" onClick={() => setAdding(false)} className="cursor-pointer border-0 bg-transparent text-[13px] text-muted">Cancel</button>
              </div>
              <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
                {BLOCK_TYPES.map((type) => (
                  <li key={type}>
                    <button type="button" onClick={() => add(type)} className="block w-full cursor-pointer rounded-[12px] border border-line bg-surface px-3 py-2.5 text-start hover:border-ink">
                      <span className="block text-[14px] font-medium">{BLOCKS[type].label}</span>
                      <span className="block text-[12px] text-muted">{BLOCKS[type].description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="cursor-pointer rounded-[16px] border border-dashed border-line-strong bg-transparent px-4 py-4 text-[14px] text-ink-2 hover:border-ink hover:text-ink">
              + Add a block
            </button>
          ))}
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Status</p>
          <p className="m-0 mt-2 text-[14px]">
            {!props.stored
              ? 'Showing the default content. Save to start editing your own copy.'
              : props.publishedAt
                ? `Published ${new Date(props.publishedAt).toLocaleString('en-GB')}${props.hasUnpublishedChanges ? ', with unpublished changes' : ''}.`
                : 'Saved as a draft, never published. The site shows the default content.'}
          </p>
          {dirty && <p className="m-0 mt-2 text-[13px] font-medium text-accent-deep">You have unsaved changes.</p>}
          {message && <p className={`m-0 mt-2 text-[13px] ${message.tone === 'ok' ? 'text-[oklch(0.42_0.12_150)]' : 'text-accent-deep'}`}>{message.text}</p>}

          <div className="mt-4 flex flex-col gap-2">
            {props.canEdit && (
              <button type="button" disabled={Boolean(busy)} onClick={() => call('save')} className="cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2.5 text-[14px] font-medium hover:border-ink disabled:opacity-60">
                {busy === 'save' ? 'Saving…' : 'Save draft'}
              </button>
            )}
            {props.canPublish && (
              <button type="button" disabled={Boolean(busy)} onClick={() => call('publish')} className="cursor-pointer rounded-full border-0 bg-ink px-4 py-2.5 text-[14px] font-medium text-paper hover:bg-ink-hover disabled:opacity-60">
                {busy === 'publish' ? 'Publishing…' : 'Save and publish'}
              </button>
            )}
            <Link href={`/admin/cms/preview?slug=${props.slug}&locale=${props.locale}`} target="_blank" className="rounded-full px-4 py-2 text-center text-[14px] text-ink-2 hover:text-ink">
              Preview saved draft ↗
            </Link>
            <a href={props.publicPath} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 text-center text-[14px] text-ink-2 hover:text-ink">
              View live page ↗
            </a>
          </div>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Search and sharing</p>
          <fieldset disabled={readOnly} className="m-0 mt-3 flex flex-col gap-3 border-0 p-0">
            <label className="flex flex-col gap-1">
              <span className="text-[13px] text-ink-2">Search title ({seo.title.length}/70)</span>
              <input className={INPUT} value={seo.title} maxLength={80} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[13px] text-ink-2">Search description ({seo.description.length}/160)</span>
              <textarea className={INPUT} rows={3} value={seo.description} maxLength={200} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[13px] text-ink-2">Share title ({seo.ogTitle.length}/90)</span>
              <input className={INPUT} value={seo.ogTitle} maxLength={90} placeholder="Defaults to the search title" onChange={(e) => setSeo({ ...seo, ogTitle: e.target.value })} />
              <span className="text-[12px] text-muted">What WhatsApp, Facebook and LinkedIn show when the page is shared.</span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[13px] text-ink-2">Share description ({seo.ogDescription.length}/200)</span>
              <textarea className={INPUT} rows={2} value={seo.ogDescription} maxLength={200} placeholder="Defaults to the search description" onChange={(e) => setSeo({ ...seo, ogDescription: e.target.value })} />
            </label>
            <MediaField label="Share image (1200 × 630)" accept="image" value={seo.ogImage} onChange={(value) => setSeo({ ...seo, ogImage: typeof value === 'string' ? value : '' })} />
            <span className="-mt-2 text-[12px] text-muted">Empty uses the site share image from Settings › Search &amp; sharing.</span>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={seo.noindex} onChange={(e) => setSeo({ ...seo, noindex: e.target.checked })} />
              Hide from search engines
            </label>
          </fieldset>
        </section>

        <details className="rounded-[16px] border border-line bg-surface p-4">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Placeholders you can type</summary>
          <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-[12px]">
            {TOKEN_HELP.map((token) => (
              <li key={token.token}>
                <code className="rounded bg-paper px-1 font-mono">{token.token}</code> <span className="text-muted">{token.meaning}</span>
              </li>
            ))}
          </ul>
        </details>

        <details className="rounded-[16px] border border-line bg-surface p-4">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Version history ({props.versions.length})</summary>
          {props.versions.length === 0 ? (
            <p className="m-0 mt-3 text-[13px] text-muted">Every save and publish is kept here.</p>
          ) : (
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {props.versions.map((version) => (
                <li key={version.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span>
                    <span className={version.kind === 'published' ? 'font-medium text-ink' : 'text-ink-2'}>{version.kind === 'published' ? 'Published' : 'Saved'}</span>
                    <span className="block font-mono text-[11px] text-muted">
                      {new Date(version.createdAt).toLocaleString('en-GB')}
                      {version.createdBy ? ` · ${version.createdBy}` : ''}
                    </span>
                  </span>
                  {props.canPublish && (
                    <button type="button" onClick={() => restore(version.id)} className="cursor-pointer rounded-full border border-line bg-paper px-2.5 py-1 text-[12px]">
                      Restore
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </details>

        {props.canPublish && props.stored && (
          <section className="rounded-[16px] border border-line bg-surface p-4">
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Danger zone</p>
            <div className="mt-3 flex flex-col gap-2">
              {props.publishedAt && (
                <button type="button" disabled={Boolean(busy)} onClick={() => confirm('Unpublish? The site will show the default content until you publish again.') && call('unpublish')} className="cursor-pointer rounded-full border border-line bg-paper px-4 py-2 text-[13px]">
                  Unpublish
                </button>
              )}
              <button type="button" disabled={Boolean(busy)} onClick={() => confirm('Delete your edits for this language and go back to the default content? Versions are deleted too.') && call('reset')} className="cursor-pointer rounded-full border border-accent/50 bg-paper px-4 py-2 text-[13px] text-accent-deep">
                Reset to default content
              </button>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
