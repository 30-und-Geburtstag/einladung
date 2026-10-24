// Skizze: Grundriss-Editor für den Gewölbekeller (Reiter „Skizze“ auf der Kalkulationsseite).
// Alle Maße in Zentimetern. Gespeichert als K.daten.skizze zusammen mit der Kalkulation.

const SK_EBENEN = [['raum', 'Raum'], ['moebel', 'Möbel'], ['licht', 'Licht'], ['ton', 'Ton'], ['sicherheit', 'Strom & Sicherheit'], ['text', 'Beschriftung']];
const SK_FARBEN = [['#F2C46B', 'Gold'], ['#F29A38', 'Amber'], ['#FFE2A8', 'Warmweiß'], ['#EEF3FF', 'Kaltweiß'], ['#4F8FE0', 'Blau'],
  ['#4FC3D9', 'Türkis'], ['#E0569B', 'Pink'], ['#E05A4A', 'Rot'], ['#5DBB7A', 'Grün'], ['#9B6BE0', 'Lila'], ['#B8894A', 'Holz'], ['#8F7A5C', 'Stein']];
const SK_FORMEN = [['rechteck', 'Rechteck'], ['kreis', 'Kreis'], ['raute', 'Raute'], ['dreieck', 'Dreieck']];

const skEsc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const skN = n => Math.round(n * 10) / 10;
const skHell = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return true; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.5; };
const skId = () => 'o' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6);

// ------------------------------------------------------------- Symbole
// zeichnen(o) liefert SVG im eigenen Koordinatensystem: Mitte = 0/0, Breite b (x), Tiefe t (y), „vorne“ = oben (−y).

