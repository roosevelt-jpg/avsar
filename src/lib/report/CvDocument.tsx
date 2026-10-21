import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { LogoWatermark } from './Watermark';
import type { CareerPack } from '@/lib/cv/coach-schema';

/**
 * The candidate's CV, in three formats.
 *
 * Designed here rather than adapted from templates found online: CV designs are
 * someone's copyrighted work, and claims that a given template "performs" are
 * marketing rather than evidence.
 *
 * What is evidence-led is the constraint all three share. These CVs go to
 * Portuguese employers in hospitality, trades and services, and some end up in
 * a visa file. So: real text in a linear order, no text inside graphics, no
 * columns that interleave when parsed, standard section headings. A decorative
 * CV reads worse to the recruitment software many of these employers run, and
 * adds nothing for the person who reads it afterwards.
 */

export type CvTemplate = 'standard' | 'europass' | 'professional';

export const CV_TEMPLATES: { id: CvTemplate; name: string; note: string }[] = [
  {
    id: 'standard',
    name: 'Standard',
    note: 'One column, read cleanly by any recruitment software. Works everywhere.',
  },
  {
    id: 'europass',
    name: 'Europass',
    note: 'The European Union format. What a Portuguese employer expects from someone arriving from abroad.',
  },
  {
    id: 'professional',
    name: 'Professional',
    note: 'A sidebar for skills and languages. Suits IT and supervisory roles.',
  },
];

export type CvData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  cv: CareerPack['improvedCv'];
};

const ink = '#1b1a17';
const ink2 = '#4a4740';
const muted = '#6b675f';
const line = '#d9d4c8';
const lineSoft = '#eceae4';
const europassBlue = '#003399';

const base = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 48, paddingHorizontal: 48, fontSize: 9.5, color: ink, lineHeight: 1.45 },
  name: { fontSize: 22, fontWeight: 'bold', letterSpacing: -0.4 },
  headline: { fontSize: 11, color: ink2, marginTop: 3 },
  contact: { fontSize: 8.5, color: muted, marginTop: 6 },
  sectionTitle: {
    fontSize: 8, letterSpacing: 1.2, color: muted, marginTop: 18, marginBottom: 7,
    borderBottomWidth: 0.7, borderBottomColor: line, paddingBottom: 4,
  },
  summary: { fontSize: 9.5, color: ink2, lineHeight: 1.5 },
  roleHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  roleTitle: { fontSize: 10.5, fontWeight: 'bold' },
  rolePeriod: { fontSize: 8.5, color: muted },
  bullet: { flexDirection: 'row', marginBottom: 2.5 },
  dot: { width: 9, fontSize: 9.5, color: muted },
  bulletText: { flex: 1, fontSize: 9.5, color: ink2 },
  role: { marginBottom: 11 },
  inline: { fontSize: 9.5, color: ink2 },
  footer: {
    position: 'absolute', bottom: 24, left: 48, right: 48,
    borderTopWidth: 0.7, borderTopColor: lineSoft, paddingTop: 8,
    fontSize: 7, color: muted,
  },
});

function Bullets({ bullets }: { bullets: CareerPack['improvedCv']['experience'][number]['bullets'] }) {
  return (
    <View>
      {bullets.map((bullet) => (
        <View key={bullet.text} style={base.bullet}>
          <Text style={base.dot}>•</Text>
          <Text style={base.bulletText}>{bullet.text}</Text>
        </View>
      ))}
    </View>
  );
}

