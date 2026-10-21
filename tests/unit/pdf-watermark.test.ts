import { createElement, type ReactElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { CvDocument } from '@/lib/report/CvDocument';
import { LegalDocument } from '@/lib/report/LegalDocument';
import { ReportDocument } from '@/lib/report/ReportDocument';

const cv = {
  headline: 'Cook, 6 years',
  summary: 'I cook in a hotel kitchen.',
  experience: [
    {
      employer: 'A hotel',
      title: 'Cook',
      period: '2019–2025',
      bullets: [{ text: 'Prepared lunch for 80 guests.', basedOn: 'lunch for 80' }],
    },
  ],
  skills: ['Indian cuisine'],
  languages: ['Hindi', 'English'],
  education: ['Hotel school'],
};

const person = { name: 'Asha Rao', email: 'a@example.com', phone: '', location: 'Goa', position: 'Cook', cv };

describe('prepared documents carry the logo', () => {
  it('renders the CV, the skills report, and the legal review', async () => {
    const pdf = (node: ReactElement) => renderToBuffer(node as ReactElement<DocumentProps>);
    const buffers = await Promise.all([
      pdf(createElement(CvDocument, { data: person, template: 'standard' })),
      pdf(createElement(CvDocument, { data: person, template: 'europass' })),
      pdf(createElement(CvDocument, { data: person, template: 'professional' })),
      pdf(
        createElement(ReportDocument, {
          data: {
            name: 'Asha Rao',
            sector: 'Hospitality',
            cohortName: 'Cohort 01',
            overall: 7.4,
            percentile: 20,
            english: 'B1',
            englishCertified: false,
            englishNote: 'S&A assessment, not certified',
            skills: 7,
            experience: 8,
            breakdown: [{ label: 'Kitchen', score: 7 }],
            generatedAt: '21 October 2026',
            reference: 'AV-01-ABCDEF12',
          },
        }),
      ),
      pdf(
        createElement(LegalDocument, {
          data: {
            siteName: 'S&A Recruitment',
            name: 'Asha Rao',
            summary: 'Passport is present.',
            requirements: 'A work contract is required.',
            missingDocuments: 'Police clearance.',
            issues: 'None in the file so far.',
            deliveredAt: '21 October 2026',
          },
        }),
      ),
    ]);

    for (const buffer of buffers) {
      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(buffer.length).toBeGreaterThan(1000);
    }
  });
});