const SK_HOLZ = '#B8894A', SK_HOLZ_RAND = '#E2BD85', SK_BODEN = '#221C14', SK_STEIN_RAND = '#8F7A5C';
const rechteck = (o, fill, stroke, sw = 1.5, rx = 3) => `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const mitteText = (o, text, farbe, gr) => `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="${gr}" font-weight="600" fill="${farbe}" font-family="Jost, sans-serif">${skEsc(text)}</text>`;

const SK_SYMBOLE = {
  // Raum
  raum: { name: 'Raum (Grundfläche)', kat: 'Raum', ebene: 'raum', flaeche: true },
  mauer: { name: 'Mauer / Wandzug', kat: 'Raum', ebene: 'raum', linie: true },
  wand: { name: 'Mauerstück', kat: 'Raum', ebene: 'raum', b: 100, t: 40, zeichnen: o => rechteck(o, 'url(#sk-stein)', SK_STEIN_RAND, 2, 2) },
  pfeiler: { name: 'Pfeiler', kat: 'Raum', ebene: 'raum', b: 70, t: 70, zeichnen: o => rechteck(o, 'url(#sk-stein)', SK_STEIN_RAND, 2, 2) },
  bogen: { name: 'Bogen / Durchgang', kat: 'Raum', ebene: 'raum', b: 140, t: 80, zeichnen: o =>
    `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" fill="#2B2419"/><rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" fill="url(#sk-platten)"/>` +
    `<line x1="${-o.b / 2}" y1="${-o.t / 2}" x2="${-o.b / 2}" y2="${o.t / 2}" stroke="${SK_STEIN_RAND}" stroke-width="6"/>` +
    `<line x1="${o.b / 2}" y1="${-o.t / 2}" x2="${o.b / 2}" y2="${o.t / 2}" stroke="${SK_STEIN_RAND}" stroke-width="6"/>` +
    `<line x1="${-o.b / 2}" y1="${-o.t / 2}" x2="${o.b / 2}" y2="${-o.t / 2}" stroke="#C9A15A" stroke-width="1.5" stroke-dasharray="8 6"/>` +
    `<line x1="${-o.b / 2}" y1="${o.t / 2}" x2="${o.b / 2}" y2="${o.t / 2}" stroke="#C9A15A" stroke-width="1.5" stroke-dasharray="8 6"/>` },
  balken: { name: 'Balken / Träger', kat: 'Raum', ebene: 'raum', b: 300, t: 25, zeichnen: o =>
    `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" fill="rgba(201,161,90,.12)" stroke="#C9A15A" stroke-width="2" stroke-dasharray="14 8"/>` +
    `<line x1="${-o.b / 2}" y1="0" x2="${o.b / 2}" y2="0" stroke="#C9A15A" stroke-width="1" stroke-dasharray="4 6"/>` },
  tuer: { name: 'Tür', kat: 'Raum', ebene: 'raum', b: 100, t: 30, zeichnen: o =>
    `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" fill="${SK_BODEN}" stroke="#CFC2A6" stroke-width="1.5"/>` +
    `<line x1="${-o.b / 2}" y1="${-o.t / 2}" x2="${-o.b / 2}" y2="${-o.t / 2 - o.b}" stroke="#CFC2A6" stroke-width="4"/>` +
    `<path d="M ${o.b / 2} ${-o.t / 2} A ${o.b} ${o.b} 0 0 0 ${-o.b / 2} ${-o.t / 2 - o.b}" fill="none" stroke="#CFC2A6" stroke-width="1.5" stroke-dasharray="6 5"/>` },
  notausgang: { name: 'Notausgang', kat: 'Raum', ebene: 'sicherheit', b: 90, t: 30, zeichnen: o =>
    rechteck(o, '#2F8F5B', '#9FE0B8', 1.5) + mitteText(o, 'EXIT', '#F4FFF8', Math.min(o.t * 0.7, o.b / 3)) },
  fenster: { name: 'Fenster', kat: 'Raum', ebene: 'raum', b: 120, t: 16, zeichnen: o =>
    rechteck(o, 'rgba(143,184,216,.45)', '#BFE0F5', 1.5, 1) + `<line x1="${-o.b / 2}" y1="0" x2="${o.b / 2}" y2="0" stroke="#BFE0F5" stroke-width="1"/>` },
  treppe: { name: 'Treppe', kat: 'Raum', ebene: 'raum', b: 110, t: 250, zeichnen: o => {
    let s = rechteck(o, '#2A241C', '#CFC2A6', 1.5, 1);
    for (let y = -o.t / 2 + 28; y < o.t / 2; y += 28) s += `<line x1="${-o.b / 2}" y1="${y}" x2="${o.b / 2}" y2="${y}" stroke="#8F7A5C" stroke-width="1.5"/>`;
    return s + `<path d="M 0 ${o.t / 2 - 15} L 0 ${-o.t / 2 + 20} M -12 ${-o.t / 2 + 34} L 0 ${-o.t / 2 + 20} L 12 ${-o.t / 2 + 34}" fill="none" stroke="#E2BD85" stroke-width="3"/>`;
  } },
  nische: { name: 'Nische', kat: 'Raum', ebene: 'raum', b: 120, t: 40, zeichnen: o =>
    `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" rx="${Math.min(o.b, o.t) / 2}" fill="#2A231B" stroke="#C9A15A" stroke-width="1.5" stroke-dasharray="6 5"/>` },

  // Möbel
  tisch: { name: 'Tisch', kat: 'Möbel', ebene: 'moebel', b: 200, t: 80, farbe: SK_HOLZ, textMitte: true, zeichnen: o =>
    rechteck(o, o.farbe || SK_HOLZ, SK_HOLZ_RAND, 1.5) + `<rect x="${-o.b / 2 + 6}" y="${-o.t / 2 + 6}" width="${Math.max(0, o.b - 12)}" height="${Math.max(0, o.t - 12)}" rx="2" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>` },
  tischrund: { name: 'Runder Tisch', kat: 'Möbel', ebene: 'moebel', b: 120, t: 120, rund: true, farbe: SK_HOLZ, textMitte: true, zeichnen: o =>
    `<ellipse cx="0" cy="0" rx="${o.b / 2}" ry="${o.t / 2}" fill="${o.farbe || SK_HOLZ}" stroke="${SK_HOLZ_RAND}" stroke-width="1.5"/>` },
  stehtisch: { name: 'Stehtisch', kat: 'Möbel', ebene: 'moebel', b: 70, t: 70, rund: true, farbe: '#C9A15A', zeichnen: o =>
    `<ellipse cx="0" cy="0" rx="${o.b / 2}" ry="${o.t / 2}" fill="${o.farbe || '#C9A15A'}" stroke="${SK_HOLZ_RAND}" stroke-width="1.5"/><ellipse cx="0" cy="0" rx="${o.b / 6}" ry="${o.t / 6}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>` },
  bank: { name: 'Bank (Lehne oben)', kat: 'Möbel', ebene: 'moebel', b: 200, t: 45, farbe: '#7A5A2E', zeichnen: o =>
    rechteck(o, o.farbe || '#7A5A2E', '#A8875A', 1.5, 2) + `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${Math.min(10, o.t / 3)}" fill="#4A3520" stroke="#A8875A" stroke-width="1"/>` },
  stuhl: { name: 'Stuhl (Lehne oben)', kat: 'Möbel', ebene: 'moebel', b: 45, t: 45, zeichnen: o =>
    `<rect x="${-o.b / 2}" y="${-o.t / 2 + 7}" width="${o.b}" height="${Math.max(0, o.t - 7)}" rx="3" fill="#2A231B" stroke="#8F7A5C" stroke-width="1.2"/>` +
    `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="8" rx="2" fill="#15110C" stroke="#8F7A5C" stroke-width="1.2"/>` },
  theke: { name: 'Theke', kat: 'Möbel', ebene: 'moebel', b: 300, t: 70, farbe: '#5C4326', textMitte: true, zeichnen: o =>
    rechteck(o, o.farbe || '#5C4326', SK_HOLZ_RAND, 2) + `<rect x="${-o.b / 2 + 8}" y="${-o.t / 2 + 8}" width="${Math.max(0, o.b - 16)}" height="${Math.max(0, o.t - 16)}" fill="none" stroke="#8A6A40" stroke-width="1"/>` },
  arbeitstheke: { name: 'Arbeitsfläche', kat: 'Möbel', ebene: 'moebel', b: 200, t: 60, farbe: '#3B3128', textMitte: true, zeichnen: o => rechteck(o, o.farbe || '#3B3128', '#8F7A5C', 1.5, 2) },
  buffet: { name: 'Buffettisch', kat: 'Möbel', ebene: 'moebel', b: 200, t: 80, farbe: '#C9A15A', textMitte: true, zeichnen: o =>
    rechteck(o, o.farbe || '#C9A15A', SK_HOLZ_RAND, 1.5) + `<g fill="rgba(255,255,255,.35)">${[-0.3, 0, 0.3].map(f => `<ellipse cx="${f * o.b}" cy="0" rx="${Math.min(o.b / 9, o.t / 3)}" ry="${Math.min(o.b / 12, o.t / 4)}"/>`).join('')}</g>` },
  zapfanlage: { name: 'Zapfanlage', kat: 'Möbel', ebene: 'moebel', b: 26, t: 26, rund: true, zeichnen: o =>
    `<circle r="${o.b / 2}" fill="#2B2B2B" stroke="#D8D4CC" stroke-width="2"/><circle r="${o.b / 5}" fill="#E2BD85"/>` },
  kuehlschrank: { name: 'Kühlschrank', kat: 'Möbel', ebene: 'moebel', b: 60, t: 60, zeichnen: o => rechteck(o, '#C8D0D6', '#8A949C', 1.5, 2) + mitteText(o, 'K', '#3A444C', o.t * 0.5) },
  sofa: { name: 'Sofa / Lounge', kat: 'Möbel', ebene: 'moebel', b: 200, t: 90, farbe: '#5A3A4A', zeichnen: o =>
    rechteck(o, o.farbe || '#5A3A4A', '#A07A8A', 1.5, 10) + `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t * 0.28}" rx="8" fill="rgba(0,0,0,.25)"/>` },

  // Licht
  uplight: { name: 'Uplight (Akku)', kat: 'Licht', ebene: 'licht', b: 26, t: 26, rund: true, farbe: '#F2C46B', g: 150, schein: 'punkt', zeichnen: o =>
    `<circle r="${o.b / 2}" fill="${o.farbe || '#F2C46B'}" stroke="#1A1208" stroke-width="2"/><circle r="${o.b / 5}" fill="rgba(255,255,255,.75)"/>` },
  deckenleuchte: { name: 'Deckenleuchte (vorhanden)', kat: 'Licht', ebene: 'licht', b: 22, t: 22, rund: true, farbe: '#EEF3FF', g: 0, schein: 'punkt', zeichnen: o =>
    `<circle r="${o.b / 2}" fill="#2A2A2A" stroke="${o.farbe || '#EEF3FF'}" stroke-width="2"/><path d="M ${-o.b / 3} 0 H ${o.b / 3} M 0 ${-o.b / 3} V ${o.b / 3}" stroke="${o.farbe || '#EEF3FF'}" stroke-width="2"/>` },
  lichtbar: { name: 'Lichtbar (Partylicht)', kat: 'Licht', ebene: 'licht', b: 120, t: 22, farbe: '#E0569B', g: 380, schein: 'bar', zeichnen: o =>
    rechteck(o, '#1E1E1E', '#8A8A8A', 1.5, 3) + SK_BAR_FARBEN.map((f, i) => `<circle cx="${(-0.375 + i * 0.25) * o.b}" cy="0" r="${Math.min(o.t / 2.6, o.b / 10)}" fill="${f}"/>`).join('') },
  spot: { name: 'Scheinwerfer / Spot', kat: 'Licht', ebene: 'licht', b: 30, t: 30, rund: true, farbe: '#4FC3D9', g: 300, schein: 'kegel', zeichnen: o =>
    `<circle r="${o.b / 2}" fill="#2A2A2A" stroke="${o.farbe || '#4FC3D9'}" stroke-width="3"/><rect x="${-o.b / 6}" y="${-o.b / 2 - 6}" width="${o.b / 3}" height="8" fill="${o.farbe || '#4FC3D9'}"/>` },
  movinghead: { name: 'Moving Head', kat: 'Licht', ebene: 'licht', b: 40, t: 40, rund: true, farbe: '#9B6BE0', g: 350, schein: 'kegel', zeichnen: o =>
    `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" rx="6" fill="#222" stroke="#8A8A8A" stroke-width="1.5"/><circle r="${o.b / 3}" fill="#111" stroke="${o.farbe || '#9B6BE0'}" stroke-width="3"/>` },
  spiegelkugel: { name: 'Spiegelkugel', kat: 'Licht', ebene: 'licht', b: 40, t: 40, rund: true, farbe: '#F4F1EC', g: 0, schein: 'punkt', zeichnen: o =>
    `<circle r="${o.b / 2}" fill="url(#sk-kugel)" stroke="#F4F1EC" stroke-width="1.5"/><path d="M ${-o.b / 2} 0 H ${o.b / 2} M 0 ${-o.b / 2} V ${o.b / 2} M ${-o.b / 2.8} ${-o.b / 4} H ${o.b / 2.8} M ${-o.b / 2.8} ${o.b / 4} H ${o.b / 2.8}" stroke="rgba(40,40,40,.5)" stroke-width="1"/>` },
  laterne: { name: 'Laterne / Kerze', kat: 'Licht', ebene: 'licht', b: 18, t: 18, rund: true, farbe: '#F29A38', g: 45, schein: 'punkt', zeichnen: o =>
    `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" rx="3" fill="#2A1E12" stroke="#C9A15A" stroke-width="1.5"/><circle r="${o.b / 4}" fill="${o.farbe || '#F29A38'}"/>` },
  kette: { name: 'Lichterkette', kat: 'Licht', ebene: 'licht', linie: true, farbe: '#FFD08A', schein: 'kette' },

  // Ton
  box: { name: 'Lautsprecher (vorne oben)', kat: 'Ton', ebene: 'ton', b: 45, t: 38, zeichnen: o =>
    `<path d="M ${-o.b / 2} ${-o.t / 2} H ${o.b / 2} L ${o.b * 0.4} ${o.t / 2} H ${-o.b * 0.4} Z" fill="#262626" stroke="#CFC2A6" stroke-width="1.5"/>` +
    `<circle cx="0" cy="${-o.t * 0.08}" r="${Math.min(o.b, o.t) * 0.28}" fill="#111" stroke="#8A8A8A" stroke-width="1.5"/>` +
    `<path d="M ${-o.b * 0.35} ${-o.t / 2 - 10} Q 0 ${-o.t / 2 - 26} ${o.b * 0.35} ${-o.t / 2 - 10} M ${-o.b * 0.5} ${-o.t / 2 - 22} Q 0 ${-o.t / 2 - 46} ${o.b * 0.5} ${-o.t / 2 - 22}" fill="none" stroke="rgba(207,194,166,.55)" stroke-width="2"/>` },
  subwoofer: { name: 'Subwoofer', kat: 'Ton', ebene: 'ton', b: 55, t: 55, zeichnen: o =>
    rechteck(o, '#1D1D1D', '#CFC2A6', 1.5, 3) + `<circle r="${Math.min(o.b, o.t) * 0.34}" fill="#0E0E0E" stroke="#8A8A8A" stroke-width="2"/><circle r="${Math.min(o.b, o.t) * 0.1}" fill="#555"/>` },
  mischpult: { name: 'DJ / Mischpult', kat: 'Ton', ebene: 'ton', b: 100, t: 60, textMitte: false, zeichnen: o =>
    rechteck(o, '#2A2A2A', '#CFC2A6', 1.5, 4) + `<circle cx="${-o.b * 0.27}" cy="0" r="${Math.min(o.t * 0.3, o.b * 0.16)}" fill="#111" stroke="#E2BD85" stroke-width="1.5"/><circle cx="${o.b * 0.27}" cy="0" r="${Math.min(o.t * 0.3, o.b * 0.16)}" fill="#111" stroke="#E2BD85" stroke-width="1.5"/>` +
    `<g fill="#E0569B">${[-1, 0, 1].map(i => `<rect x="${i * 7 - 2}" y="${-o.t * 0.28}" width="4" height="${o.t * 0.56}" rx="2"/>`).join('')}</g>` },
  mikrofon: { name: 'Mikrofon', kat: 'Ton', ebene: 'ton', b: 16, t: 16, rund: true, zeichnen: o =>
    `<circle r="${o.b / 2}" fill="#9A9A9A" stroke="#E8E8E8" stroke-width="1.5"/><line x1="0" y1="${o.b / 2}" x2="0" y2="${o.b * 1.4}" stroke="#9A9A9A" stroke-width="3"/>` },

  // Strom & Sicherheit
  steckdose: { name: 'Steckdose', kat: 'Strom & Sicherheit', ebene: 'sicherheit', b: 18, t: 18, zeichnen: o =>
    rechteck(o, '#F0ECE4', '#8A8A8A', 1.2, 2) + `<circle cx="${-o.b / 5}" cy="0" r="${o.b / 10}" fill="#333"/><circle cx="${o.b / 5}" cy="0" r="${o.b / 10}" fill="#333"/>` },
  verteiler: { name: 'Mehrfachsteckdose', kat: 'Strom & Sicherheit', ebene: 'sicherheit', b: 50, t: 14, zeichnen: o =>
    rechteck(o, '#F0ECE4', '#8A8A8A', 1.2, 3) + [-0.3, -0.1, 0.1, 0.3].map(f => `<circle cx="${f * o.b}" cy="0" r="${o.t / 5}" fill="#333"/>`).join('') },
  kabel: { name: 'Kabel', kat: 'Strom & Sicherheit', ebene: 'sicherheit', linie: true, farbe: '#E8A04A' },
  weg: { name: 'Rettungsweg', kat: 'Strom & Sicherheit', ebene: 'sicherheit', linie: true, farbe: '#5DBB7A' },
  feuerloescher: { name: 'Feuerlöscher', kat: 'Strom & Sicherheit', ebene: 'sicherheit', b: 24, t: 24, rund: true, zeichnen: o =>
    `<circle r="${o.b / 2}" fill="#D23C2C" stroke="#FFD7D0" stroke-width="1.5"/>` + mitteText(o, 'F', '#FFF', o.b * 0.6) },
  rauchmelder: { name: 'Rauchmelder', kat: 'Strom & Sicherheit', ebene: 'sicherheit', b: 24, t: 24, rund: true, zeichnen: o =>
    `<circle r="${o.b / 2}" fill="#F0ECE4" stroke="#E05A4A" stroke-width="2.5"/>` + mitteText(o, 'RM', '#C0392B', o.b * 0.42) },

  // Beschriftung
  bereich: { name: 'Bereich / Zone', kat: 'Beschriftung', ebene: 'text', b: 300, t: 220, farbe: '#E0569B', textMitte: true, formen: [['rechteck', 'Rechteck'], ['ellipse', 'Ellipse']], zeichnen: o => {
    const f = o.farbe || '#E0569B';
    return o.form === 'ellipse'
      ? `<ellipse cx="0" cy="0" rx="${o.b / 2}" ry="${o.t / 2}" fill="${f}" fill-opacity=".12" stroke="${f}" stroke-width="2.5" stroke-dasharray="14 9"/>`
      : `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" rx="10" fill="${f}" fill-opacity=".12" stroke="${f}" stroke-width="2.5" stroke-dasharray="14 9"/>`;
  } },
  text: { name: 'Text', kat: 'Beschriftung', ebene: 'text', b: 260, t: 40, textMitte: true, farbe: '#E2BD85', zeichnen: o =>
    `<rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" fill="transparent"/>` },
  pfeil: { name: 'Pfeil', kat: 'Beschriftung', ebene: 'text', b: 120, t: 40, farbe: '#E2BD85', zeichnen: o => {
    const s = Math.min(o.t, o.b * 0.4);
    return `<path d="M ${-o.b / 2} ${-o.t * 0.18} H ${o.b / 2 - s} V ${-o.t / 2} L ${o.b / 2} 0 L ${o.b / 2 - s} ${o.t / 2} V ${o.t * 0.18} H ${-o.b / 2} Z" fill="${o.farbe || '#E2BD85'}"/>`;
  } },
};
const SK_BAR_FARBEN = ['#E0569B', '#4FC3D9', '#F29A38', '#F2C46B'];
const SK_KATEGORIEN = ['Raum', 'Möbel', 'Licht', 'Ton', 'Strom & Sicherheit', 'Beschriftung', 'Eigene'];

