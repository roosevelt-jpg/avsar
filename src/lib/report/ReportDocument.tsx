import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * The skills report, as a PDF.
 *
 * This document is the thing the fee buys. The selection rules say the report
 * is the candidate's "to keep and share", so it has to stand on its own away
 * from the platform: who it is about, what was measured, when, and the caveats
 * that stop an employer reading more into a number than it carries.
 *
 * Built with primitives rather than the site's CSS because the PDF renderer
 * supports a subset of layout. Colours are copied from the design tokens.
 */

const ink = '#1b1a17';
const ink2 = '#4a4740';
const muted = '#6b675f';
const line = '#e4e0d6';
const lineSoft = '#efece5';
const accent = '#b9583a';

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48, fontSize: 10, color: ink },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingBottom: 14,
  },
  wordmark: { fontSize: 16, fontWeight: 'bold', letterSpacing: -0.3 },
  eyebrow: { fontSize: 8, color: muted, letterSpacing: 0.6 },
  name: { fontSize: 24, fontWeight: 'bold', marginTop: 26, letterSpacing: -0.6 },
  sub: { fontSize: 10, color: ink2, marginTop: 5 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  stat: { flex: 1, borderWidth: 1, borderColor: line, borderRadius: 6, padding: 12 },
  statDark: { flex: 1, backgroundColor: ink, borderRadius: 6, padding: 12 },
  statLabel: { fontSize: 7, color: muted, letterSpacing: 0.6 },
  statLabelDark: { fontSize: 7, color: '#a8a397', letterSpacing: 0.6 },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 6, letterSpacing: -0.5 },
  statValueDark: { fontSize: 22, fontWeight: 'bold', marginTop: 6, color: '#f7f5f0', letterSpacing: -0.5 },
  statNote: { fontSize: 8, color: muted, marginTop: 3 },
  statNoteDark: { fontSize: 8, color: '#c9c4b8', marginTop: 3 },

  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 28, marginBottom: 12 },

  axisRow: { marginBottom: 11 },
  axisHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  axisLabel: { fontSize: 10 },
  axisValue: { fontSize: 10, color: muted },
  track: { height: 5, backgroundColor: lineSoft, borderRadius: 3 },
  fill: { height: 5, backgroundColor: accent, borderRadius: 3 },

  caveat: {
    marginTop: 26,
    borderWidth: 1,
    borderColor: line,
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fbfaf7',
  },
  caveatTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 5 },
  caveatText: { fontSize: 8.5, color: ink2, lineHeight: 1.5 },

  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: line,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7.5, color: muted },
});

export type ReportData = {
  name: string;
  sector: string;
  cohortName: string;
  overall: number;
  percentile: number | null;
  english: string;
  englishCertified: boolean;
  englishNote: string;
  skills: number;
  experience: number;
  breakdown: { label: string; score: number }[];
  generatedAt: string;
  reference: string;
};

export function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document
      title={`S&A Recruitment skills report - ${data.name}`}
      author="S&A Recruitment"
      subject={`${data.cohortName} skills report`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>S&amp;A Recruitment</Text>
          <Text style={styles.eyebrow}>{data.cohortName.toUpperCase()} · SKILLS REPORT</Text>
        </View>

        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.sub}>{data.sector}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statDark}>
            <Text style={styles.statLabelDark}>OVERALL</Text>
            <Text style={styles.statValueDark}>{data.overall}</Text>
            <Text style={styles.statNoteDark}>
              {data.percentile === null ? 'Ranking pending' : `Top ${data.percentile}% of cohort`}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>ENGLISH</Text>
            <Text style={styles.statValue}>{data.english}</Text>
            <Text style={styles.statNote}>{data.englishNote}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>SKILLS</Text>
            <Text style={styles.statValue}>{data.skills}</Text>
            <Text style={styles.statNote}>Sector knowledge</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>EXPERIENCE</Text>
            <Text style={styles.statValue}>{data.experience}</Text>
            <Text style={styles.statNote}>Depth and responsibility</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Breakdown</Text>
        {data.breakdown.map((axis) => (
          <View key={axis.label} style={styles.axisRow}>
            <View style={styles.axisHead}>
              <Text style={styles.axisLabel}>{axis.label}</Text>
              <Text style={styles.axisValue}>{axis.score}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(1, axis.score)}%` }]} />
            </View>
          </View>
        ))}

        {/* Without this, a number on a letterhead reads as a certificate. */}
        <View style={styles.caveat}>
          <Text style={styles.caveatTitle}>What this report is, and is not</Text>
          <Text style={styles.caveatText}>
            This is an assessment of sector knowledge, work experience and workplace English,
            taken online and unsupervised. It is not a certified language qualification and not
            a verification of employment history. The English figure reflects comprehension of
            workplace material, not a CEFR examination. Employers should treat it as one input
            among several, alongside interview and document checks.
            {data.englishCertified
              ? ' The English level on this report was issued by a recognised testing provider.'
              : ' The English level on this report was produced by S&A Recruitment and is not certified by a third party.'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Issued {data.generatedAt} · Reference {data.reference}
          </Text>
          <Text style={styles.footerText}>S&A Recruitment · Smith & Adams</Text>
        </View>
      </Page>
    </Document>
  );
}
