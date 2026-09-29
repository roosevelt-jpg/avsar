/**
 * Areas and positions.
 *
 * Two levels, because the meeting produced two lists that do not line up: four
 * areas for navigation, and ten positions people actually apply to. Welders and
 * logistics do not belong under "Food & Beverage" or "IT", so forcing ten roles
 * into four buckets would mean putting them somewhere wrong.
 *
 * The candidate picks a **position**. That is what they call themselves, what
 * the assessment is drawn from, and what an employer searches for. Areas group
 * them for navigation and nothing else.
 */

export const AREAS = [
  { slug: 'property-management', label: 'Property management' },
  { slug: 'cleaning', label: 'Cleaning' },
  { slug: 'food-beverage', label: 'Food and beverage' },
  { slug: 'trades-logistics', label: 'Trades and logistics' },
  { slug: 'it', label: 'IT' },
] as const;

export type AreaSlug = (typeof AREAS)[number]['slug'];

/**
 * The meeting listed four areas: property management, cleaning, food and
 * beverage, IT. Six of the ten positions are trades and logistics roles that
 * fit none of them, so a fifth area exists rather than filing a welder under
 * property management. Collapse it if the four are firm, but the roles then
 * need rehoming, not hiding.
 */
export const POSITIONS = [
  { slug: 'chef', label: 'Chef', area: 'food-beverage', itemSector: 'hospitality' },
  { slug: 'fb-service', label: 'Food and beverage service', area: 'food-beverage', itemSector: 'hospitality' },
  { slug: 'cleaner', label: 'Cleaner', area: 'cleaning', itemSector: 'cleaning' },
  { slug: 'property-manager', label: 'Property management', area: 'property-management', itemSector: 'property-management' },
  { slug: 'driver', label: 'Driver', area: 'trades-logistics', itemSector: 'drivers' },
  { slug: 'logistics', label: 'Logistics', area: 'trades-logistics', itemSector: 'drivers' },
  { slug: 'construction-worker', label: 'Construction worker', area: 'trades-logistics', itemSector: 'construction' },
  { slug: 'electrician', label: 'Electrician', area: 'trades-logistics', itemSector: 'maintenance' },
  { slug: 'plumber', label: 'Plumber', area: 'trades-logistics', itemSector: 'maintenance' },
  { slug: 'welder', label: 'Welder', area: 'trades-logistics', itemSector: 'construction' },
  { slug: 'data-analyst', label: 'Data analyst', area: 'it', itemSector: 'it' },
  { slug: 'qa-tester', label: 'QA tester', area: 'it', itemSector: 'it' },
] as const;

export type PositionSlug = (typeof POSITIONS)[number]['slug'];
export type Position = (typeof POSITIONS)[number];

export function positionBySlug(slug: string): Position | undefined {
  return POSITIONS.find((position) => position.slug === slug);
}

export function positionLabel(slug: string): string {
  return positionBySlug(slug)?.label ?? slug;
}

export function positionsInArea(area: AreaSlug): readonly Position[] {
  return POSITIONS.filter((position) => position.area === area);
}

export function areaLabel(slug: string): string {
  return AREAS.find((area) => area.slug === slug)?.label ?? slug;
}

/**
 * Which set of assessment items a position draws from.
 *
 * Deliberately a separate field from `area`: several positions share a bank
 * (a plumber and an electrician both answer maintenance items), and IT has no
 * bank at all yet, so `it` returns nothing until one is written rather than
 * silently handing a data analyst questions about scaffolding.
 */
export function itemSectorFor(slug: string): string {
  return positionBySlug(slug)?.itemSector ?? 'hospitality';
}

export const POSITION_SLUGS = POSITIONS.map((position) => position.slug);
