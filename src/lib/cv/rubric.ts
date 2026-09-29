import type { SectorSlug } from '@/lib/data/sectors';

/**
 * Rating criteria per sector.
 *
 * Kept as data, not prose inside a prompt, for three reasons: the same rubric
 * has to be shown to the reviewer next to the score, a changed rubric has to be
 * versioned so an old decision can still be explained, and criteria weights are
 * the thing that will actually need tuning once placements start reporting back.
 *
 * Bump RUBRIC_VERSION on any change. Stored with every assessment.
 */

export const RUBRIC_VERSION = 'v1-2026-09';

export type Criterion = {
  id: string;
  label: string;
  /** Shown to the reviewer verbatim, and given to the model as the definition. */
  definition: string;
  weight: number;
};

const SHARED: Criterion[] = [
  {
    id: 'relevant_experience',
    label: 'Relevant experience',
    definition:
      'Length and depth of paid work in this sector or a directly transferable one. Judge the work described, not the job title.',
    weight: 0.3,
  },
  {
    id: 'stability',
    label: 'Employment stability',
    definition:
      'Length of tenure and pattern of moves. Short tenures are only a concern where the pattern is unexplained; seasonal and contract work is normal in these sectors and is not instability.',
    weight: 0.15,
  },
  {
    id: 'progression',
    label: 'Progression and responsibility',
    definition:
      'Evidence of taking on more responsibility over time, training others, or being trusted with money, keys, vehicles or guests.',
    weight: 0.15,
  },
  {
    id: 'documentation',
    label: 'Documentation quality',
    definition:
      'How verifiable the claims are: named employers, dates, certifications with issuers. This rates the evidence, not the person.',
    weight: 0.1,
  },
];

const SECTOR_SPECIFIC: Record<SectorSlug, Criterion[]> = {
  hospitality: [
    {
      id: 'guest_facing',
      label: 'Guest-facing competence',
      definition:
        'Direct experience serving guests or customers, handling complaints, and working to a service standard.',
      weight: 0.2,
    },
    {
      id: 'standards',
      label: 'Standards and hygiene',
      definition: 'Evidence of working to documented hygiene, food safety or housekeeping standards.',
      weight: 0.1,
    },
  ],
  'property-management': [
    {
      id: 'tenant_coordination',
      label: 'Tenant and contractor coordination',
      definition: 'Experience coordinating residents, contractors, deliveries or building access.',
      weight: 0.2,
    },
    {
      id: 'record_keeping',
      label: 'Record keeping',
      definition: 'Evidence of logging issues, managing keys, inventories or scheduled maintenance.',
      weight: 0.1,
    },
  ],
  cleaning: [
    {
      id: 'method',
      label: 'Method and chemical handling',
      definition: 'Evidence of trained cleaning method, safe chemical handling and equipment use.',
      weight: 0.2,
    },
    {
      id: 'autonomy',
      label: 'Working unsupervised',
      definition: 'Evidence of working alone to a checklist or standard without direct supervision.',
      weight: 0.1,
    },
  ],
  drivers: [
    {
      id: 'licence_record',
      label: 'Licence and driving record',
      definition:
        'Licence categories held, years held, vehicle types driven, and any stated record. Absence of a stated record is not evidence of a bad one.',
      weight: 0.2,
    },
    {
      id: 'route_conditions',
      label: 'Route and condition range',
      definition: 'Breadth of conditions driven: city, highway, night, passengers, goods, long distance.',
      weight: 0.1,
    },
  ],
  maintenance: [
    {
      id: 'trade_depth',
      label: 'Trade depth',
      definition: 'Depth in a named trade: electrical, plumbing, HVAC, carpentry, general repair.',
      weight: 0.2,
    },
    {
      id: 'safety_certification',
      label: 'Safety certification',
      definition: 'Trade certifications, safety cards or formal apprenticeship.',
      weight: 0.1,
    },
  ],
  it: [
    {
      id: 'technical_depth',
      label: 'Technical depth',
      definition:
        'Depth in the tools the role actually uses: SQL and a reporting tool for an analyst, test design and defect tracking for a tester. Judge what they built or tested, not the list of technologies on the page.',
      weight: 0.2,
    },
    {
      id: 'communication',
      label: 'Written communication',
      definition:
        'Evidence of explaining technical findings to people who are not technical. This role reports to a business, not to engineers.',
      weight: 0.1,
    },
  ],
  construction: [
    {
      id: 'trade_depth',
      label: 'Trade depth',
      definition: 'Depth in a named trade: masonry, carpentry, steel fixing, formwork, finishing.',
      weight: 0.2,
    },
    {
      id: 'site_safety',
      label: 'Site safety',
      definition: 'Safety training, site inductions, working at height or plant operation tickets.',
      weight: 0.1,
    },
  ],
};

export function rubricFor(sector: SectorSlug): Criterion[] {
  return [...SHARED, ...(SECTOR_SPECIFIC[sector] ?? [])];
}

/** Weighted overall from the per-criterion scores, computed here rather than by the model. */
export function weightedOverall(
  sector: SectorSlug,
  scores: readonly { id: string; score: number }[],
): number {
  const rubric = rubricFor(sector);
  let total = 0;
  let weightUsed = 0;
  for (const criterion of rubric) {
    const found = scores.find((s) => s.id === criterion.id);
    if (!found) continue;
    total += found.score * criterion.weight;
    weightUsed += criterion.weight;
  }
  if (weightUsed === 0) return 0;
  return Math.round(total / weightUsed);
}
