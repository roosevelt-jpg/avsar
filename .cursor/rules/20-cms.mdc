---
description: CMS blocks, default content, sanitising and rendering
globs: src/lib/cms/**,src/components/cms/**,src/components/admin/cms/**,src/app/[locale]/[slug]/**,src/app/[locale]/page.tsx
---

- A page is an ordered list of typed blocks `{ id, type, hidden?, data }`.
- `src/lib/cms/blocks.ts` is the single registry: field definitions drive the editor form,
  the sanitiser and "Add block". Renderers read fields with `str/num/strList/items/link`.
- Every page has finished default content in `src/lib/cms/defaults/`. The public site falls
  back: published (visitor locale) → published (en) → defaults. Never leave a page empty.
- Drafts (`cms_pages.blocks`) are never public; the public site reads the `cms_public_pages` view.
- Placeholders like `{{fee_inr}}` are resolved in `BlockRenderer` via `src/lib/cms/tokens.ts`.
  Numbers decided in code (fees, response days, odds) must come from tokens, not typed text.
- Rich text uses the safe Markdown subset in `components/cms/Markdown.tsx`. No raw HTML.
- URLs pass `safeUrl()`: relative, #anchor, http(s), mailto, tel only.
- After publishing, call `revalidatePath('/', 'layout')`.