function Experience({ cv }: { cv: CareerPack['improvedCv'] }) {
  return (
    <View>
      {cv.experience.map((role) => (
        <View key={`${role.employer}-${role.title}`} style={base.role} wrap={false}>
          <View style={base.roleHead}>
            <Text style={base.roleTitle}>
              {role.title}, {role.employer}
            </Text>
            <Text style={base.rolePeriod}>{role.period}</Text>
          </View>
          <Bullets bullets={role.bullets} />
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------- standard --- */

function Standard({ data }: { data: CvData }) {
  const { cv } = data;
  return (
    <Page size="A4" style={base.page}>
      <LogoWatermark />
      <Text style={base.name}>{data.name}</Text>
      <Text style={base.headline}>{cv.headline}</Text>
      <Text style={base.contact}>
        {[data.location, data.phone, data.email].filter(Boolean).join('  ·  ')}
      </Text>

      <Text style={base.sectionTitle}>PROFILE</Text>
      <Text style={base.summary}>{cv.summary}</Text>

      <Text style={base.sectionTitle}>EXPERIENCE</Text>
      <Experience cv={cv} />

      <Text style={base.sectionTitle}>SKILLS</Text>
      <Text style={base.inline}>{cv.skills.join('  ·  ')}</Text>

      <Text style={base.sectionTitle}>LANGUAGES</Text>
      <Text style={base.inline}>{cv.languages.join('  ·  ')}</Text>

      <Text style={base.sectionTitle}>EDUCATION</Text>
      {cv.education.map((item) => (
        <Text key={item} style={base.inline}>
          {item}
        </Text>
      ))}
    </Page>
  );
}

/* ------------------------------------------------------------- europass --- */

const eu = StyleSheet.create({
  band: { backgroundColor: europassBlue, marginHorizontal: -48, marginTop: -44, paddingHorizontal: 48, paddingVertical: 22, marginBottom: 20 },
  bandName: { fontSize: 21, fontWeight: 'bold', color: '#ffffff', letterSpacing: -0.3 },
  bandRole: { fontSize: 10.5, color: '#c8d4f0', marginTop: 3 },
  bandContact: { fontSize: 8.5, color: '#c8d4f0', marginTop: 8 },
  row: { flexDirection: 'row', marginBottom: 12 },
  label: { width: 96, fontSize: 8, letterSpacing: 0.9, color: europassBlue, paddingTop: 1.5 },
  body: { flex: 1 },
});

function Europass({ data }: { data: CvData }) {
  const { cv } = data;
  return (
    <Page size="A4" style={base.page}>
      <LogoWatermark />
      <View style={eu.band}>
        <Text style={eu.bandName}>{data.name}</Text>
        <Text style={eu.bandRole}>{cv.headline}</Text>
        <Text style={eu.bandContact}>
          {[data.location, data.phone, data.email].filter(Boolean).join('  ·  ')}
        </Text>
      </View>

      <View style={eu.row}>
        <Text style={eu.label}>APPLYING FOR</Text>
        <View style={eu.body}><Text style={base.inline}>{data.position}</Text></View>
      </View>

      <View style={eu.row}>
        <Text style={eu.label}>ABOUT</Text>
        <View style={eu.body}><Text style={base.summary}>{cv.summary}</Text></View>
      </View>

      <View style={eu.row}>
        <Text style={eu.label}>WORK</Text>
        <View style={eu.body}><Experience cv={cv} /></View>
      </View>

      <View style={eu.row}>
        <Text style={eu.label}>EDUCATION</Text>
        <View style={eu.body}>
          {cv.education.map((item) => <Text key={item} style={base.inline}>{item}</Text>)}
        </View>
      </View>

      <View style={eu.row}>
        <Text style={eu.label}>LANGUAGES</Text>
        <View style={eu.body}><Text style={base.inline}>{cv.languages.join('  ·  ')}</Text></View>
      </View>

      <View style={eu.row}>
        <Text style={eu.label}>SKILLS</Text>
        <View style={eu.body}><Text style={base.inline}>{cv.skills.join('  ·  ')}</Text></View>
      </View>
    </Page>
  );
}

/* --------------------------------------------------------- professional --- */

const pro = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 22 },
  main: { flex: 1 },
  /* The sidebar holds lists only. Nothing a reader follows as prose sits in
     it, so a parser reading the page in order still gets a sensible document. */
  side: { width: 138 },
  sideTitle: { fontSize: 7.5, letterSpacing: 1.1, color: muted, marginTop: 16, marginBottom: 5 },
  sideItem: { fontSize: 8.5, color: ink2, marginBottom: 2.5 },
  rule: { height: 2.5, backgroundColor: ink, width: 34, marginTop: 10, marginBottom: 14 },
});

function Professional({ data }: { data: CvData }) {
  const { cv } = data;
  return (
    <Page size="A4" style={base.page}>
      <LogoWatermark />
      <Text style={base.name}>{data.name}</Text>
      <Text style={base.headline}>{cv.headline}</Text>
      <View style={pro.rule} />

      <View style={pro.columns}>
        <View style={pro.main}>
          <Text style={base.summary}>{cv.summary}</Text>
          <Text style={base.sectionTitle}>EXPERIENCE</Text>
          <Experience cv={cv} />
        </View>

        <View style={pro.side}>
          <Text style={pro.sideTitle}>CONTACT</Text>
          {[data.location, data.phone, data.email].filter(Boolean).map((item) => (
            <Text key={item} style={pro.sideItem}>{item}</Text>
          ))}

          <Text style={pro.sideTitle}>SKILLS</Text>
          {cv.skills.map((item) => <Text key={item} style={pro.sideItem}>{item}</Text>)}

          <Text style={pro.sideTitle}>LANGUAGES</Text>
          {cv.languages.map((item) => <Text key={item} style={pro.sideItem}>{item}</Text>)}

          <Text style={pro.sideTitle}>EDUCATION</Text>
          {cv.education.map((item) => <Text key={item} style={pro.sideItem}>{item}</Text>)}
        </View>
      </View>
    </Page>
  );
}

export function CvDocument({ data, template }: { data: CvData; template: CvTemplate }) {
  return (
    <Document title={`${data.name} — CV`} author={data.name} subject={data.position}>
      {template === 'europass' ? (
        <Europass data={data} />
      ) : template === 'professional' ? (
        <Professional data={data} />
      ) : (
        <Standard data={data} />
      )}
    </Document>
  );
}
