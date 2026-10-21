/**
 * One-off: turn docs/dashboards.md into a Word file.
 * Run: node scripts/md-to-docx.mjs
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const md = readFileSync(join(root, 'docs', 'dashboards.md'), 'utf8');
const outDir = join(root, 'docs', '.docx-build');
const outFile = join(root, 'docs', 'dashboards.docx');

function esc(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/** Inline **bold** and `code`. */
function runs(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push({ t: text.slice(last, match.index) });
    const token = match[0];
    if (token.startsWith('**')) parts.push({ t: token.slice(2, -2), b: true });
    else parts.push({ t: token.slice(1, -1), code: true });
    last = match.index + token.length;
  }
  if (last < text.length) parts.push({ t: text.slice(last) });
  return parts
    .map((part) => {
      const rPr = [
        part.b ? '<w:b/>' : '',
        part.code ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="20"/>' : '',
      ].join('');
      return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(part.t)}</w:t></w:r>`;
    })
    .join('');
}

function p(text, style) {
  const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : '';
  return `<w:p>${pPr}${runs(text)}</w:p>`;
}

function cell(text, header) {
  const shade = header ? '<w:shd w:val="clear" w:color="auto" w:fill="F4F1EC"/>' : '';
  return `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>${shade}</w:tcPr>${p(text, header ? 'TableHeader' : undefined)}</w:tc>`;
}

function table(rows) {
  const body = rows
    .map((row, i) => `<w:tr>${row.map((c) => cell(c, i === 0)).join('')}</w:tr>`)
    .join('');
  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="D9D3CB"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="D9D3CB"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="D9D3CB"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="D9D3CB"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="D9D3CB"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="D9D3CB"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="60" w:type="dxa"/>
        <w:left w:w="80" w:type="dxa"/>
        <w:bottom w:w="60" w:type="dxa"/>
        <w:right w:w="80" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    ${body}
  </w:tbl>`;
}

function parseCells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function isRule(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

const blocks = [];
const lines = md.replace(/\r\n/g, '\n').split('\n');
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  if (line.trim() === '' ) {
    i += 1;
    continue;
  }
  if (line.trim() === '---') {
    i += 1;
    continue;
  }
  if (line.startsWith('```')) {
    const code = [];
    i += 1;
    while (i < lines.length && !lines[i].startsWith('```')) {
      code.push(lines[i]);
      i += 1;
    }
    i += 1;
    blocks.push({ type: 'code', text: code.join('\n') });
    continue;
  }
  if (line.trim().startsWith('|')) {
    const rows = [];
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      if (!isRule(lines[i])) rows.push(parseCells(lines[i]));
      i += 1;
    }
    blocks.push({ type: 'table', rows });
    continue;
  }
  if (line.startsWith('### ')) {
    blocks.push({ type: 'h3', text: line.slice(4) });
    i += 1;
    continue;
  }
  if (line.startsWith('## ')) {
    blocks.push({ type: 'h2', text: line.slice(3) });
    i += 1;
    continue;
  }
  if (line.startsWith('# ')) {
    blocks.push({ type: 'h1', text: line.slice(2) });
    i += 1;
    continue;
  }
  if (line.startsWith('- ')) {
    const items = [];
    while (i < lines.length && lines[i].startsWith('- ')) {
      items.push(lines[i].slice(2));
      i += 1;
    }
    blocks.push({ type: 'ul', items });
    continue;
  }
  if (/^\d+\. /.test(line)) {
    const items = [];
    while (i < lines.length && /^\d+\. /.test(lines[i])) {
      items.push(lines[i].replace(/^\d+\. /, ''));
      i += 1;
    }
    blocks.push({ type: 'ol', items });
    continue;
  }
  const para = [line];
  i += 1;
  while (
    i < lines.length &&
    lines[i].trim() !== '' &&
    !lines[i].startsWith('#') &&
    !lines[i].startsWith('|') &&
    !lines[i].startsWith('- ') &&
    !lines[i].startsWith('```') &&
    lines[i].trim() !== '---' &&
    !/^\d+\. /.test(lines[i])
  ) {
    para.push(lines[i]);
    i += 1;
  }
  blocks.push({ type: 'p', text: para.join(' ') });
}

const body = blocks
  .map((block) => {
    if (block.type === 'h1') return p(block.text, 'Heading1');
    if (block.type === 'h2') return p(block.text, 'Heading2');
    if (block.type === 'h3') return p(block.text, 'Heading3');
    if (block.type === 'p') return p(block.text);
    if (block.type === 'ul') {
      return block.items
        .map(
          (item) =>
            `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${runs(item)}</w:p>`,
        )
        .join('');
    }
    if (block.type === 'ol') {
      return block.items
        .map(
          (item) =>
            `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr>${runs(item)}</w:p>`,
        )
        .join('');
    }
    if (block.type === 'table') return table(block.rows);
    if (block.type === 'code') {
      return block.text
        .split('\n')
        .map(
          (line) =>
            `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/></w:rPr><w:t xml:space="preserve">${esc(line || ' ')}</w:t></w:r></w:p>`,
        )
        .join('');
    }
    return '';
  })
  .join('');

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
    <w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="360" w:after="200"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="1B1A17"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1B1A17"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="3D3A36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="720"/><w:spacing w:after="60"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="TableHeader">
    <w:name w:val="Table Header"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="0"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Code">
    <w:name w:val="Code"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:shd w:val="clear" w:color="auto" w:fill="F7F5F2"/></w:pPr>
    <w:rPr><w:sz w:val="18"/></w:rPr>
  </w:style>
</w:styles>`;

const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, '_rels'), { recursive: true });
mkdirSync(join(outDir, 'word', '_rels'), { recursive: true });
writeFileSync(join(outDir, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`);
writeFileSync(join(outDir, '_rels', '.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
writeFileSync(join(outDir, 'word', 'document.xml'), documentXml);
writeFileSync(join(outDir, 'word', 'styles.xml'), stylesXml);
writeFileSync(join(outDir, 'word', 'numbering.xml'), numberingXml);
writeFileSync(join(outDir, 'word', '_rels', 'document.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`);

rmSync(outFile, { force: true });
const q = (value) => `'${value.replaceAll("'", "''")}'`;
const ps = `
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open(${q(outFile)}, 'Create')
Get-ChildItem -Path ${q(outDir)} -Recurse -File | ForEach-Object {
  $name = $_.FullName.Substring(${q(outDir)}.Length).TrimStart('\\','/').Replace('\\','/')
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $name) | Out-Null
}
$zip.Dispose()
`;
execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
rmSync(outDir, { recursive: true, force: true });
console.log(outFile);
