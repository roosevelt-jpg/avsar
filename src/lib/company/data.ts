import { getFunnelStats } from '@/lib/stats/funnel';

/**
 * How many candidates have actually finished the assessment.
 *
 * Counted, never typed in: a figure shown to employers is a claim, and a
 * constant is how a placeholder becomes a number somebody repeats. Read from
 * the public funnel, so a public page never needs the service role for it.
 */
export async function assessedCount(): Promise<number> {
  return (await getFunnelStats()).completed;
}
