/**
 * Permissions, as the app knows them.
 *
 * Mirrors the `permissions` table seeded in 0014. The database is the
 * authority for who holds what; this file exists so a typo in a permission key
 * is a type error rather than a check that silently never passes.
 *
 * Safe to import from client components: it holds names, not decisions.
 */

export const PERMISSIONS = [
  'dashboard.view',
  'jobs.view',
  'jobs.edit',
  'jobs.publish',
  'applications.view',
  'applications.manage',
  'candidates.view',
  'candidates.export',
  'cv.review',
  'leads.manage',
  'relocation.manage',
  'employers.manage',
  'placements.manage',
  'cms.view',
  'cms.edit',
  'cms.publish',
  'media.manage',
  'settings.manage',
  'payments.view',
  'payments.refund',
  'fees.manage',
  'staff.manage',
  'roles.manage',
  'audit.view',
  'privacy.manage',
  'company.manage',
  'integrations.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export const PERMISSION_GROUPS: { group: string; items: { key: Permission; label: string }[] }[] = [
  { group: 'General', items: [{ key: 'dashboard.view', label: 'Console overview' }] },
  {
    group: 'Jobs',
    items: [
      { key: 'jobs.view', label: 'View postings and drafts' },
      { key: 'jobs.edit', label: 'Create and edit postings' },
      { key: 'jobs.publish', label: 'Publish, close, archive' },
    ],
  },
  {
    group: 'Applications',
    items: [
      { key: 'applications.view', label: 'View applications' },
      { key: 'applications.manage', label: 'Move stages, add notes' },
    ],
  },
  {
    group: 'Candidates',
    items: [
      { key: 'candidates.view', label: 'View candidates and talent pool' },
      { key: 'candidates.export', label: 'Export candidate data' },
      { key: 'cv.review', label: 'Review CVs and assessments' },
      { key: 'leads.manage', label: 'Inbox: contact messages and leads' },
      { key: 'relocation.manage', label: 'Relocation: documents, plans, stories, identity release' },
    ],
  },
  {
    group: 'Employers',
    items: [
      { key: 'employers.manage', label: 'Manage employers' },
      { key: 'placements.manage', label: 'Move placements' },
    ],
  },
  {
    group: 'Content',
    items: [
      { key: 'cms.view', label: 'View content and preview drafts' },
      { key: 'cms.edit', label: 'Edit page drafts' },
      { key: 'cms.publish', label: 'Publish pages, restore versions' },
      { key: 'media.manage', label: 'Media library' },
      { key: 'settings.manage', label: 'Site settings' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { key: 'payments.view', label: 'View payments' },
      { key: 'payments.refund', label: 'Mark refunds' },
      { key: 'fees.manage', label: 'Employer placement fees' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { key: 'staff.manage', label: 'Invite and manage staff' },
      { key: 'roles.manage', label: 'Edit role permissions' },
      { key: 'audit.view', label: 'Read the audit log' },
      { key: 'privacy.manage', label: 'Export or erase personal data' },
      { key: 'company.manage', label: 'Company details, prices, selection figures' },
      { key: 'integrations.manage', label: 'Integrations and API keys' },
    ],
  },
];

/** The roles seeded in 0014, for labels. */
export const SYSTEM_ROLES: { key: string; name: string; description: string }[] = [
  { key: 'super_admin', name: 'Super admin', description: 'Everything, including roles and staff.' },
  { key: 'admin', name: 'Admin', description: 'Runs the platform day to day. Cannot change role permissions.' },
  { key: 'recruiter', name: 'Recruiter', description: 'Owns jobs and moves applications through the pipeline.' },
  { key: 'reviewer', name: 'Reviewer', description: 'Reviews CVs and assessments.' },
  { key: 'content_editor', name: 'Content editor', description: 'Edits page drafts and media. Cannot publish.' },
  { key: 'content_manager', name: 'Content manager', description: 'Edits and publishes pages, media and settings.' },
  { key: 'finance', name: 'Finance', description: 'Payments, receipts and refunds.' },
  { key: 'support', name: 'Support', description: 'Read-only, to answer candidate questions.' },
];

export function roleName(key: string): string {
  return SYSTEM_ROLES.find((role) => role.key === key)?.name ?? key;
}

/** A holder of `*` holds everything, including permissions added later. */
export function grants(held: ReadonlySet<string>, permission: Permission): boolean {
  return held.has('*') || held.has(permission);
}
