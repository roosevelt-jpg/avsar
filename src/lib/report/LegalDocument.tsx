import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { LogoWatermark } from './Watermark';

/**
 * The preliminary legal review as a PDF the candidate can keep.
 *
 * The same caveat as on the dashboard: this is a review of the documents they
 * provided, not a visa decision and not permission to work.
 */

const ink = '#1b1a17';
const ink2 = '#4a4740';
const muted = '#6b675f';
const line = '#e4e0d6';

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 48, fontSize: 10, color: ink, lineHeight: 1.45 },
  wordmark: { fontSize: 16, fontWeight: 'bold' },
  eyebrow: { fontSize: 8, color: muted, marginTop: 4, letterSpacing: 0.4 },
  name: { fontSize: 20, fontWeight: 'bold', marginTop: 22 },
  block: { marginTop: 16 },
  label: { fontSize: 8, color: muted, letterSpacing: 0.6, marginBottom: 4 },
  body: { fontSize: 10.5, color: ink2, lineHeight: 1.5 },
  caveat: { marginTop: 22, borderTopWidth: 0.7, borderTopColor: line, paddingTop: 10, fontSize: 8.5, color: muted, lineHeight: 1.45 },
});

export type LegalPdfData = {
  siteName: string;
  name: string;
  summary: string;
  requirements: string;
  missingDocuments: string;
  issues: string;
  deliveredAt: string;
};

export function LegalDocument({ data }: { data: LegalPdfData }) {
  const parts: { label: string; value: string }[] = [
    { label: 'Summary', value: data.summary },
    { label: 'What a Portuguese work visa needs', value: data.requirements },
    { label: 'Still missing', value: data.missingDocuments },
    { label: 'Needs a closer look', value: data.issues },
  ].filter((part) => part.value.trim());

  return (
    <Document title={`${data.siteName} preliminary legal review — ${data.name}`} author={data.siteName}>
      <Page size="A4" style={styles.page}>
        <LogoWatermark />
        <Text style={styles.wordmark}>{data.siteName}</Text>
        <Text style={styles.eyebrow}>PRELIMINARY LEGAL REVIEW · {data.deliveredAt}</Text>
        <Text style={styles.name}>{data.name}</Text>
        {parts.map((part) => (
          <View key={part.label} style={styles.block}>
            <Text style={styles.label}>{part.label.toUpperCase()}</Text>
            <Text style={styles.body}>{part.value}</Text>
          </View>
        ))}
        <Text style={styles.caveat}>
          A preliminary review of the documents you provided by our legal team. It is not permission to work and not a
          decision on a visa: those are made only by the authorities.
        </Text>
      </Page>
    </Document>
  );
}