function skEigenZeichnen(def) {
  return o => {
    const f = o.farbe || def.farbe || '#C9A15A', b = o.b, t = o.t;
    const form = def.form === 'kreis' ? `<ellipse cx="0" cy="0" rx="${b / 2}" ry="${t / 2}"`
      : def.form === 'raute' ? `<path d="M 0 ${-t / 2} L ${b / 2} 0 L 0 ${t / 2} L ${-b / 2} 0 Z"`
        : def.form === 'dreieck' ? `<path d="M 0 ${-t / 2} L ${b / 2} ${t / 2} L ${-b / 2} ${t / 2} Z"`
          : `<rect x="${-b / 2}" y="${-t / 2}" width="${b}" height="${t}" rx="4"`;
    return `${form} fill="${f}" fill-opacity=".85" stroke="#F4F1EC" stroke-width="1.5"/>` + (def.kuerzel ? mitteText(o, def.kuerzel, '#15120D', Math.min(b, t) * 0.45) : '');
  };
}

function skSym(typ) {
  if (SK_SYMBOLE[typ]) return SK_SYMBOLE[typ];
  const def = (S.sk?.symbole || []).find(s => s.key === typ);
  if (!def) return { name: 'Unbekannt', kat: 'Eigene', ebene: 'text', b: 40, t: 40, zeichnen: o => rechteck(o, '#555', '#999') };
  return { name: def.name, kat: 'Eigene', ebene: def.ebene || 'text', b: def.b, t: def.t, farbe: def.farbe, rund: def.form === 'kreis' && def.b === def.t, eigen: def, zeichnen: skEigenZeichnen(def) };
}
const skEbene = o => o.ebene || skSym(o.typ).ebene;
const skIstPoly = o => !!o.punkte;

// ------------------------------------------------------------- Startgrundriss (nach den Fotos/Videos vom 24.10.2026, Maße geschätzt)

function skVorlage() {
  let n = 0;
  const id = () => 'v' + (n++).toString(36);
  const o = (typ, x, y, b, t, extra = {}) => ({ id: id(), typ, x, y, b, t, r: 0, ...extra });
  const poly = (typ, punkte, extra = {}) => ({ id: id(), typ, punkte, ...extra });
  const objekte = [
    poly('raum', [[0, 0], [460, 0], [460, 1050], [0, 1050]], { text: 'Gästeraum', wand: 40 }),
    poly('raum', [[540, 150], [1140, 150], [1140, 900], [540, 900]], { text: 'Thekenraum', wand: 40 }),
    poly('raum', [[860, 900], [1140, 900], [1140, 1160], [860, 1160]], { text: 'Vorraum', wand: 30, farbe: '#2A2722' }),
    o('wand', 500, 525, 80, 750),
    o('bogen', 500, 380, 150, 90, { r: 90 }),
    o('bogen', 500, 680, 150, 90, { r: 90 }),
    o('bogen', 980, 900, 160, 40),
    // Gästeraum
    o('bank', 45, 530, 940, 45, { r: 270 }),
    o('bank', 250, 1007, 360, 45, { r: 180 }),
    ...[170, 375, 580, 785].map(y => o('tisch', 110, y, 80, 200)),
    ...[100, 160, 220, 280, 340, 400, 460, 520, 580, 640, 700, 760, 820].map(y => o('stuhl', 175, y, 45, 45, { r: 90 })),
    o('tisch', 160, 940, 170, 80), o('tisch', 335, 940, 170, 80),
    ...[220, 280, 340, 400].map(x => o('stuhl', x, 875, 45, 45)),
    o('nische', 150, 1040, 120, 30), o('nische', 330, 1040, 120, 30),
    ...[150, 400, 650, 900].map(y => o('deckenleuchte', 300, y, 22, 22, { farbe: '#EEF3FF', g: 0 })),
    o('rauchmelder', 340, 110, 24, 24),
    ...[[120, 32], [300, 32], [428, 110], [428, 250], [428, 530], [428, 850], [428, 980]].map(([x, y]) => o('uplight', x, y, 26, 26, { farbe: '#F2C46B', g: 150 })),
    poly('kette', [[32, 70], [32, 990]], { farbe: '#FFD08A' }),
    o('text', 230, -80, 420, 40, { text: 'Eingang / Treppe? – bitte eintragen', fs: 24, farbe: '#CFC2A6' }),
    // Thekenraum
    o('arbeitstheke', 840, 185, 560, 60, { text: 'Arbeitsfläche · Spüle' }),
    o('arbeitstheke', 590, 260, 60, 90),
    o('fenster', 760, 150, 120, 16), o('fenster', 940, 150, 120, 16),
    o('theke', 850, 330, 360, 70, { text: 'Theke' }),
    o('zapfanlage', 960, 330, 26, 26),
    o('buffet', 600, 480, 80, 200, { text: 'Buffet' }), o('buffet', 600, 690, 80, 200, { text: 'Buffet' }),
    o('tisch', 1040, 500, 80, 140),
    o('bank', 1110, 500, 220, 45, { r: 90 }),
    o('bereich', 830, 620, 380, 300, { form: 'ellipse', farbe: '#E0569B', text: 'Tanzfläche' }),
    o('spiegelkugel', 830, 565, 40, 40, { g: 0 }),
    o('mischpult', 1070, 760, 100, 60, { r: 270, text: 'Musik' }),
    o('subwoofer', 1070, 845, 50, 50),
    o('box', 1095, 655, 45, 38, { r: 270 }), o('box', 1000, 860, 45, 38, { r: 315 }),
    o('lichtbar', 1025, 700, 120, 22, { r: 270, g: 380 }),
    o('uplight', 640, 330, 26, 26, { farbe: '#F2C46B', g: 160 }), o('uplight', 1060, 330, 26, 26, { farbe: '#F2C46B', g: 160 }), o('uplight', 562, 530, 26, 26, { farbe: '#F2C46B', g: 150 }),
    ...[[700, 420], [850, 450], [1000, 420], [850, 760]].map(([x, y]) => o('deckenleuchte', x, y, 22, 22, { farbe: '#EEF3FF', g: 0 })),
    o('rauchmelder', 760, 560, 24, 24),
    o('steckdose', 600, 162, 18, 18), o('steckdose', 1000, 162, 18, 18), o('steckdose', 1128, 720, 18, 18),
    poly('kabel', [[1128, 720], [1050, 720]], { farbe: '#E8A04A' }),
    // Vorraum
    o('tuer', 1140, 1030, 100, 30, { r: 90, text: 'Notausgang?' }),
    o('notausgang', 1105, 1030, 70, 24, { r: 90 }),
    o('stehtisch', 910, 1110, 60, 60, { text: 'Stehtische (geklappt)' }),
    poly('weg', [[830, 790], [960, 960], [1100, 1030]], { farbe: '#5DBB7A', text: 'Rettungsweg' }),
  ];
  return { v: 1, aktiv: 'p1', symbole: [], plaene: [{ id: 'p1', name: 'Gesamtplan', objekte }] };
}

// ------------------------------------------------------------- Zustand

const S = {
  sk: null, onChange: () => {}, kalk: null,
  wurzel: null, svg: null, flaeche: null, eig: null, bib: null, massstab: null,
  ansicht: { x: -100, y: -150, z: 0.6 }, auswahl: [], ebenenAus: [], licht: true, fang: true,
  zug: null, zeiger: new Map(), zurueck: [], vor: [], ablage: null, feldVorher: null,
};
try { Object.assign(S, JSON.parse(localStorage.getItem('einladung-skizze-ansicht') || '{}')); } catch { /* egal */ }
const skAnsichtMerken = () => { try { localStorage.setItem('einladung-skizze-ansicht', JSON.stringify({ licht: S.licht, fang: S.fang, ebenenAus: S.ebenenAus })); } catch { /* egal */ } };

const skPlan = () => S.sk.plaene.find(p => p.id === S.sk.aktiv) || S.sk.plaene[0];
const skObj = id => skPlan().objekte.find(o => o.id === id);
const skAusgewaehlt = () => S.auswahl.map(skObj).filter(Boolean);
const skSichtbar = o => !S.ebenenAus.includes(skEbene(o));
const skFang = v => (S.fang ? Math.round(v / 5) * 5 : Math.round(v));

function skJetzt() { return JSON.stringify(S.sk); }
function skFertig(vorher) {
  if (vorher == null || vorher === skJetzt()) return;
  S.zurueck.push(vorher);
  if (S.zurueck.length > 150) S.zurueck.shift();
  S.vor = [];
  S.onChange();
  skKnoepfe();
}
function skWiederherstellen(json) {
  const d = JSON.parse(json);
  S.sk.plaene = d.plaene; S.sk.symbole = d.symbole; S.sk.aktiv = d.aktiv;
  S.auswahl = S.auswahl.filter(id => skObj(id));
  S.onChange();
  skAllesNeu();
}
function skRueckgaengig() { if (!S.zurueck.length) return; S.vor.push(skJetzt()); skWiederherstellen(S.zurueck.pop()); }
function skWiederholen() { if (!S.vor.length) return; S.zurueck.push(skJetzt()); skWiederherstellen(S.vor.pop()); }

// ------------------------------------------------------------- Geometrie

const skDreh = (x, y, grad) => { const a = grad * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };
function skBox(o) {
  if (skIstPoly(o)) {
    const xs = o.punkte.map(p => p[0]), ys = o.punkte.map(p => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  const ecken = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => skDreh(a * o.b / 2, c * o.t / 2, o.r || 0));
  return [o.x + Math.min(...ecken.map(e => e[0])), o.y + Math.min(...ecken.map(e => e[1])), o.x + Math.max(...ecken.map(e => e[0])), o.y + Math.max(...ecken.map(e => e[1]))];
}
function skSchwerpunkt(punkte) {
  let a = 0, cx = 0, cy = 0;
  punkte.forEach((p, i) => { const q = punkte[(i + 1) % punkte.length], k = p[0] * q[1] - q[0] * p[1]; a += k; cx += (p[0] + q[0]) * k; cy += (p[1] + q[1]) * k; });
  if (Math.abs(a) < 1) return [punkte.reduce((s, p) => s + p[0], 0) / punkte.length, punkte.reduce((s, p) => s + p[1], 0) / punkte.length];
  return [cx / (3 * a), cy / (3 * a)];
}
function skPunkteEntlang(punkte, abstand) {
  const out = [];
  for (let i = 0; i < punkte.length - 1; i++) {
    const [x1, y1] = punkte[i], [x2, y2] = punkte[i + 1], l = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(l / abstand));
    for (let k = 0; k < n; k++) out.push([x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n]);
  }
  if (punkte.length) out.push(punkte[punkte.length - 1]);
  return out;
}

// ------------------------------------------------------------- Zeichnen (SVG als Text – schnell und gleich für Bild-Export)

