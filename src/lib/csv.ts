/**
 * CSV for spreadsheets that staff will open in Excel or Google Sheets.
 *
 * Candidate-entered text (names, notes, cities) ends up in cells, and a cell
 * starting with = + - @ is run as a formula by Excel. Those are prefixed with
 * an apostrophe so they display as text. Rows end in CRLF and the file starts
 * with a BOM, which is what makes Excel read Hindi and Malayalam names as UTF-8.
 */

export type CsvValue = string | number | boolean | null | undefined;

export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvValue[][]): string {
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
