import { normalisePhone } from '@/lib/leads/phone';

/**
 * Reading a partner's spreadsheet into leads.
 *
 * Partners send what they have: a CSV exported from Excel or Google Sheets,
 * with their own column names, a byte-order mark, quoted cells with commas and
 * line breaks in them. This reads all of that without a library. Excel files
 * themselves are not accepted; "Save as CSV" is one click and keeps a parser
 * for a binary format out of the server.
 */

export const IMPORT_MAX_ROWS = 2000;
export const IMPORT_MAX_BYTES = 1_000_000;

/** RFC 4180: quoted fields, doubled quotes, CRLF or LF, commas or semicolons. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '');
  const firstLine = source.slice(0, source.search(/\r?\n/) === -1 ? undefined : source.search(/\r?\n/));
  /* European Excel exports with semicolons. Whichever appears more in the
     header row is the separator. */
  const separator = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell === '') quoted = true;
    else if (ch === separator) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

type Field = 'fullName' | 'firstName' | 'lastName' | 'email' | 'phone' | 'position' | 'city' | 'whatsappOk' | 'message';

/* Lower-cased, punctuation stripped. What partners actually call the columns. */
const ALIASES: Record<string, Field> = {
  name: 'fullName', fullname: 'fullName', candidatename: 'fullName', candidate: 'fullName',
  firstname: 'firstName', givenname: 'firstName', first: 'firstName',
  lastname: 'lastName', surname: 'lastName', familyname: 'lastName', last: 'lastName',
  email: 'email', emailaddress: 'email', mail: 'email', emailid: 'email',
  phone: 'phone', mobile: 'phone', mobileno: 'phone', mobilenumber: 'phone', phonenumber: 'phone',
  whatsapp: 'phone', whatsappnumber: 'phone', contact: 'phone', contactnumber: 'phone', tel: 'phone',
  position: 'position', role: 'position', trade: 'position', job: 'position', jobtitle: 'position', skill: 'position',
  city: 'city', location: 'city', town: 'city', place: 'city', state: 'city',
  whatsappok: 'whatsappOk', whatsappconsent: 'whatsappOk', whatsappoptin: 'whatsappOk', consent: 'whatsappOk',
  notes: 'message', note: 'message', remarks: 'message', comments: 'message', message: 'message',
};

export type ImportedLead = {
  fullName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  city: string | null;
  whatsappOk: boolean;
  message: string | null;
};

export type ImportProblem = { line: number; reason: string };

export type ImportResult = { leads: (ImportedLead & { line: number })[]; problems: ImportProblem[]; unmatchedColumns: string[] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function yes(value: string): boolean {
  return /^(y|yes|true|1|ok|haan|ha)$/i.test(value.trim());
}

function clip(value: string | undefined, max: number): string | null {
  const v = value?.trim().replace(/\s+/g, ' ');
  return v ? v.slice(0, max) : null;
}

/**
 * Header row in, leads and per-line problems out. Line numbers are as a
 * spreadsheet shows them (header = 1), so a partner can find the row.
 * Duplicates inside the file are dropped here; duplicates against leads
 * already stored are the caller's job, because only it can see the database.
 */
export function readLeadRows(rows: string[][]): ImportResult {
  const [header, ...body] = rows;
  if (!header) return { leads: [], problems: [{ line: 1, reason: 'The file is empty.' }], unmatchedColumns: [] };

  const columns = header.map((h) => ALIASES[h.toLowerCase().replace(/[^a-z]/g, '')] ?? null);
  const unmatchedColumns = header.filter((_, i) => columns[i] === null).map((h) => h.trim()).filter(Boolean);
  if (!columns.includes('phone') && !columns.includes('email')) {
    return { leads: [], problems: [{ line: 1, reason: 'No phone or email column was recognised in the header row.' }], unmatchedColumns };
  }

  const leads: ImportResult['leads'] = [];
  const problems: ImportProblem[] = [];
  const seen = new Set<string>();

  body.slice(0, IMPORT_MAX_ROWS).forEach((cells, index) => {
    const line = index + 2;
    const get = (field: Field) => {
      const at = columns.indexOf(field);
      return at === -1 ? undefined : cells[at];
    };

    const fullName =
      clip(get('fullName'), 120) ?? clip([get('firstName'), get('lastName')].filter(Boolean).join(' '), 120);
    const rawEmail = clip(get('email'), 254)?.toLowerCase() ?? null;
    const email = rawEmail && EMAIL.test(rawEmail) ? rawEmail : null;
    const rawPhone = get('phone');
    const phone = normalisePhone(rawPhone);

    if (!fullName) return problems.push({ line, reason: 'No name.' });
    if (rawPhone?.trim() && !phone && !email) return problems.push({ line, reason: `"${rawPhone.trim()}" is not a phone number we can read.` });
    if (!phone && !email) return problems.push({ line, reason: 'No phone or email.' });

    const key = phone ?? email!;
    if (seen.has(key)) return problems.push({ line, reason: 'Same person as an earlier line in this file.' });
    seen.add(key);

    const consent = get('whatsappOk');
    leads.push({
      line,
      fullName,
      email,
      phone,
      position: clip(get('position'), 120),
      city: clip(get('city'), 120),
      whatsappOk: consent ? yes(consent) : false,
      message: clip(get('message'), 4000),
    });
  });

  if (body.length > IMPORT_MAX_ROWS) {
    problems.push({ line: IMPORT_MAX_ROWS + 2, reason: `Only the first ${IMPORT_MAX_ROWS} rows are read. Split the file and import the rest.` });
  }
  return { leads, problems, unmatchedColumns };
}