function skDefs(farben) {
  const hex = f => f.replace(/[^0-9a-z]/gi, '');
  return `<defs>
<pattern id="sk-raster" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 H 0 V 100" fill="none" stroke="rgba(201,154,91,.16)" stroke-width="1.5"/><path d="M 50 0 V 100 M 0 50 H 100" fill="none" stroke="rgba(201,154,91,.07)" stroke-width="1"/></pattern>
<pattern id="sk-stein" width="60" height="40" patternUnits="userSpaceOnUse"><rect width="60" height="40" fill="#5E4F3B"/><g fill="#6E5D45" stroke="#4A3D2C" stroke-width="1.5"><rect x="1" y="1" width="34" height="17" rx="3"/><rect x="37" y="1" width="22" height="17" rx="3"/><rect x="1" y="21" width="16" height="18" rx="3"/><rect x="19" y="21" width="40" height="18" rx="3"/></g></pattern>
<pattern id="sk-platten" width="80" height="60" patternUnits="userSpaceOnUse"><path d="M 80 0 H 0 V 60 M 40 0 V 30 M 0 30 H 80 M 20 30 V 60 M 60 30 V 60" fill="none" stroke="rgba(255,255,255,.035)" stroke-width="1.5"/></pattern>
<radialGradient id="sk-kugel" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#B8BCC4"/><stop offset="1" stop-color="#5A5E66"/></radialGradient>
<marker id="sk-pfeilspitze" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#5DBB7A"/></marker>
${[...farben].map(f => `<radialGradient id="sk-gl-${hex(f)}"><stop offset="0" stop-color="${f}" stop-opacity=".62"/><stop offset=".45" stop-color="${f}" stop-opacity=".22"/><stop offset="1" stop-color="${f}" stop-opacity="0"/></radialGradient>
<linearGradient id="sk-kg-${hex(f)}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${f}" stop-opacity=".6"/><stop offset="1" stop-color="${f}" stop-opacity="0"/></linearGradient>`).join('\n')}
</defs>`;
}

function skLichtSchein(o, farben) {
  const sym = skSym(o.typ), f = o.farbe || sym.farbe || '#F2C46B', g = o.g ?? sym.g ?? 0, hex = f.replace(/[^0-9a-z]/gi, '');
  if (sym.schein === 'kette') {
    farben.add(f);
    return `<polyline points="${o.punkte.map(p => p.join(',')).join(' ')}" fill="none" stroke="${f}" stroke-opacity=".22" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (!g) return '';
  const rot = `transform="translate(${o.x} ${o.y}) rotate(${o.r || 0})"`;
  if (sym.schein === 'punkt') { farben.add(f); return `<circle cx="${o.x}" cy="${o.y}" r="${g}" fill="url(#sk-gl-${hex})"/>`; }
  const kegel = (cx, farbe, winkel, breite) => {
    const h = farben.add(farbe) && farbe.replace(/[^0-9a-z]/gi, '');
    const [ax, ay] = skDreh(0, -g, winkel), w = Math.tan(breite * Math.PI / 180) * g;
    const [lx, ly] = skDreh(-w, 0, winkel), [rx, ry] = [-lx, -ly];
    return `<path d="M ${cx} 0 L ${cx + ax + lx} ${ay + ly} Q ${cx + ax * 1.08} ${ay * 1.08} ${cx + ax + rx} ${ay + ry} Z" fill="url(#sk-kg-${h})"/>`;
  };
  if (sym.schein === 'kegel') return `<g ${rot}>${kegel(0, f, 0, 16)}</g>`;
  if (sym.schein === 'bar') return `<g ${rot}>${SK_BAR_FARBEN.map((bf, i) => kegel((-0.375 + i * 0.25) * o.b, bf, -27 + i * 18, 11)).join('')}</g>`;
  return '';
}

function skObjektSvg(o) {
  const sym = skSym(o.typ);
  const daten = `data-id="${o.id}"`;
  if (o.typ === 'raum') {
    const pts = o.punkte.map(p => p.join(',')).join(' ');
    const [cx, cy] = skSchwerpunkt(o.punkte);
    return `<g ${daten} class="sk-raum">
<polygon points="${pts}" fill="${o.farbe || SK_BODEN}" pointer-events="none"/><polygon points="${pts}" fill="url(#sk-platten)" pointer-events="none"/>
<polygon points="${pts}" fill="none" stroke="url(#sk-stein)" stroke-width="${o.wand ?? 40}" stroke-linejoin="round" pointer-events="stroke"/>
<polygon points="${pts}" fill="none" stroke="${SK_STEIN_RAND}" stroke-width="1.5" pointer-events="none"/>
</g>`;
  }
  if (skIstPoly(o)) {
    const pts = o.punkte.map(p => p.join(',')).join(' ');
    let s = `<polyline points="${pts}" fill="none" stroke="transparent" stroke-width="30" stroke-linecap="round" pointer-events="stroke"/>`;
    if (o.typ === 'mauer') s += `<polyline points="${pts}" fill="none" stroke="url(#sk-stein)" stroke-width="${o.wand ?? 40}" stroke-linejoin="round" pointer-events="stroke"/>`;
    else if (o.typ === 'kette') s += `<polyline points="${pts}" fill="none" stroke="#6A5A40" stroke-width="2" pointer-events="none"/>` + skPunkteEntlang(o.punkte, 25).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${o.farbe || '#FFD08A'}" pointer-events="none"/>`).join('');
    else if (o.typ === 'kabel') s += `<polyline points="${pts}" fill="none" stroke="${o.farbe || '#E8A04A'}" stroke-width="3" stroke-dasharray="10 6" stroke-linecap="round" pointer-events="none"/>`;
    else if (o.typ === 'weg') s += `<polyline points="${pts}" fill="none" stroke="${o.farbe || '#5DBB7A'}" stroke-width="7" stroke-dasharray="22 12" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#sk-pfeilspitze)" pointer-events="none"/>`;
    if (o.text) {
      const m = o.punkte[Math.floor((o.punkte.length - 1) / 2)], q = o.punkte[Math.floor((o.punkte.length - 1) / 2) + 1] || m;
      s += `<text x="${(m[0] + q[0]) / 2}" y="${(m[1] + q[1]) / 2 - 16}" text-anchor="middle" font-size="${o.fs || 22}" fill="${o.farbe || '#E2BD85'}" font-family="Jost, sans-serif" pointer-events="none">${skEsc(o.text)}</text>`;
    }
    return `<g ${daten}>${s}</g>`;
  }
  let text = '';
  if (o.text) {
    const fs = o.fs || (o.typ === 'text' ? 28 : 20);
    const mitte = !!sym.textMitte;
    const farbe = o.typ === 'text' || o.typ === 'bereich' ? (o.farbe || sym.farbe || '#E2BD85') : mitte ? (skHell(o.farbe || sym.farbe) ? '#15120D' : '#F4F1EC') : '#E2BD85';
    const unten = Math.max(...skBox(o).slice(3)) - o.y + fs * 0.9;
    text = `<text x="${o.x}" y="${mitte ? o.y : o.y + unten}" text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-weight="${mitte && o.typ !== 'text' ? 600 : 400}" fill="${farbe}" font-family="Jost, sans-serif" pointer-events="none">${skEsc(o.text)}</text>`;
  }
  return `<g ${daten}><g transform="translate(${o.x} ${o.y}) rotate(${o.r || 0})">${sym.zeichnen(o)}</g>${text}</g>`;
}

function skSzeneSvg(objekte, mitLicht) {
  const farben = new Set();
  const sichtbar = objekte.filter(skSichtbar);
  const raeume = sichtbar.filter(o => o.typ === 'raum').map(skObjektSvg).join('');
  const schein = mitLicht ? sichtbar.filter(o => skEbene(o) === 'licht' || skSym(o.typ).schein).map(o => skLichtSchein(o, farben)).join('') : '';
  const rest = sichtbar.filter(o => o.typ !== 'raum').map(skObjektSvg).join('');
  const namen = sichtbar.filter(o => o.typ === 'raum' && o.text).map(o => {
    const [cx, cy] = skSchwerpunkt(o.punkte);
    return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${o.fs || 34}" letter-spacing="5" fill="#F2D49B" fill-opacity=".8" stroke="#0D0C0A" stroke-opacity=".75" stroke-width="5" paint-order="stroke" font-family="Jost, sans-serif">${skEsc(o.text.toUpperCase())}</text>`;
  }).join('');
  return { defs: skDefs(farben), inhalt: `<g class="sk-boden">${raeume}</g><g class="sk-schein" style="mix-blend-mode:screen" pointer-events="none">${schein}</g><g class="sk-objekte">${rest}</g><g class="sk-namen" pointer-events="none">${namen}</g>` };
}

function skZeichne() {
  if (!S.svg) return;
  const { defs, inhalt } = skSzeneSvg(skPlan().objekte, S.licht);
  S.svg.innerHTML = defs + `<rect x="-20000" y="-20000" width="40000" height="40000" fill="url(#sk-raster)" class="sk-grund"/>` + inhalt + `<g class="sk-griffe">${skGriffeSvg()}</g>` +
    (S.zug?.typ === 'rahmen' ? `<rect x="${Math.min(S.zug.x0, S.zug.x1)}" y="${Math.min(S.zug.y0, S.zug.y1)}" width="${Math.abs(S.zug.x1 - S.zug.x0)}" height="${Math.abs(S.zug.y1 - S.zug.y0)}" fill="rgba(226,189,133,.08)" stroke="#E2BD85" stroke-width="${1.5 / S.ansicht.z}" stroke-dasharray="${6 / S.ansicht.z} ${4 / S.ansicht.z}"/>` : '');
}

