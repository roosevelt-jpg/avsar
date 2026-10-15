import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src/lib/cms/defaults', 'src/lib/jobs/sample.ts', 'src/lib/data/position-copy.ts'];
const files = [];
for (const root of roots) {
  if (root.endsWith('.ts')) files.push(root);
  else for (const name of readdirSync(root)) if (name.endsWith('.ts') && name !== 'make.ts' && name !== 'index.ts') files.push(join(root, name));
}

const strings = new Set();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const sliced = file.endsWith('position-copy.ts') ? text.slice(0, text.indexOf('const hi')) : text;
  for (const match of sliced.matchAll(/'((?:\\.|[^'\\\r\n])*)'/g)) {
    const value = match[1].replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"');
    if (value.length < 2) continue;
    if (value.startsWith('/') || value.startsWith('http') || value.startsWith('mailto:') || value.startsWith('.') || value.startsWith('@')) continue;
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) continue;
    if (/^\{\{[a-z0-9_]+\}\}$/.test(value)) continue;
    if (/^[a-z0-9-]+$/.test(value)) continue;
    if (['video', 'image', 'none', 'left', 'right', 'dark', 'light', 'accent', 'info', 'warning', 'narrow', 'wide', 'full_time', 'month', 'published'].includes(value)) continue;
    strings.add(value);
  }
}

const ui = [
  'Featured', 'Visa support', 'openings', 'Housing provided', 'Help finding housing', 'Housing not included',
  'Full time', 'Part time', 'Seasonal', 'Fixed-term contract', 'Search jobs', 'Job title, skill or city', 'Role',
  'All roles', 'City', 'All cities', 'Search', 'open job', 'open jobs', 'matching your search', 'Clear filters',
  'No jobs match this search right now.', 'Try another role or city, or create your profile and we will tell you when one opens.',
  'See all jobs', 'Create my profile', 'Salary', 'Discussed at interview', 'Location', 'Contract', 'months', 'Housing',
  'meals included', 'Experience', 'years', 'No minimum', 'English', 'or above', 'Basic', 'Visa',
  'Employer supports the work visa', 'You need the right to work', 'Openings',
  'This job is no longer taking applications. See similar jobs below.', 'About the job', 'What you will do',
  'What the employer is looking for', 'What you get', 'Free to apply. No placement fee.',
  'You never pay to be hired. If anyone asks you for money for this job outside this website, it is not us.',
  'How to stay safe', 'Similar jobs', 'Jobs', 'Property management', 'Cleaning', 'Food and beverage', 'Trades and logistics',
  'IT', 'Chef', 'Food and beverage service', 'Cleaner', 'Driver', 'Logistics', 'Construction worker', 'Electrician',
  'Plumber', 'Welder', 'Data analyst', 'QA tester',
];
for (const line of ui) strings.add(line);

const list = [...strings].sort((a, b) => a.localeCompare(b));
writeFileSync('scripts/copy-sources.json', JSON.stringify(list, null, 2));
console.log(list.length);
