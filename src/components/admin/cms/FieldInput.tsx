'use client';

import type { BlockData, Field } from '@/lib/cms/blocks';
import { MediaField } from '../MediaPicker';

/**
 * One form control per field kind, recursive for lists. Driven entirely by the
 * registry in src/lib/cms/blocks.ts, so a new field there appears here with no
 * editor changes.
 */

const INPUT = 'w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] outline-none focus:border-ink';

function Label({ field }: { field: Field }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-[13px] font-medium text-ink-2">{field.label}</span>
      {field.help ? <span className="text-[12px] text-muted">{field.help}</span> : null}
    </span>
  );
}

export function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: unknown) => void }) {
  switch (field.kind) {
    case 'text':
    case 'url':
      return (
        <label className="flex flex-col gap-1.5">
          <Label field={field} />
          <input className={INPUT} value={typeof value === 'string' ? value : ''} maxLength={field.kind === 'text' ? field.max : 1000} placeholder={field.kind === 'text' ? field.placeholder : 'https://... or /path'} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case 'textarea':
      return (
        <label className="flex flex-col gap-1.5">
          <Label field={field} />
          <textarea className={`${INPUT} font-[inherit] leading-[1.55]`} rows={field.rows ?? 4} maxLength={field.max} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
          {field.markdown ? (
            <span className="text-[11px] text-muted">
              Formatting: **bold**, *italic*, [link text](/jobs), lines starting with “- ” for lists, “## ” for a heading.
            </span>
          ) : null}
        </label>
      );
    case 'number':
      return (
        <label className="flex flex-col gap-1.5">
          <Label field={field} />
          <input type="number" className={`${INPUT} max-w-[140px]`} min={field.min} max={field.max} value={typeof value === 'number' ? value : Number(value) || field.min} onChange={(e) => onChange(Number(e.target.value))} />
        </label>
      );
    case 'select':
      return (
        <label className="flex flex-col gap-1.5">
          <Label field={field} />
          <select className={`${INPUT} max-w-[280px]`} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      );
    case 'boolean':
      return (
        <label className="flex cursor-pointer items-center gap-2 text-[14px]">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      );
    case 'media':
      return <MediaField label={field.label} accept={field.accept} value={typeof value === 'string' ? value : ''} onChange={onChange} />;
    case 'link': {
      const link = (value && typeof value === 'object' ? value : {}) as { label?: string; href?: string };
      return (
        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className="mb-1.5 p-0"><Label field={field} /></legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={INPUT} placeholder="Button text" value={link.label ?? ''} onChange={(e) => onChange({ ...link, label: e.target.value })} />
            <input className={INPUT} placeholder="/jobs or https://..." value={link.href ?? ''} onChange={(e) => onChange({ ...link, href: e.target.value })} />
          </div>
        </fieldset>
      );
    }
    case 'stringList': {
      const list = Array.isArray(value) ? (value as string[]) : [];
      return (
        <label className="flex flex-col gap-1.5">
          <Label field={field} />
          <textarea className={INPUT} rows={Math.max(3, list.length + 1)} value={list.join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />
          <span className="text-[11px] text-muted">One per line.</span>
        </label>
      );
    }
    case 'list': {
      const list = Array.isArray(value) ? (value as BlockData[]) : [];
      const update = (index: number, next: BlockData) => onChange(list.map((item, i) => (i === index ? next : item)));
      const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= list.length) return;
        const copy = [...list];
        const [moved] = copy.splice(index, 1);
        if (moved) copy.splice(target, 0, moved);
        onChange(copy);
      };
      const empty = () => Object.fromEntries(field.fields.map((f) => [f.name, f.kind === 'list' || f.kind === 'stringList' ? [] : f.kind === 'link' ? { label: '', href: '' } : f.kind === 'boolean' ? false : f.kind === 'select' ? (f.options[0]?.value ?? '') : f.kind === 'number' ? f.min : '']));
      return (
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1.5 p-0"><Label field={field} /></legend>
          {list.map((item, index) => (
            <details key={index} className="rounded-[12px] border border-line bg-paper" open={list.length <= 2}>
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[13px]">
                <span className="truncate font-medium">
                  {field.itemLabel} {index + 1}
                  {typeof item[field.fields[0]?.name ?? ''] === 'string' && item[field.fields[0]?.name ?? ''] ? ` · ${String(item[field.fields[0]?.name ?? '']).slice(0, 50)}` : ''}
                </span>
                <span className="flex shrink-0 gap-1">
                  <button type="button" aria-label="Move up" onClick={(e) => { e.preventDefault(); move(index, -1); }} className="cursor-pointer rounded border border-line bg-surface px-1.5 text-[12px]">↑</button>
                  <button type="button" aria-label="Move down" onClick={(e) => { e.preventDefault(); move(index, 1); }} className="cursor-pointer rounded border border-line bg-surface px-1.5 text-[12px]">↓</button>
                  <button type="button" onClick={(e) => { e.preventDefault(); onChange(list.filter((_, i) => i !== index)); }} className="cursor-pointer rounded border border-line bg-surface px-1.5 text-[12px] text-accent-deep">Remove</button>
                </span>
              </summary>
              <div className="flex flex-col gap-3 border-t border-line px-3 py-3">
                {field.fields.map((sub) => (
                  <FieldInput key={sub.name} field={sub} value={item[sub.name]} onChange={(next) => update(index, { ...item, [sub.name]: next })} />
                ))}
              </div>
            </details>
          ))}
          {(field.max === undefined || list.length < field.max) && (
            <button type="button" onClick={() => onChange([...list, empty()])} className="cursor-pointer self-start rounded-full border border-dashed border-line-strong bg-transparent px-3 py-1.5 text-[13px] hover:border-ink">
              + Add {field.itemLabel.toLowerCase()}
            </button>
          )}
        </fieldset>
      );
    }
  }
}
