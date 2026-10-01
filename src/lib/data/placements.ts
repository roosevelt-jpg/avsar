/**
 * The placement state machine.
 *
 * Written down rather than left to free text in a column, because the order is
 * what makes "overdue" and "where is this stuck" answerable. Every transition
 * is appended to `placement_transitions`; this list is only the vocabulary.
 */
export const PLACEMENT_STATES = [
  'shortlisted',
  'offer_made',
  'offer_accepted',
  'contract_signed',
  'visa_submitted',
  'visa_granted',
  'travelled',
  'started',
] as const;

export type PlacementState = (typeof PLACEMENT_STATES)[number];

const LABELS: Record<PlacementState, string> = {
  shortlisted: 'Shortlisted',
  offer_made: 'Offer made',
  offer_accepted: 'Offer accepted',
  contract_signed: 'Contract signed',
  visa_submitted: 'Visa submitted',
  visa_granted: 'Visa granted',
  travelled: 'Travelled',
  started: 'Started work',
};

export function stateLabel(state: string): string {
  return LABELS[state as PlacementState] ?? state;
}

export function isPlacementState(value: string): value is PlacementState {
  return (PLACEMENT_STATES as readonly string[]).includes(value);
}

/**
 * When the candidate's placement fee becomes payable.
 *
 * Not on an offer and not on a signature: only once the contract is signed is
 * the job real, which is what the terms promise and what the checkout says.
 */
export const FEE_DUE_FROM: PlacementState = 'contract_signed';