function skGriffeSvg() {
  const z = S.ansicht.z, g = 7 / z, sw = 1.5 / z;
  const griff = (x, y, art, extra = '', form = 'quadrat') => form === 'kreis'
    ? `<circle cx="${x}" cy="${y}" r="${g}" fill="#15120D" stroke="#E2BD85" stroke-width="${sw * 1.4}" data-griff="${art}" ${extra} class="sk-griff"/>`
    : form === 'raute'
      ? `<path d="M ${x} ${y - g * 1.2} L ${x + g * 1.2} ${y} L ${x} ${y + g * 1.2} L ${x - g * 1.2} ${y} Z" fill="#E0569B" stroke="#FFF" stroke-width="${sw}" data-griff="${art}" ${extra} class="sk-griff"/>`
      : `<rect x="${x - g}" y="${y - g}" width="${2 * g}" height="${2 * g}" fill="#E2BD85" stroke="#15120D" stroke-width="${sw}" data-griff="${art}" ${extra} class="sk-griff"/>`;
  const sel = skAusgewaehlt().filter(skSichtbar);
  let s = '';
  for (const o of sel) {
    if (skIstPoly(o)) {
      const geschlossen = o.typ === 'raum';
      const pts = o.punkte;
      s += `<polyline points="${pts.concat(geschlossen ? [pts[0]] : []).map(p => p.join(',')).join(' ')}" fill="none" stroke="#4F8FE0" stroke-width="${sw * 1.5}" stroke-dasharray="${6 / z} ${4 / z}" pointer-events="none"/>`;
      if (sel.length === 1) {
        const n = geschlossen ? pts.length : pts.length - 1;
        for (let i = 0; i < n; i++) {
          const p = pts[i], q = pts[(i + 1) % pts.length];
          s += `<circle cx="${(p[0] + q[0]) / 2}" cy="${(p[1] + q[1]) / 2}" r="${g * 0.7}" fill="#4F8FE0" fill-opacity=".55" stroke="#FFF" stroke-width="${sw}" data-griff="neupunkt" data-i="${i}" class="sk-griff"><title>Ziehen: neuen Eckpunkt einfügen</title></circle>`;
        }
        pts.forEach((p, i) => { s += griff(p[0], p[1], 'punkt', `data-i="${i}"`, 'kreis').replace('/>', '><title>Ziehen: Ecke verschieben · Doppelklick: Ecke löschen</title></circle>'); });
      }
      continue;
    }
    const tr = `transform="translate(${o.x} ${o.y}) rotate(${o.r || 0})"`;
    s += `<g ${tr}><rect x="${-o.b / 2}" y="${-o.t / 2}" width="${o.b}" height="${o.t}" fill="none" stroke="#4F8FE0" stroke-width="${sw * 1.5}" stroke-dasharray="${6 / z} ${4 / z}" pointer-events="none"/>`;
    if (sel.length === 1 && !o.gesperrt) {
      const oben = -o.t / 2 - 28 / z;
      s += `<line x1="0" y1="${-o.t / 2}" x2="0" y2="${oben}" stroke="#E2BD85" stroke-width="${sw}"/>` + griff(0, oben, 'drehen', '', 'kreis');
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, c]) => { s += griff(a * o.b / 2, c * o.t / 2, 'groesse', `data-sx="${a}" data-sy="${c}"`); });
      const sym = skSym(o.typ);
      if (sym.schein && sym.schein !== 'kette') {
        const gg = o.g ?? sym.g ?? 0;
        if (sym.schein === 'punkt') s += griff(Math.max(gg, o.b / 2 + 20 / z), 0, 'reichweite', '', 'raute');
        else s += griff(0, -Math.max(gg, o.t / 2 + 50 / z), 'reichweite', '', 'raute');
      }
    }
    s += '</g>';
  }
  return s;
}

// ------------------------------------------------------------- Ansicht (Zoom, Verschieben)

function skAnsichtSetzen() {
  if (!S.svg) return;
  const w = S.flaeche.clientWidth || 800, h = S.flaeche.clientHeight || 500, v = S.ansicht;
  S.svg.setAttribute('viewBox', `${v.x} ${v.y} ${w / v.z} ${h / v.z}`);
  const m = [50, 100, 200, 500, 1000, 2000].find(cm => cm * v.z >= 70) || 2000;
  S.massstab.style.width = Math.round(m * v.z) + 'px';
  S.massstab.textContent = m >= 100 ? `${m / 100} m` : `${m} cm`;
}
function skEinpassen() {
  const objs = skPlan().objekte.filter(skSichtbar);
  if (!objs.length) { S.ansicht = { x: -100, y: -100, z: 0.6 }; skAnsichtSetzen(); skZeichne(); return; }
  const boxen = objs.map(skBox);
  const x0 = Math.min(...boxen.map(b => b[0])) - 60, y0 = Math.min(...boxen.map(b => b[1])) - 60, x1 = Math.max(...boxen.map(b => b[2])) + 60, y1 = Math.max(...boxen.map(b => b[3])) + 60;
  const w = S.flaeche.clientWidth || 800, h = S.flaeche.clientHeight || 500;
  const z = Math.min(w / (x1 - x0), h / (y1 - y0));
  S.ansicht = { z, x: x0 - (w / z - (x1 - x0)) / 2, y: y0 - (h / z - (y1 - y0)) / 2 };
  skAnsichtSetzen(); skZeichne();
}
function skZoom(faktor, sx, sy) {
  const v = S.ansicht, w = S.flaeche.clientWidth, h = S.flaeche.clientHeight;
  if (sx == null) { sx = w / 2; sy = h / 2; }
  const wx = v.x + sx / v.z, wy = v.y + sy / v.z;
  v.z = Math.min(6, Math.max(0.08, v.z * faktor));
  v.x = wx - sx / v.z; v.y = wy - sy / v.z;
  skAnsichtSetzen(); skZeichne();
}
function skWelt(e) {
  const r = S.svg.getBoundingClientRect(), v = S.ansicht;
  return { x: v.x + (e.clientX - r.left) / v.z, y: v.y + (e.clientY - r.top) / v.z };
}

// ------------------------------------------------------------- Maus / Finger

function skZeigerRunter(e) {
  S.flaeche.focus({ preventScroll: true });
  S.zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (S.zeiger.size === 2) { // zwei Finger: zoomen
    const [a, b] = [...S.zeiger.values()];
    if (S.zug?.vorher) skFertig(S.zug.vorher);
    S.zug = { typ: 'pinch', abstand: Math.hypot(a.x - b.x, a.y - b.y), z: S.ansicht.z };
    return;
  }
  if (S.zeiger.size > 2) return;
  S.svg.setPointerCapture(e.pointerId);
  const zg = e.target.closest('[data-griff]'), zo = e.target.closest('[data-id]');
  S.letztesZiel = { griff: zg?.dataset.griff, i: zg?.dataset.i, id: zo?.dataset.id };
  // Doppelklick selbst erkennen (die Zeichnung wird zwischen den Klicks neu aufgebaut, dann meldet der Browser keinen)
  const jetzt = Date.now(), schluessel = `${S.letztesZiel.griff}|${S.letztesZiel.i}|${S.letztesZiel.id}`, lk = S.letzterKlick;
  S.letzterKlick = { zeit: jetzt, schluessel, x: e.clientX, y: e.clientY };
  if (lk && jetzt - lk.zeit < 450 && lk.schluessel === schluessel && Math.hypot(e.clientX - lk.x, e.clientY - lk.y) < 8 && e.button === 0) {
    S.letzterKlick = null; S.zug = null; skDoppelklick(); return;
  }
  const p = skWelt(e);
  const start = { sx: e.clientX, sy: e.clientY, x0: p.x, y0: p.y, bewegt: false };
  if (e.button === 1 || e.button === 2) { S.zug = { ...start, typ: 'pan', ansicht: { ...S.ansicht } }; return; }
  const griff = e.target.closest('[data-griff]');
  if (griff) {
    const o = skAusgewaehlt()[0];
    if (!o) return;
    const vorher = skJetzt();
    const art = griff.dataset.griff, i = Number(griff.dataset.i);
    if (art === 'neupunkt') { o.punkte.splice(i + 1, 0, [skFang(p.x), skFang(p.y)]); S.zug = { ...start, typ: 'punkt', id: o.id, i: i + 1, vorher }; skZeichne(); return; }
    S.zug = { ...start, typ: art, id: o.id, i, sx0: Number(griff.dataset.sx), sy0: Number(griff.dataset.sy), vorher, orig: JSON.parse(JSON.stringify(o)) };
    return;
  }
  const ziel = e.target.closest('[data-id]');
  if (ziel) {
    const id = ziel.dataset.id;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      S.auswahl = S.auswahl.includes(id) ? S.auswahl.filter(x => x !== id) : [...S.auswahl, id];
    } else if (!S.auswahl.includes(id)) S.auswahl = [id];
    const sel = skAusgewaehlt();
    skZeichne(); skEigenschaften();
    if (!sel.length || sel.every(o => o.gesperrt)) { S.zug = { ...start, typ: 'pan', ansicht: { ...S.ansicht } }; return; }
    S.zug = { ...start, typ: 'schieben', vorher: skJetzt(), orig: sel.filter(o => !o.gesperrt).map(o => JSON.parse(JSON.stringify(o))) };
    return;
  }
  if (e.shiftKey) { S.zug = { ...start, typ: 'rahmen', x1: p.x, y1: p.y }; return; }
  S.zug = { ...start, typ: 'pan', ansicht: { ...S.ansicht }, leer: true };
}

function skZeigerBewegt(e) {
  if (S.zeiger.has(e.pointerId)) S.zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const z = S.zug;
  if (!z) return;
  if (z.typ === 'pinch') {
    const [a, b] = [...S.zeiger.values()];
    if (!b) return;
    const r = S.svg.getBoundingClientRect();
    skZoom((z.z * Math.hypot(a.x - b.x, a.y - b.y) / z.abstand) / S.ansicht.z, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
    return;
  }
  if (Math.hypot(e.clientX - z.sx, e.clientY - z.sy) > 3) z.bewegt = true;
  if (!z.bewegt) return;
  const p = skWelt(e);
  if (z.typ === 'pan') {
    S.ansicht.x = z.ansicht.x - (e.clientX - z.sx) / S.ansicht.z;
    S.ansicht.y = z.ansicht.y - (e.clientY - z.sy) / S.ansicht.z;
    skAnsichtSetzen();
    return;
  }
  if (z.typ === 'rahmen') { z.x1 = p.x; z.y1 = p.y; skZeichne(); return; }
  if (z.typ === 'schieben') {
    let dx = p.x - z.x0, dy = p.y - z.y0;
    const erst = z.orig[0];
    if (S.fang && erst) {
      const bx = skIstPoly(erst) ? erst.punkte[0][0] : erst.x, by = skIstPoly(erst) ? erst.punkte[0][1] : erst.y;
      dx = skFang(bx + dx) - bx; dy = skFang(by + dy) - by;
    }
    z.orig.forEach(alt => {
      const o = skObj(alt.id);
      if (!o) return;
      if (skIstPoly(o)) o.punkte = alt.punkte.map(([x, y]) => [skN(x + dx), skN(y + dy)]);
      else { o.x = skN(alt.x + dx); o.y = skN(alt.y + dy); }
    });
    skZeichne();
    return;
  }
  const o = skObj(z.id);
  if (!o) return;
  if (z.typ === 'punkt') { o.punkte[z.i] = [skFang(p.x), skFang(p.y)]; skZeichne(); return; }
  const lok = skDreh(p.x - z.orig.x, p.y - z.orig.y, -(z.orig.r || 0));
  if (z.typ === 'drehen') {
    let w = Math.atan2(p.y - o.y, p.x - o.x) * 180 / Math.PI + 90;
    w = e.altKey ? Math.round(w) : Math.round(w / 15) * 15;
    o.r = ((w % 360) + 360) % 360;
  } else if (z.typ === 'groesse') {
    const ox = -z.sx0 * z.orig.b / 2, oy = -z.sy0 * z.orig.t / 2;
    let b = Math.max(5, Math.abs(lok[0] - ox)), t = Math.max(5, Math.abs(lok[1] - oy));
    if (S.fang) { b = Math.max(5, Math.round(b / 5) * 5); t = Math.max(5, Math.round(t / 5) * 5); }
    if (skSym(o.typ).rund && !e.altKey) b = t = Math.max(b, t);
    const mx = ox + z.sx0 * b / 2, my = oy + z.sy0 * t / 2;
    const [wx, wy] = skDreh(mx, my, z.orig.r || 0);
    Object.assign(o, { b, t, x: skN(z.orig.x + wx), y: skN(z.orig.y + wy) });
  } else if (z.typ === 'reichweite') {
    const sym = skSym(o.typ);
    o.g = Math.max(0, skFang(sym.schein === 'punkt' ? Math.hypot(lok[0], lok[1]) : -lok[1]));
  }
  skZeichne();
  if (S.eig) skEigenschaftsWerte();
}

function skZeigerHoch(e) {
  S.zeiger.delete(e.pointerId);
  const z = S.zug;
  if (!z) return;
  if (z.typ === 'pinch') { if (S.zeiger.size === 0) S.zug = null; return; }
  S.zug = null;
  if (z.typ === 'pan' && z.leer && !z.bewegt && S.auswahl.length) { S.auswahl = []; skZeichne(); skEigenschaften(); return; }
  if (z.typ === 'rahmen') {
    const [x0, x1] = [Math.min(z.x0, z.x1), Math.max(z.x0, z.x1)], [y0, y1] = [Math.min(z.y0, z.y1), Math.max(z.y0, z.y1)];
    S.auswahl = skPlan().objekte.filter(o => skSichtbar(o) && o.typ !== 'raum').filter(o => { const b = skBox(o), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2; return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1; }).map(o => o.id);
    skZeichne(); skEigenschaften();
    return;
  }
  if (z.vorher) { skFertig(z.vorher); skZeichne(); skEigenschaften(); }
}

function skDoppelklick() {
  const ziel = S.letztesZiel || {};
  if (ziel.griff === 'punkt') {
    const o = skAusgewaehlt()[0], i = Number(ziel.i);
    if (!o || o.punkte.length <= (o.typ === 'raum' ? 3 : 2)) return;
    const vorher = skJetzt();
    o.punkte.splice(i, 1);
    skFertig(vorher); skZeichne();
    return;
  }
  if (ziel.id) setTimeout(() => S.eig?.querySelector('[data-feld="text"]')?.focus(), 0);
}

function skRad(e) {
  e.preventDefault();
  const r = S.svg.getBoundingClientRect();
  skZoom(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)), e.clientX - r.left, e.clientY - r.top);
}

