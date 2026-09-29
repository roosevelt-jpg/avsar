/**
 * English assessment, behind a provider interface.
 *
 * The internal item bank measures whether someone can follow written workplace
 * English. That is genuinely useful for triage and it is not a language
 * qualification: the items are uncalibrated, there is no speaking component,
 * and the test is unsupervised.
 *
 * An employer deciding to relocate someone needs a level they can rely on, and
 * that has to come from a provider whose scale means something outside this
 * platform: the Duolingo English Test, the British Council's EnglishScore, or
 * Pearson Versant. All three are commercial agreements, so the seam is here and
 * the adapter is not.
 *
 * Everything above this interface is provider-agnostic. The report records
 * which source produced the level, so a certified result and an internal
 * estimate are never presented as the same thing.
 */

export type EnglishSource = 'internal' | 'duolingo' | 'englishscore' | 'versant';

export type EnglishResult = {
  source: EnglishSource;
  /** CEFR band. From the provider's own mapping when there is one. */
  cefr: string;
  /** The provider's raw score, kept for audit. Null for internal. */
  rawScore: number | null;
  /** Certificate or verification reference a third party can check. */
  certificateRef: string | null;
  /** When the provider issued it. Certificates expire; internal never does. */
  issuedAt: string | null;
  expiresAt: string | null;
  /** True only when a third party stands behind the number. */
  certified: boolean;
};

export interface EnglishProvider {
  readonly source: EnglishSource;
  isConfigured(): boolean;
  /**
   * Starts a test for a candidate and returns where to send them, or null when
   * the provider is taken inline rather than hosted.
   */
  startTest(input: { candidateId: string; email: string; returnUrl: string }): Promise<{
    sessionId: string;
    redirectUrl: string | null;
  }>;
  /** Fetches a finished result. Null while it is still pending. */
  fetchResult(sessionId: string): Promise<EnglishResult | null>;
}

/**
 * The internal fallback: the item bank in this repository.
 *
 * `certified: false` is the load-bearing field. It is what stops the report and
 * the talent pool presenting an unsupervised in-house quiz as if it carried the
 * same weight as a recognised test.
 */
export function internalResult(cefr: string): EnglishResult {
  return {
    source: 'internal',
    cefr,
    rawScore: null,
    certificateRef: null,
    issuedAt: null,
    expiresAt: null,
    certified: false,
  };
}

export function getEnglishProvider(): EnglishProvider | null {
  /* No adapter is wired. When one is, select it here from an env variable and
     keep `internalResult` as the fallback for candidates who have not taken it
     yet: a missing certificate must not block the rest of the report. */
  return null;
}

/** How a level should be described wherever it is shown. */
export function describeEnglish(result: EnglishResult): string {
  if (result.certified) {
    const provider = {
      duolingo: 'Duolingo English Test',
      englishscore: 'EnglishScore',
      versant: 'Versant',
      internal: 'Avsar',
    }[result.source];
    return `${result.cefr} · certified by ${provider}`;
  }
  return `${result.cefr} · Avsar assessment, not a certified qualification`;
}
