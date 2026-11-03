/**
 * Paints the real mobile pages into the glass of the homepage photographs.
 * The desk, hands and phone frame stay. Only screen-coloured pixels are replaced.
 */
import sharp from 'sharp';

const NAVY = '#16324f';
const PAPER = '#f4f8fb';
const INK = '#16324f';
const MUTED = '#5c6e82';
const LINE = '#d5e2ee';
const FIELD = '#ffffff';

function screenSvg(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
  <rect width="390" height="844" fill="${PAPER}"/>
  ${body}
</svg>`;
}

const signup = screenSvg(`
  <text x="28" y="78" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="${NAVY}">S&amp;A Recruitment</text>
  <text x="28" y="132" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="650" fill="${INK}">Create your account</text>
  <text x="28" y="188" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="${MUTED}">Full name</text>
  <text x="28" y="208" font-family="Segoe UI, Arial, sans-serif" font-size="12" fill="${MUTED}">as on passport</text>
  <rect x="28" y="220" width="334" height="52" rx="12" fill="${FIELD}" stroke="${LINE}"/>
  <text x="28" y="304" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="${MUTED}">Mobile number</text>
  <rect x="28" y="316" width="334" height="52" rx="12" fill="${FIELD}" stroke="${LINE}"/>
  <text x="44" y="348" font-family="Segoe UI, Consolas, monospace" font-size="16" fill="${INK}">IN +91</text>
  <text x="28" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="${MUTED}">Email</text>
  <rect x="28" y="412" width="334" height="52" rx="12" fill="${FIELD}" stroke="${LINE}"/>
  <rect x="28" y="492" width="334" height="54" rx="14" fill="${NAVY}"/>
  <text x="195" y="525" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="650" fill="${PAPER}">Continue</text>
  <text x="28" y="580" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="${MUTED}">Free to join. You do not pay to open an account.</text>
`);

const assessment = screenSvg(`
  <rect width="390" height="64" fill="${PAPER}"/>
  <text x="28" y="40" font-family="Segoe UI, Consolas, monospace" font-size="13" fill="${MUTED}">ASSESSMENT</text>
  <text x="362" y="40" text-anchor="end" font-family="Segoe UI, Consolas, monospace" font-size="13" fill="${NAVY}">89:41</text>
  <text x="28" y="108" font-family="Segoe UI, Consolas, monospace" font-size="13" fill="${MUTED}">ENGLISH · READING</text>
  <text x="362" y="108" text-anchor="end" font-family="Segoe UI, Consolas, monospace" font-size="13" fill="${MUTED}">1 / 4</text>
  <rect x="28" y="124" width="334" height="6" rx="3" fill="${LINE}"/>
  <rect x="28" y="124" width="84" height="6" rx="3" fill="${NAVY}"/>
  <rect x="28" y="152" width="334" height="92" rx="16" fill="#ffffff" stroke="${LINE}"/>
  <text x="44" y="186" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="${INK}">Our flight lands at 23:40.</text>
  <text x="44" y="210" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="${INK}">Please keep our room.</text>
  <text x="28" y="286" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="650" fill="${INK}">What should reception do?</text>
  ${['Cancel the booking', 'Hold the room for a late arrival', 'Move the guest to another hotel', 'Charge a no-show fee']
    .map((label, i) => {
      const y = 314 + i * 68;
      return `<rect x="28" y="${y}" width="334" height="58" rx="12" fill="#ffffff" stroke="${LINE}"/>
        <text x="48" y="${y + 36}" font-family="Segoe UI, Consolas, monospace" font-size="14" fill="${MUTED}">${'ABCD'[i]}</text>
        <text x="78" y="${y + 36}" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="${INK}">${label}</text>`;
    })
    .join('')}
`);

const jobs = screenSvg(`
  <rect width="390" height="72" fill="${NAVY}"/>
  <text x="28" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="${PAPER}">S&amp;A Recruitment</text>
  <text x="28" y="118" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="650" fill="${INK}">Jobs</text>
  <rect x="28" y="148" width="334" height="52" rx="14" fill="#ffffff" stroke="${LINE}"/>
  <text x="48" y="180" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="${MUTED}">Job title, skill or city</text>
  <rect x="28" y="214" width="334" height="52" rx="14" fill="#ffffff" stroke="${LINE}"/>
  <text x="48" y="246" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="${INK}">All roles</text>
  <rect x="28" y="280" width="334" height="54" rx="14" fill="${NAVY}"/>
  <text x="195" y="314" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="650" fill="${PAPER}">Search</text>
`);

/* public/photos/phone.jpg stays black. The glass is a reflection between two
   hands, so a flat page painted into it covered the fingers and the table. */
const pricing = screenSvg(`
  <rect width="390" height="72" fill="${NAVY}"/>
  <text x="28" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="${PAPER}">S&amp;A Recruitment</text>
  <text x="28" y="124" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="650" fill="${INK}">Report prices</text>
  <text x="28" y="160" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="${MUTED}">Joining the database is free.</text>
  <rect x="28" y="188" width="334" height="250" rx="20" fill="${NAVY}"/>
  <text x="48" y="228" font-family="Segoe UI, Consolas, monospace" font-size="13" fill="#d5e2ee">CANDIDATES</text>
  <text x="48" y="278" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="700" fill="${PAPER}">€20</text>
  <text x="48" y="312" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#d5e2ee">both reports together</text>
  <text x="48" y="360" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="${PAPER}">Skills report €10</text>
  <text x="48" y="388" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="${PAPER}">Visa requirements €15</text>
`);

function solve(src, dst) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const x = dst[i].x;
    const y = dst[i].y;
    const X = src[i].x;
    const Y = src[i].y;
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    b.push(Y);
  }
  const n = 8;
  const m = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const div = m[col][col];
    for (let c = col; c <= n; c++) m[col][c] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r][col];
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
    }
  }
  return m.map((row) => row[n]);
}

function inset(corners, amount) {
  const cx = corners.reduce((sum, point) => sum + point.x, 0) / 4;
  const cy = corners.reduce((sum, point) => sum + point.y, 0) / 4;
  return corners.map((point) => ({
    x: point.x + (cx - point.x) * amount,
    y: point.y + (cy - point.y) * amount,
  }));
}

function isSkin(r, g, b) {
  return r - g >= 25 && r - b >= 40 && r > 90 && r < 250 && g + 8 > b;
}

function insideQuad(x, y, quad) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = quad[i];
    const b = quad[(i + 1) % 4];
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (Math.abs(cross) < 0.5) continue;
    const next = Math.sign(cross);
    if (sign === 0) sign = next;
    else if (next !== sign) return false;
  }
  return true;
}

function sample(data, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width - 1 || y >= height - 1) return null;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const dx = x - x0;
  const dy = y - y0;
  const at = (px, py) => {
    const i = (py * width + px) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const a = at(x0, y0);
  const b = at(x0 + 1, y0);
  const c = at(x0, y0 + 1);
  const d = at(x0 + 1, y0 + 1);
  return [0, 1, 2].map(
    (channel) =>
      a[channel] * (1 - dx) * (1 - dy) +
      b[channel] * dx * (1 - dy) +
      c[channel] * (1 - dx) * dy +
      d[channel] * dx * dy,
  );
}

function isDarkGlass(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (r + g + b) / 3;
  return l < 55 && max - min < 32 && l > 6;
}

async function paint(source, dest, svg, corners, mode, maxFinger) {
  const screen = await sharp(Buffer.from(svg)).png().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const photo = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const sw = screen.info.width;
  const sh = screen.info.height;
  const pw = photo.info.width;
  const ph = photo.info.height;
  const src = [
    { x: 0, y: 0 },
    { x: sw - 1, y: 0 },
    { x: sw - 1, y: sh - 1 },
    { x: 0, y: sh - 1 },
  ];
  /* A hair outside the measured glass so the old screen does not leave a rim. */
  const quad = inset(corners, mode === 'apply' ? 0 : -0.008);
  const h = solve(src, quad);
  const out = Buffer.from(photo.data);
  const minX = Math.max(0, Math.floor(Math.min(...quad.map((p) => p.x)) - 2));
  const maxX = Math.min(pw - 1, Math.ceil(Math.max(...quad.map((p) => p.x)) + 2));
  const minY = Math.max(0, Math.floor(Math.min(...quad.map((p) => p.y)) - 2));
  const maxY = Math.min(ph - 1, Math.ceil(Math.max(...quad.map((p) => p.y)) + 2));
  const inside = new Uint8Array(pw * ph);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (insideQuad(x, y, quad)) inside[y * pw + x] = 1;
    }
  }
  /* A finger counts only when the hand continues outside the glass. A warm
     photograph already on the screen does not. */
  const finger = new Uint8Array(pw * ph);
  const queue = [];
  for (let y = Math.max(0, minY - 6); y <= Math.min(ph - 1, maxY + 6); y++) {
    for (let x = Math.max(0, minX - 6); x <= Math.min(pw - 1, maxX + 6); x++) {
      const id = y * pw + x;
      if (inside[id]) continue;
      const i = id * 4;
      if (!isSkin(photo.data[i], photo.data[i + 1], photo.data[i + 2])) continue;
      let touchesGlass = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
        if (inside[ny * pw + nx]) touchesGlass = true;
      }
      if (!touchesGlass) continue;
      finger[id] = 1;
      queue.push(0, x, y);
    }
  }
  while (queue.length) {
    const y = queue.pop();
    const x = queue.pop();
    const dist = queue.pop();
    if (dist >= maxFinger) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
      const id = ny * pw + nx;
      if (!inside[id] || finger[id]) continue;
      const i = id * 4;
      if (!isSkin(photo.data[i], photo.data[i + 1], photo.data[i + 2])) continue;
      finger[id] = 1;
      queue.push(dist + 1, nx, ny);
    }
  }
  /* Catch the bright edge of a finger without stepping onto the white page. */
  const grown = new Uint8Array(finger);
  for (let pass = 0; pass < 5; pass++) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const id = y * pw + x;
        if (!inside[id] || grown[id]) continue;
        let near = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
          if (finger[ny * pw + nx]) near = true;
        }
        if (!near) continue;
        const i = id * 4;
        const r = photo.data[i];
        const g = photo.data[i + 1];
        const b = photo.data[i + 2];
        if (r + 6 < g || Math.max(r, g, b) - Math.min(r, g, b) < 14) continue;
        grown[id] = 1;
      }
    }
    finger.set(grown);
  }
  let painted = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const id = y * pw + x;
      if (!inside[id] || finger[id]) continue;
      if (mode === 'dark') {
        const pi = id * 4;
        if (!isDarkGlass(photo.data[pi], photo.data[pi + 1], photo.data[pi + 2])) continue;
      }
      const w = h[6] * x + h[7] * y + 1;
      const sx = (h[0] * x + h[1] * y + h[2]) / w;
      const sy = (h[3] * x + h[4] * y + h[5]) / w;
      if (sx < 1 || sy < 1 || sx >= sw - 2 || sy >= sh - 2) continue;
      const pixel = sample(screen.data, sw, sh, sx, sy);
      if (!pixel) continue;
      const i = id * 4;
      const shade = 0.94;
      out[i] = pixel[0] * shade;
      out[i + 1] = pixel[1] * shade;
      out[i + 2] = pixel[2] * shade;
      painted++;
    }
  }
  if (mode === 'apply') {
    const paintedMask = new Uint8Array(pw * ph);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const i = (y * pw + x) * 4;
        if (out[i] !== photo.data[i] || out[i + 1] !== photo.data[i + 1] || out[i + 2] !== photo.data[i + 2]) {
          paintedMask[y * pw + x] = 1;
        }
      }
    }
    for (let pass = 0; pass < 8; pass++) {
      const add = [];
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const id = y * pw + x;
          if (paintedMask[id] || finger[id]) continue;
          let near = false;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
            if (paintedMask[ny * pw + nx]) near = true;
          }
          if (!near) continue;
          const i = id * 4;
          const r = photo.data[i];
          const g = photo.data[i + 1];
          const b = photo.data[i + 2];
          const l = (r + g + b) / 3;
          const sat = Math.max(r, g, b) - Math.min(r, g, b);
          if (l < 42 && sat < 30) continue;
          if (isSkin(r, g, b)) continue;
          const w = h[6] * x + h[7] * y + 1;
          const sx = (h[0] * x + h[1] * y + h[2]) / w;
          const sy = (h[3] * x + h[4] * y + h[5]) / w;
          if (sx < 1 || sy < 1 || sx >= sw - 2 || sy >= sh - 2) continue;
          const pixel = sample(screen.data, sw, sh, sx, sy);
          if (!pixel) continue;
          add.push(id, pixel[0] * 0.94, pixel[1] * 0.94, pixel[2] * 0.94);
        }
      }
      for (let i = 0; i < add.length; i += 4) {
        const id = add[i];
        paintedMask[id] = 1;
        out[id * 4] = add[i + 1];
        out[id * 4 + 1] = add[i + 2];
        out[id * 4 + 2] = add[i + 3];
        painted++;
      }
    }
  }
  const next = `${dest}.next.jpg`;
  await sharp(out, { raw: { width: pw, height: ph, channels: 4 } })
    .jpeg({ quality: 90 })
    .toFile(next);
  const { renameSync } = await import('node:fs');
  renameSync(next, dest);
  console.log(dest, 'painted', painted);
}

const jobs_ = [
  {
    source: 'tmp-orig/profile.jpg',
    dest: 'public/photos/steps/profile.jpg',
    svg: signup,
    mode: 'light',
    maxFinger: 180,
    corners: [
      { x: 689, y: 166 },
      { x: 851, y: 185 },
      { x: 752, y: 510 },
      { x: 573, y: 523 },
    ],
  },
  {
    source: 'tmp-orig/test.jpg',
    dest: 'public/photos/steps/test.jpg',
    svg: assessment,
    mode: 'light',
    maxFinger: 0,
    corners: [
      { x: 560, y: 166 },
      { x: 857, y: 189 },
      { x: 596, y: 575 },
      { x: 270, y: 503 },
    ],
  },
  {
    source: 'tmp-orig/apply.jpg',
    dest: 'public/photos/steps/apply.jpg',
    svg: jobs,
    mode: 'apply',
    maxFinger: 48,
    corners: [
      { x: 348, y: 168 },
      { x: 648, y: 128 },
      { x: 872, y: 520 },
      { x: 570, y: 572 },
    ],
  },
];

for (const job of jobs_) {
  await paint(job.source, job.dest, job.svg, job.corners, job.mode, job.maxFinger);
}

void pricing;