// ------------------------------------------------------------- Bearbeiten

function skNeu(typ, x, y) {
  const sym = skSym(typ);
  const vorher = skJetzt();
  let o;
  if (sym.flaeche) o = { id: skId(), typ, punkte: [[x - 150, y - 150], [x + 150, y - 150], [x + 150, y + 150], [x - 150, y + 150]].map(p => p.map(skFang)), text: 'Neuer Raum', wand: 40 };
  else if (sym.linie) o = { id: skId(), typ, punkte: [[skFang(x - 120), skFang(y)], [skFang(x + 120), skFang(y)]] };
  else o = { id: skId(), typ, x: skFang(x), y: skFang(y), b: sym.b, t: sym.t, r: 0 };
  if (sym.farbe) o.farbe = sym.farbe;
  if (sym.g) o.g = sym.g;
  if (sym.flaeche) skPlan().objekte.unshift(o); else skPlan().objekte.push(o);
  if (S.ebenenAus.includes(skEbene(o))) { S.ebenenAus = S.ebenenAus.filter(e => e !== skEbene(o)); skAnsichtMerken(); skEbenenListe(); }
  S.auswahl = [o.id];
  skFertig(vorher); skZeichne(); skEigenschaften();
}
function skNeuMitte(typ) {
  const v = S.ansicht, w = S.flaeche.clientWidth, h = S.flaeche.clientHeight;
  skNeu(typ, v.x + w / 2 / v.z + (Math.random() - 0.5) * 40 / v.z, v.y + h / 2 / v.z + (Math.random() - 0.5) * 40 / v.z);
}
function skLoeschen() {
  if (!S.auswahl.length) return;
  const vorher = skJetzt();
  skPlan().objekte = skPlan().objekte.filter(o => !S.auswahl.includes(o.id));
  S.auswahl = [];
  skFertig(vorher); skZeichne(); skEigenschaften();
}
function skKopien(objs, versatz) {
  return objs.map(alt => {
    const o = JSON.parse(JSON.stringify(alt));
    o.id = skId();
    if (skIstPoly(o)) o.punkte = o.punkte.map(([x, y]) => [x + versatz, y + versatz]); else { o.x += versatz; o.y += versatz; }
    return o;
  });
}
function skEinfuegen(objs) {
  if (!objs.length) return;
  const vorher = skJetzt();
  skPlan().objekte.push(...objs);
  S.auswahl = objs.map(o => o.id);
  skFertig(vorher); skZeichne(); skEigenschaften();
}
function skReihenfolge(richtung) {
  const vorher = skJetzt(), liste = skPlan().objekte, sel = liste.filter(o => S.auswahl.includes(o.id)), rest = liste.filter(o => !S.auswahl.includes(o.id));
  skPlan().objekte = richtung > 0 ? [...rest, ...sel] : [...sel, ...rest];
  skFertig(vorher); skZeichne();
}

function skTaste(e) {
  if (!S.svg?.isConnected) return;
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;
  const strg = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (strg && k === 'z' && !e.shiftKey) { e.preventDefault(); skRueckgaengig(); return; }
  if (strg && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); skWiederholen(); return; }
  if (!S.wurzel.contains(document.activeElement) && document.activeElement !== document.body) return;
  if (strg && k === 'c' && S.auswahl.length) { S.ablage = JSON.stringify(skAusgewaehlt()); e.preventDefault(); return; }
  if (strg && k === 'v' && S.ablage) { e.preventDefault(); skEinfuegen(skKopien(JSON.parse(S.ablage), 40)); return; }
  if (strg && k === 'd' && S.auswahl.length) { e.preventDefault(); skEinfuegen(skKopien(skAusgewaehlt(), 40)); return; }
  if (strg && k === 'a') { e.preventDefault(); S.auswahl = skPlan().objekte.filter(o => skSichtbar(o) && o.typ !== 'raum').map(o => o.id); skZeichne(); skEigenschaften(); return; }
  if (!S.auswahl.length) return;
  if (k === 'delete' || k === 'backspace') { e.preventDefault(); skLoeschen(); return; }
  if (k === 'escape') { S.auswahl = []; skZeichne(); skEigenschaften(); return; }
  const schritt = e.shiftKey ? 50 : 5;
  const d = { arrowleft: [-schritt, 0], arrowright: [schritt, 0], arrowup: [0, -schritt], arrowdown: [0, schritt] }[k];
  if (d) {
    e.preventDefault();
    const vorher = skJetzt();
    skAusgewaehlt().filter(o => !o.gesperrt).forEach(o => { if (skIstPoly(o)) o.punkte = o.punkte.map(([x, y]) => [x + d[0], y + d[1]]); else { o.x += d[0]; o.y += d[1]; } });
    skFertig(vorher); skZeichne(); skEigenschaftsWerte();
    return;
  }
  if (k === 'r') {
    const vorher = skJetzt();
    skAusgewaehlt().filter(o => !skIstPoly(o) && !o.gesperrt).forEach(o => { o.r = (((o.r || 0) + (e.shiftKey ? -15 : 15)) % 360 + 360) % 360; });
    skFertig(vorher); skZeichne(); skEigenschaftsWerte();
  }
}
document.addEventListener('keydown', skTaste);

// ------------------------------------------------------------- Seitenleisten

function skIcon(typ) {
  const sym = skSym(typ);
  let inhalt, box;
  if (sym.flaeche) { inhalt = `<polygon points="-40,-30 40,-30 40,10 10,10 10,30 -40,30" fill="${SK_BODEN}" stroke="url(#sk-stein)" stroke-width="10" stroke-linejoin="round"/>`; box = 100; }
  else if (sym.linie) {
    const pts = [[-40, 20], [-10, -15], [15, 10], [40, -20]];
    const o = { typ, punkte: pts, farbe: sym.farbe };
    inhalt = typ === 'mauer' ? `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="url(#sk-stein)" stroke-width="14" stroke-linejoin="round"/>` : skObjektSvg({ ...o, id: 'i' }).replace(/stroke-width="(7|3)"/, 'stroke-width="5"');
    box = 100;
  } else {
    const o = { id: 'i', typ, x: 0, y: 0, b: sym.b, t: sym.t, r: 0, farbe: sym.farbe, form: typ === 'bereich' ? 'ellipse' : undefined };
    inhalt = `<g transform="translate(0 0)">${sym.zeichnen(o)}</g>`;
    if (typ === 'text') inhalt = `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="34" fill="#E2BD85" font-family="Jost, sans-serif">Abc</text>`;
    box = Math.max(sym.b, sym.t) * (['tuer', 'box'].includes(typ) ? 2.3 : 1.25);
    if (typ === 'text') box = 100;
  }
  const dy = typ === 'tuer' ? -sym.b / 2 : 0;
  return `<svg viewBox="${-box / 2} ${-box / 2 + dy} ${box} ${box}" width="34" height="34" aria-hidden="true">${skDefs(new Set())}${inhalt}</svg>`;
}

function skBibliothek() {
  const eigene = (S.sk.symbole || []).map(s => s.key);
  const nachKat = {};
  [...Object.keys(SK_SYMBOLE), ...eigene].forEach(k => { const kat = skSym(k).kat; (nachKat[kat] = nachKat[kat] || []).push(k); });
  const knopf = typ => {
    const b = el('button', { class: 'sk-sym', draggable: 'true', title: `${skSym(typ).name} – klicken zum Einfügen oder auf den Plan ziehen`, onclick: () => skNeuMitte(typ),
      ondragstart: e => { e.dataTransfer.setData('text/plain', 'sk:' + typ); e.dataTransfer.effectAllowed = 'copy'; } });
    b.innerHTML = skIcon(typ) + `<span>${skEsc(skSym(typ).name)}</span>`;
    if (skSym(typ).eigen) b.append(el('span', { class: 'sk-sym-weg', role: 'button', title: 'Eigenes Symbol löschen', onclick: ev => { ev.stopPropagation(); skSymbolLoeschen(typ); } }, '×'));
    return b;
  };
  setzen(S.bib,
    SK_KATEGORIEN.filter(k => nachKat[k]?.length || k === 'Eigene').map(kat => el('details', { class: 'sk-kat', open: true },
      el('summary', {}, kat),
      el('div', { class: 'sk-syms' }, (nachKat[kat] || []).map(knopf)),
      kat === 'Eigene' ? skEigenesFormular() : null)));
}

