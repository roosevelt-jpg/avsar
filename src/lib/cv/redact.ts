import type { Discrepancy, Extraction } from './schema';

/**
 * Builds the input the rating pass is allowed to see.
 *
 * This is an allowlist, not a denylist, and deliberately so: if someone adds a
 * field to the extraction schema later, it does not silently start reaching the
 * rating model. Anything new has to be added here on purpose.
 *
 * What is removed: name, contact details, date of birth, age, gender, marital
 * status, religion or caste, nationality, and whether the CV carried a photo.
 * Indian CVs frequently volunteer several of these without being asked.
 *
 * What is kept, and why: employer names, job titles, dates, responsibilities,
 * skills, languages, qualifications, certifications and institutions. These are
 * the substance of the assessment, and institution names in particular are
 * needed for a qualification to be verifiable at all.
 *
 * The honest limit: employer and institution names can still correlate with
 * region, language group or religion in India. Redaction cannot remove that
 * without destroying the signal the rating exists to measure. The mitigation is
 * not more redaction, it is outcome monitoring: see docs/ai-rating.md.
 */
export type RatingInput = {
  roles: {
    employer: string;
    title: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    country: string;
    responsibilities: string[];
  }[];
  totalYearsExperience: number;
  education: { institution: string; qualification: string; field: string; year: string }[];
  certifications: { name: string; issuer: string; year: string }[];
  languages: { language: string; statedLevel: string }[];
  skills: string[];
  employmentGaps: { from: string; to: string; months: number }[];
  documentQuality: Extraction['documentQuality'];
};

export function toRatingInput(extraction: Extraction): RatingInput {
  return {
    roles: extraction.roles.map((role) => ({
      employer: role.employer,
      title: role.title,
      startDate: role.startDate,
      endDate: role.endDate,
      isCurrent: role.isCurrent,
      country: role.country,
      responsibilities: role.responsibilities,
    })),
    totalYearsExperience: extraction.totalYearsExperience,
    education: extraction.education.map((e) => ({
      institution: e.institution,
      qualification: e.qualification,
      field: e.field,
      year: e.year,
    })),
    certifications: extraction.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      year: c.year,
    })),
    languages: extraction.languages.map((l) => ({ language: l.language, statedLevel: l.statedLevel })),
    skills: extraction.skills,
    employmentGaps: extraction.employmentGaps.map((g) => ({
      from: g.from,
      to: g.to,
      months: g.months,
    })),
    documentQuality: extraction.documentQuality,
  };
}

/** Bands the candidate picks at sign-up, in years. */
const SELF_REPORTED_BANDS: readonly [number, number][] = [
  [0, 1],
  [1, 3],
  [3, 5],
  [5, 60],
];

/**
 * Compares the CV against what the candidate said at sign-up.
 *
 * This is the part of the pipeline with the clearest operational value. A CV
 * claiming nine years against a self-reported "1 to 3" is not necessarily
 * dishonest, but a human should look. Severity drives whether it is surfaced in
 * the list or only on the detail view.
 */
export function findDiscrepancies(
  extraction: Extraction,
  selfReported: { fullName: string; email: string; yearsBand: number },
): Discrepancy[] {
  const out: Discrepancy[] = [];

  const band = SELF_REPORTED_BANDS[selfReported.yearsBand];
  if (band) {
    const [low, high] = band;
    const documented = extraction.totalYearsExperience;
    if (documented > 0 && (documented < low - 1 || documented > high + 2)) {
      out.push({
        field: 'Years of experience',
        selfReported: `${low}-${high === 60 ? '5+' : high} years`,
        fromDocument: `${documented} years`,
        severity: documented > high + 4 || documented < low - 2 ? 'serious' : 'review',
      });
    }
  }

  const cvName = extraction.protectedAttributes.fullName.trim().toLowerCase();
  const signupName = selfReported.fullName.trim().toLowerCase();
  if (cvName && signupName && !namesOverlap(cvName, signupName)) {
    out.push({
      field: 'Name',
      selfReported: selfReported.fullName,
      fromDocument: extraction.protectedAttributes.fullName,
      severity: 'serious',
    });
  }

  const cvEmail = extraction.protectedAttributes.email.trim().toLowerCase();
  if (cvEmail && cvEmail !== selfReported.email.trim().toLowerCase()) {
    out.push({
      field: 'Email',
      selfReported: selfReported.email,
      fromDocument: extraction.protectedAttributes.email,
      severity: 'info',
    });
  }

  if (extraction.documentQuality === 'illegible') {
    out.push({
      field: 'Document',
      selfReported: '-',
      fromDocument: 'Could not be read reliably',
      severity: 'review',
    });
  }

  return out;
}

/**
 * Loose name comparison. Transliteration from Indian languages varies a lot
 * (Mohammed / Muhammad / Mohd), and name order is inconsistent, so an exact
 * match would raise a serious flag on most honest applications. Any shared
 * token of three or more characters is treated as an overlap.
 */
function namesOverlap(a: string, b: string): boolean {
  const tokens = (value: string) =>
    new Set(value.split(/[^a-z]+/).filter((token) => token.length >= 3));
  const first = tokens(a);
  for (const token of tokens(b)) if (first.has(token)) return true;
  return false;
}