function skEigenesFormular() {
  const name = el('input', { type: 'text', placeholder: 'z. B. Fotobox', 'aria-label': 'Name' });
  const kuerzel = el('input', { type: 'text', maxlength: '4', placeholder: 'FB', 'aria-label': 'Kürzel im Symbol' });
  const form = el('select', { 'aria-label': 'Form' }, SK_FORMEN.map(([k, t]) => el('option', { value: k }, t)));
  const farbe = el('input', { type: 'color', value: '#9B6BE0', 'aria-label': 'Farbe' });
  const b = el('input', { type: 'number', value: '80', min: '5', 'aria-label': 'Breite in cm' });
  const t = el('input', { type: 'number', value: '80', min: '5', 'aria-label': 'Tiefe in cm' });
  const ebene = el('select', { 'aria-label': 'Ebene' }, SK_EBENEN.map(([k, txt]) => el('option', { value: k, selected: k === 'ton' }, txt)));
  const fehler = el('p', { class: 'fehler', hidden: true }, 'Bitte einen Namen eingeben.');
  const box = el('div', { class: 'sk-eigen', hidden: true },
    el('label', {}, 'Name', name), el('label', {}, 'Kürzel', kuerzel),
    el('div', { class: 'sk-zwei' }, el('label', {}, 'Form', form), el('label', {}, 'Farbe', farbe)),
    el('div', { class: 'sk-zwei' }, el('label', {}, 'Breite cm', b), el('label', {}, 'Tiefe cm', t)),
    el('label', {}, 'Ebene', ebene), fehler,
    el('button', { class: 'knopf klein', onclick: () => {
      if (!name.value.trim()) { fehler.hidden = false; name.focus(); return; }
      const vorher = skJetzt();
      const def = { key: 'e_' + skId(), name: name.value.trim(), kuerzel: kuerzel.value.trim(), form: form.value, farbe: farbe.value, b: Math.max(5, Number(b.value) || 80), t: Math.max(5, Number(t.value) || 80), ebene: ebene.value };
      (S.sk.symbole = S.sk.symbole || []).push(def);
      skFertig(vorher); skBibliothek(); skNeuMitte(def.key);
    } }, 'Symbol anlegen und einfügen'));
  name.addEventListener('input', () => { fehler.hidden = true; });
  return el('div', {}, el('button', { class: 'knopf zweit klein sk-eigen-auf', onclick: ev => { box.hidden = !box.hidden; ev.target.textContent = box.hidden ? '+ Eigenes Symbol' : 'Abbrechen'; if (!box.hidden) name.focus(); } }, '+ Eigenes Symbol'), box);
}

function skSymbolLoeschen(typ) {
  const benutzt = S.sk.plaene.reduce((n, p) => n + p.objekte.filter(o => o.typ === typ).length, 0);
  if (!confirm(benutzt ? `Symbol „${skSym(typ).name}“ löschen? Es wird ${benutzt}× in den Plänen verwendet – diese Objekte werden mit gelöscht.` : `Symbol „${skSym(typ).name}“ löschen?`)) return;
  const vorher = skJetzt();
  S.sk.plaene.forEach(p => { p.objekte = p.objekte.filter(o => o.typ !== typ); });
  S.sk.symbole = S.sk.symbole.filter(s => s.key !== typ);
  S.auswahl = S.auswahl.filter(id => skObj(id));
  skFertig(vorher); skBibliothek(); skZeichne(); skEigenschaften();
}

function skFeld(label, inhalt, klasse = '') { return el('label', { class: 'sk-feld ' + klasse }, el('span', {}, label), inhalt); }

function skEigenschaften() {
  if (!S.eig) return;
  const sel = skAusgewaehlt();
  const teile = [];
  if (!sel.length) {
    teile.push(el('div', { class: 'sk-leer' },
      el('p', {}, 'Nichts ausgewählt.'),
      el('ul', {},
        el('li', {}, 'Symbol links anklicken oder auf den Plan ziehen'),
        el('li', {}, 'Objekt anklicken: auswählen und verschieben'),
        el('li', {}, 'Raum auswählen: auf seine Mauer klicken – dann Ecken ziehen'),
        el('li', {}, 'Leere Fläche ziehen: Plan verschieben · Mausrad: zoomen'),
        el('li', {}, 'Umschalt + ziehen: mehrere auswählen'),
        el('li', {}, 'Entf löschen · Strg+D kopieren · R drehen · Strg+Z zurück'))));
  } else if (sel.length > 1) {
    teile.push(el('h3', {}, `${sel.length} Objekte ausgewählt`));
    const farbig = sel.filter(o => o.farbe || skSym(o.typ).farbe);
    if (farbig.length) teile.push(skFarbwahl(farbig[0].farbe || skSym(farbig[0].typ).farbe, f => { farbig.forEach(o => { o.farbe = f; }); }));
    teile.push(skAktionen(sel));
  } else {
    const o = sel[0], sym = skSym(o.typ);
    teile.push(el('h3', {}, sym.name));
    const eingabe = (key, attrs = {}, alsZahl = false, nachher) => {
      const inp = el(attrs.tag || 'input', { type: alsZahl ? 'number' : 'text', 'data-feld': key, ...attrs, tag: null });
      inp.value = o[key] ?? (key === 'g' ? (sym.g ?? 0) : '');
      inp.addEventListener('input', () => {
        const v = alsZahl ? Number(String(inp.value).replace(',', '.')) : inp.value;
        if (alsZahl && !Number.isFinite(v)) return;
        if (!alsZahl && v === '') delete o[key]; else o[key] = v;
        if (nachher) nachher(v);
        S.onChange(); skZeichne();
      });
      return inp;
    };
    teile.push(skFeld(o.typ === 'raum' ? 'Name des Raums' : 'Beschriftung', eingabe('text', { placeholder: o.typ === 'raum' ? 'z. B. Gästeraum' : 'optional' })));
    if (!skIstPoly(o)) {
      teile.push(el('div', { class: 'sk-zwei' },
        skFeld('Breite cm', eingabe('b', { min: 1 }, true, v => { if (sym.rund && o.b !== o.t && v > 0) { o.t = v; } })),
        skFeld('Tiefe cm', eingabe('t', { min: 1 }, true))));
      teile.push(el('div', { class: 'sk-zwei' },
        skFeld('Drehung °', eingabe('r', { step: 15 }, true, v => { o.r = ((v % 360) + 360) % 360; })),
        sym.schein && sym.schein !== 'kette' ? skFeld(sym.schein === 'punkt' ? 'Lichtschein cm' : 'Reichweite cm', eingabe('g', { min: 0, step: 10 }, true)) : el('span')));
    } else {
      teile.push(el('p', { class: 'leise' }, `${o.punkte.length} Eckpunkte · Ecken ziehen, blaue Punkte ziehen für neue Ecken, Doppelklick auf Ecke löscht sie.`));
    }
    if (o.typ === 'raum' || o.typ === 'mauer') teile.push(skFeld('Wanddicke cm', eingabe('wand', { min: 0, step: 5 }, true)));
    if (o.text || o.typ === 'text' || o.typ === 'raum') teile.push(skFeld('Schriftgröße', eingabe('fs', { min: 8, step: 2, placeholder: 'automatisch' }, true)));
    if (sym.formen) {
      const s = el('select', { 'data-feld': 'form' }, sym.formen.map(([k, t]) => el('option', { value: k, selected: (o.form || sym.formen[0][0]) === k }, t)));
      s.addEventListener('change', () => { o.form = s.value; S.onChange(); skZeichne(); });
      teile.push(skFeld('Form', s));
    }
    if (o.farbe || sym.farbe || o.typ === 'raum' || sym.zeichnen && ['tisch', 'bank', 'theke', 'arbeitstheke', 'buffet', 'sofa', 'tischrund', 'stehtisch'].includes(o.typ))
      teile.push(skFarbwahl(o.farbe || sym.farbe || (o.typ === 'raum' ? SK_BODEN : '#B8894A'), f => { o.farbe = f; }, o.typ === 'raum' ? 'Bodenfarbe' : 'Farbe'));
    const ebene = el('select', {}, SK_EBENEN.map(([k, t]) => el('option', { value: k, selected: skEbene(o) === k }, t)));
    ebene.addEventListener('change', () => { if (ebene.value === sym.ebene) delete o.ebene; else o.ebene = ebene.value; S.onChange(); skZeichne(); skEbenenListe(); });
    teile.push(skFeld('Ebene', ebene));
    const notiz = el('textarea', { rows: 2, placeholder: 'z. B. Akku vorher laden', 'data-feld': 'notiz' });
    notiz.value = o.notiz || '';
    notiz.addEventListener('input', () => { if (notiz.value) o.notiz = notiz.value; else delete o.notiz; S.onChange(); });
    teile.push(skFeld('Notiz', notiz));
    teile.push(skAktionen(sel));
  }
  setzen(S.eig, el('div', { class: 'sk-block' }, teile));
  skKnoepfe();
}

function skEigenschaftsWerte() {
  const o = skAusgewaehlt().length === 1 ? skAusgewaehlt()[0] : null;
  if (!o || !S.eig) return;
  S.eig.querySelectorAll('[data-feld]').forEach(f => { if (document.activeElement !== f && ['b', 't', 'r', 'g'].includes(f.dataset.feld)) f.value = o[f.dataset.feld] ?? ''; });
}

function skFarbwahl(wert, setzenFn, label = 'Farbe') {
  const anwenden = f => { setzenFn(f); S.onChange(); skZeichne(); };
  const picker = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(wert || '') ? wert : '#F2C46B', 'aria-label': label });
  picker.addEventListener('input', () => anwenden(picker.value));
  return skFeld(label, el('div', { class: 'sk-farben' }, picker,
    SK_FARBEN.map(([f, name]) => el('button', { class: 'sk-farbe', style: `background:${f}`, title: name, 'aria-label': name, onclick: () => { picker.value = f; const vorher = skJetzt(); anwenden(f); S.zurueck.push(vorher); skKnoepfe(); } }))));
}

function skAktionen(sel) {
  const alleGesperrt = sel.every(o => o.gesperrt);
  return el('div', { class: 'sk-aktionen' },
    el('button', { class: 'knopf zweit klein', title: 'Strg+D', onclick: () => skEinfuegen(skKopien(sel, 40)) }, 'Kopieren'),
    el('button', { class: 'knopf zweit klein', onclick: () => skReihenfolge(1) }, 'Nach vorn'),
    el('button', { class: 'knopf zweit klein', onclick: () => skReihenfolge(-1) }, 'Nach hinten'),
    el('button', { class: 'knopf zweit klein', onclick: () => { const vorher = skJetzt(); sel.forEach(o => { if (alleGesperrt) delete o.gesperrt; else o.gesperrt = true; }); skFertig(vorher); skZeichne(); skEigenschaften(); } }, alleGesperrt ? 'Entsperren' : 'Sperren'),
    el('button', { class: 'knopf zweit klein sk-rot', title: 'Entf', onclick: skLoeschen }, 'Löschen'));
}

function skEbenenListe() {
  const box = S.wurzel?.querySelector('.sk-ebenen');
  if (!box) return;
  const objs = skPlan().objekte;
  setzen(box, el('h3', {}, 'Ebenen'), SK_EBENEN.map(([k, t]) => {
    const cb = el('input', { type: 'checkbox', checked: !S.ebenenAus.includes(k) });
    cb.addEventListener('change', () => {
      S.ebenenAus = cb.checked ? S.ebenenAus.filter(e => e !== k) : [...S.ebenenAus, k];
      S.auswahl = S.auswahl.filter(id => skSichtbar(skObj(id)));
      skAnsichtMerken(); skZeichne(); skEigenschaften();
    });
    return el('label', { class: 'haken sk-ebene' }, cb, `${t} `, el('span', { class: 'leise' }, `(${objs.filter(o => skEbene(o) === k).length})`));
  }));
}

const SK_ZAEHLEN = [
  ['uplight', 'Uplights', /uplight|ambient/i], ['lichtbar', 'Lichtbar / Partylicht', /lichtbar|partylicht|derby/i], ['movinghead', 'Moving Heads', /moving/i],
  ['spiegelkugel', 'Spiegelkugel', /discokugel|spiegelkugel/i], ['kette', 'Lichterketten', /lichterkette/i],
  ['box', 'Lautsprecher', /lautsprecher|\bbox/i], ['subwoofer', 'Subwoofer', /subwoofer/i], ['mikrofon', 'Mikrofone', /mikro/i], ['mischpult', 'Mischpult / DJ', /mischpult|dj-/i],
];
function skZaehlung() {
  const box = S.wurzel?.querySelector('.sk-zaehlung');
  if (!box) return;
  const objs = skPlan().objekte;
  const technik = (S.kalk?.bereiche || []).find(b => b.id === 'technik');
  // jede Position zählt nur bei der ersten passenden Gruppe (z. B. „Partylicht (Moving Head / Derby)“ → Lichtbar)
  const kalk = {};
  if (technik) technik.gruppen.flatMap(g => g.positionen).forEach(p => {
    const t = p.was || '', treffer = !/stativ/i.test(t) && SK_ZAEHLEN.find(z => z[2].test(t));
    if (treffer) kalk[treffer[0]] = (kalk[treffer[0]] || 0) + (Number(String(p.menge).replace(',', '.')) || 0);
  });
  const zeilen = SK_ZAEHLEN.map(([typ, name]) => ({ name, plan: objs.filter(o => o.typ === typ).length, kalk: technik ? kalk[typ] || 0 : null })).filter(z => z.plan || z.kalk);
  setzen(box, el('h3', {}, 'Plan ↔ Kalkulation'),
    zeilen.length ? el('table', { class: 'sk-tabelle' },
      el('tr', {}, el('th', {}, ''), el('th', {}, 'Plan'), el('th', {}, 'Kalk.')),
      zeilen.map(z => el('tr', { class: z.kalk != null && z.plan !== z.kalk ? 'sk-abweichung' : '' }, el('td', {}, z.name), el('td', {}, String(z.plan)), el('td', {}, z.kalk == null ? '–' : String(z.kalk)))))
      : el('p', { class: 'leise' }, 'Noch keine Licht- oder Tontechnik im Plan.'),
    el('p', { class: 'leise' }, 'Abweichungen sind gelb markiert.'));
}

function skKnoepfe() {
  if (!S.wurzel) return;
  const z = S.wurzel.querySelector('[data-k="zurueck"]'), v = S.wurzel.querySelector('[data-k="vor"]');
  if (z) z.disabled = !S.zurueck.length;
  if (v) v.disabled = !S.vor.length;
  skZaehlung();
}

function skPlanLeiste() {
  const box = S.wurzel.querySelector('.sk-plaene');
  const wahl = el('select', { 'aria-label': 'Plan wählen' }, S.sk.plaene.map(p => el('option', { value: p.id, selected: p.id === skPlan().id }, p.name)));
  wahl.addEventListener('change', () => { S.sk.aktiv = wahl.value; S.auswahl = []; skAllesNeu(); skEinpassen(); });
  setzen(box, el('span', { class: 'leise' }, 'Plan'), wahl,
    el('button', { class: 'knopf zweit klein', title: 'Aktuellen Plan als neuen Plan kopieren (z. B. „Party“)', onclick: () => {
      const name = prompt('Name des neuen Plans (Kopie von „' + skPlan().name + '“):', skPlan().name + ' – Kopie');
      if (!name) return;
      const vorher = skJetzt();
      const neu = { id: 'p' + skId(), name, objekte: JSON.parse(JSON.stringify(skPlan().objekte)) };
      S.sk.plaene.push(neu); S.sk.aktiv = neu.id; S.auswahl = [];
      skFertig(vorher); skAllesNeu();
    } }, '+ Plan'),
    el('button', { class: 'knopf zweit klein', onclick: () => {
      const name = prompt('Neuer Name für den Plan:', skPlan().name);
      if (!name) return;
      const vorher = skJetzt(); skPlan().name = name; skFertig(vorher); skPlanLeiste();
    } }, 'Umbenennen'),
    S.sk.plaene.length > 1 ? el('button', { class: 'knopf zweit klein', onclick: () => {
      if (!confirm(`Plan „${skPlan().name}“ wirklich löschen?`)) return;
      const vorher = skJetzt();
      S.sk.plaene = S.sk.plaene.filter(p => p.id !== skPlan().id); S.sk.aktiv = S.sk.plaene[0].id; S.auswahl = [];
      skFertig(vorher); skAllesNeu(); skEinpassen();
    } }, 'Löschen') : null);
}

function skAllesNeu() { skPlanLeiste(); skBibliothek(); skEbenenListe(); skZeichne(); skEigenschaften(); }

// ------------------------------------------------------------- Export

function skExport(art) {
  const objs = skPlan().objekte.filter(skSichtbar);
  if (!objs.length) return;
  const boxen = objs.map(skBox);
  const x0 = Math.min(...boxen.map(b => b[0])) - 80, y0 = Math.min(...boxen.map(b => b[1])) - 80;
  const w = Math.max(...boxen.map(b => b[2])) + 80 - x0, h = Math.max(...boxen.map(b => b[3])) + 80 - y0;
  const { defs, inhalt } = skSzeneSvg(skPlan().objekte, S.licht);
  const skala = Math.min(2, 4000 / Math.max(w, h));
  const titel = `<text x="${x0 + 40}" y="${y0 + 50}" font-size="34" fill="#E2BD85" font-family="Jost, sans-serif">${skEsc(skPlan().name)} · Aysel &amp; Robin · 07.11.2026</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" width="${Math.round(w * skala)}" height="${Math.round(h * skala)}">${defs}<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#111111"/>${inhalt}${titel}</svg>`;
  const name = 'Skizze ' + skPlan().name.replace(/[\\/:*?"<>|]/g, '');
  const laden = (blob, endung) => { const a = el('a', { href: URL.createObjectURL(blob), download: name + endung }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
  if (art === 'svg') { laden(new Blob([svg], { type: 'image/svg+xml' }), '.svg'); return; }
  const img = new Image();
  img.onload = () => {
    const c = el('canvas', { width: Math.round(w * skala), height: Math.round(h * skala) });
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(b => laden(b, '.png'), 'image/png');
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ------------------------------------------------------------- Aufbau

/** Baut den Editor. daten = K.daten (skizze wird bei Bedarf angelegt), onChange = „ungespeichert“ melden. */
function skizzeAnsicht(daten, onChange) {
  const neuAngelegt = !daten.skizze;
  if (!daten.skizze) daten.skizze = skVorlage();
  if (S.sk !== daten.skizze) { S.zurueck = []; S.vor = []; S.auswahl = []; S.erstesMal = true; }
  S.sk = daten.skizze; S.kalk = daten; S.onChange = onChange;
  S.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  S.svg.setAttribute('class', 'sk-svg');
  S.svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  S.svg.setAttribute('role', 'img');
  S.svg.setAttribute('aria-label', 'Grundriss-Skizze');
  S.massstab = el('div', { class: 'sk-massstab' });
  S.flaeche = el('div', { class: 'sk-flaeche', tabindex: '0' }, S.svg, S.massstab);
  S.bib = el('aside', { class: 'sk-bib', 'aria-label': 'Symbole' });
  S.eig = el('div', { class: 'sk-eig-inhalt' });
  const schalter = (label, schluessel, titel) => {
    const cb = el('input', { type: 'checkbox', checked: S[schluessel] });
    cb.addEventListener('change', () => { S[schluessel] = cb.checked; skAnsichtMerken(); skZeichne(); });
    return el('label', { class: 'haken sk-schalter', title: titel }, cb, label);
  };
  S.wurzel = el('section', { class: 'sk' },
    neuAngelegt ? el('div', { class: 'meldung warn' }, 'Startgrundriss nach den neuen Fotos und Videos – Maße sind geschätzt. Bitte Raumform, Türen und Möbel prüfen und anpassen, dann „Speichern“.') : null,
    el('div', { class: 'sk-leiste' },
      el('div', { class: 'sk-plaene' }),
      el('div', { class: 'sk-gruppe' },
        el('button', { class: 'knopf zweit klein', 'data-k': 'zurueck', title: 'Rückgängig (Strg+Z)', onclick: skRueckgaengig }, '↶ Zurück'),
        el('button', { class: 'knopf zweit klein', 'data-k': 'vor', title: 'Wiederholen (Strg+Y)', onclick: skWiederholen }, '↷ Vor')),
      el('div', { class: 'sk-gruppe' }, schalter('Lichtwirkung', 'licht', 'Lichtschein der Leuchten anzeigen'), schalter('Am Raster einrasten', 'fang', '5-cm-Raster und 15°-Schritte')),
      el('div', { class: 'sk-gruppe' },
        el('button', { class: 'knopf zweit klein', title: 'Verkleinern', 'aria-label': 'Verkleinern', onclick: () => skZoom(1 / 1.25) }, '−'),
        el('button', { class: 'knopf zweit klein', onclick: skEinpassen }, 'Einpassen'),
        el('button', { class: 'knopf zweit klein', title: 'Vergrößern', 'aria-label': 'Vergrößern', onclick: () => skZoom(1.25) }, '+')),
      el('div', { class: 'sk-gruppe' },
        el('button', { class: 'knopf zweit klein', title: 'Plan als Bild herunterladen (z. B. für die Präsentation)', onclick: () => skExport('png') }, 'Als Bild'),
        el('button', { class: 'knopf zweit klein', title: 'Als Vektorgrafik (SVG) herunterladen', onclick: () => skExport('svg') }, 'SVG'))),
    el('div', { class: 'sk-haupt' },
      S.bib,
      S.flaeche,
      el('aside', { class: 'sk-eig', 'aria-label': 'Eigenschaften' }, S.eig, el('div', { class: 'sk-block sk-ebenen' }), el('div', { class: 'sk-block sk-zaehlung' }))));

  S.svg.addEventListener('pointerdown', skZeigerRunter);
  S.svg.addEventListener('pointermove', skZeigerBewegt);
  S.svg.addEventListener('pointerup', skZeigerHoch);
  S.svg.addEventListener('pointercancel', skZeigerHoch);
  S.svg.addEventListener('wheel', skRad, { passive: false });
  S.svg.addEventListener('contextmenu', e => e.preventDefault());
  S.flaeche.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  S.flaeche.addEventListener('drop', e => {
    const d = e.dataTransfer.getData('text/plain');
    if (!d.startsWith('sk:')) return;
    e.preventDefault();
    const p = skWelt(e);
    skNeu(d.slice(3), p.x, p.y);
  });
  // Eingaben in der Eigenschaften-Leiste: ein Rückgängig-Schritt pro Feld
  S.eig.addEventListener('focusin', () => { S.feldVorher = skJetzt(); });
  S.eig.addEventListener('change', () => { skFertig(S.feldVorher); S.feldVorher = skJetzt(); skEbenenListe(); });

  new ResizeObserver(() => { if (S.wurzel.isConnected) { skAnsichtSetzen(); if (S.erstesMal) { S.erstesMal = false; skEinpassen(); } } }).observe(S.flaeche);
  skAllesNeu();
  return S.wurzel;
}
