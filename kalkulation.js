// Kalkulation: Licht & Tontechnik, Getränke und Skizze (skizze.js) – gemeinsam bearbeitbar, gespeichert im Google Sheet (Blatt „App-Kalkulation“).

const kRoot = document.getElementById('kalkulation');
const K = { pw: '', daten: null, stand: '', bereich: 'technik', geaendert: false, neu: false, ergaenzt: [] };
try { K.pw = sessionStorage.getItem('einladung-pw') || ''; K.bereich = sessionStorage.getItem('einladung-kalk-bereich') || K.bereich; } catch { /* egal */ }

const STATUS = ['offen', 'angefragt', 'zugesagt', 'bestellt', 'erledigt'];

// Startwerte, solange noch nie gespeichert wurde. Getränke = Ergebnis der Getränke-Kalkulation (planung/…Getraenkekalkulation.xlsx).
const pos = (was, menge, einheit, notiz = '', wer = '') => ({ was, menge, einheit, preis: '', status: 'offen', wer, notiz });
const VORLAGE = () => ({
  stand: '',
  bereiche: [
    { id: 'technik', titel: 'Licht & Tontechnik',
      notiz: 'Vorschlagsliste – bitte anpassen, was ihr wirklich braucht bzw. was die Location schon hat.',
      gruppen: [
        { titel: 'Ton', positionen: [
          pos('PA-Lautsprecher (aktiv)', 2, 'Stück'),
          pos('Subwoofer', 1, 'Stück'),
          pos('Lautsprecher-Stative', 2, 'Stück'),
          pos('Mischpult / DJ-Controller', 1, 'Stück'),
          pos('Funkmikrofon für Reden', 1, 'Stück'),
          pos('Laptop/Handy mit Playlist (inkl. Musikwünsche der Gäste)', 1, 'Stück'),
          pos('Audiokabel & Adapter', 1, 'Set'),
        ] },
        { titel: 'Licht', positionen: [
          pos('LED-Scheinwerfer / Uplights fürs Gewölbe', 4, 'Stück'),
          pos('Partylicht (Moving Head / Derby)', 2, 'Stück'),
          pos('Discokugel', 1, 'Stück'),
          pos('Lichterketten', 3, 'Stück'),
          pos('Nebelmaschine / Hazer', 1, 'Stück', 'Nur nach Rücksprache mit der Location (Rauchmelder)!'),
        ] },
        { titel: 'Strom & Kleinkram', positionen: [
          pos('Verlängerungskabel / Mehrfachsteckdosen', 4, 'Stück'),
          pos('Gaffa-Tape', 1, 'Rolle'),
          pos('Kabelbrücke / Kabelabdeckung', 1, 'Stück', 'Stolperfallen im Keller vermeiden'),
        ] },
      ] },
    { id: 'getraenke', titel: 'Getränke',
      notiz: 'Aus der Getränke-Kalkulation (Stand 24.10.2026): 32 Gäste nachmittags, 64 abends – nur Zusagen plus Oma Ute (2×), Annelies & Reinhold und Thorsten, ohne optionale Gäste. Mengen inkl. Sicherheitszuschlag; Getränke Stab auf Kommission (Ungeöffnetes geht zurück).',
      gruppen: [
        { titel: 'Bier', positionen: [
          pos('Bier Helles – vom Fass', 1, 'Fass 30 l', 'Bedarf ≈ 25 l. Einzige Sorte vom Fass (nur eine Zapfanlage). Evtl. 2. Fass als Reserve – ungeöffnet geht es zurück.', 'Getränke Stab'),
          pos('Kellerbier', 2, 'Kiste 20 × 0,5 l', 'Bedarf ≈ 16 l', 'Getränke Stab'),
          pos('Bier Pils', 2, 'Kiste 20 × 0,5 l', 'Bedarf ≈ 18 l', 'Getränke Stab'),
          pos('Bier Export', 1, 'Kiste 20 × 0,5 l', 'Bedarf ≈ 6 l', 'Getränke Stab'),
          pos('Weizen', 2, 'Kiste 20 × 0,5 l', 'Bedarf ≈ 11 l', 'Getränke Stab'),
          pos('Radler', 2, 'Kiste 20 × 0,5 l', 'Bedarf ≈ 14 l', 'Getränke Stab'),
          pos('Alkoholfreies Bier', 2, 'Kiste 20 × 0,5 l', 'Bedarf ≈ 17 l', 'Getränke Stab'),
        ] },
        { titel: 'Wein & Sekt', positionen: [
          pos('Weißwein', 11, 'Flasche 0,75 l', 'Bedarf ≈ 7,8 l', 'Getränke Stab'),
          pos('Rotwein', 2, 'Flasche 0,75 l', 'Bedarf ≈ 1,3 l', 'Getränke Stab'),
          pos('Sekt', 11, 'Flasche 0,75 l', 'Zum Anstoßen, Bedarf ≈ 8 l', 'Getränke Stab'),
        ] },
        { titel: 'Spirituosen & Filler', positionen: [
          pos('Wodka', 2, 'Flasche 0,7 l', 'Für Longdrinks', 'Getränke Stab'),
          pos('Gin', 1, 'Flasche 0,7 l', 'Für Longdrinks', 'Getränke Stab'),
          pos('Rum', 1, 'Flasche 0,7 l', 'Für Longdrinks', 'Getränke Stab'),
          pos('Whisky', 1, 'Flasche 0,7 l', 'Für Longdrinks', 'Getränke Stab'),
          pos('Kurze (z. B. Obstler, Jägermeister)', 4, 'Flasche 0,7 l', 'Oktoberfest-Runde', 'Getränke Stab'),
          pos('Energy Drink', 1, 'Kiste 24 × 0,25 l', 'Für Wodka-E', 'Getränke Stab'),
          pos('Tonic Water', 1, 'Kiste 24 × 0,2 l', 'Für Gin Tonic', 'Getränke Stab'),
        ] },
        { titel: 'Softdrinks & Saft', positionen: [
          pos('Cola', 2, 'Kiste 12 × 1,0 l', 'Inkl. Cola für Longdrinks, Bedarf ≈ 19 l', 'Getränke Stab'),
          pos('Cola Zero', 1, 'Kiste 12 × 1,0 l', 'Bedarf ≈ 6 l', 'Getränke Stab'),
          pos('Fanta / Limo', 1, 'Kiste 12 × 1,0 l', 'Bedarf ≈ 9 l', 'Getränke Stab'),
          pos('Spezi / Mezzo Mix', 1, 'Kiste 12 × 1,0 l', 'Bedarf ≈ 6 l', 'Getränke Stab'),
          pos('Apfelschorle', 2, 'Kiste 12 × 1,0 l', 'Bedarf ≈ 12 l', 'Getränke Stab'),
          pos('Orangensaft', 2, 'Kiste 6 × 1,0 l', 'Inkl. Saft für Longdrinks, Bedarf ≈ 8 l', 'Getränke Stab'),
          pos('Mangosaft (Bollywood!)', 2, 'Kiste 6 × 1,0 l', 'Bedarf ≈ 6 l', 'Getränke Stab'),
        ] },
        { titel: 'Wasser & Eis', positionen: [
          pos('Wasser mit Sprudel', 7, 'Kiste 12 × 0,7 l', 'Bedarf ≈ 57 l', 'Getränke Stab'),
          pos('Wasser still', 6, 'Kiste 12 × 0,7 l', 'Bedarf ≈ 43 l', 'Getränke Stab'),
          pos('Eiswürfel', 11, 'Beutel 2 kg', 'Bedarf ≈ 22 kg', ''),
        ] },
        { titel: 'Kaffee & Tee (selbst besorgen)', positionen: [
          pos('Kaffeepulver', 0.5, 'kg', '≈ 8 l Kaffee'),
          pos('Teebeutel', 10, 'Stück'),
          pos('Milch / Kaffeesahne', 1, 'l'),
        ] },
        { titel: 'Zubehör', positionen: [
          pos('CO₂-Flasche für die Zapfanlage', 1, 'Flasche 2 kg', 'Reicht für mehrere Fässer', 'Getränke Stab'),
          pos('Kühlanhänger', 1, 'Stück', '', 'Getränke Stab'),
          pos('Zapfanlage', 1, 'Stück', 'Von der Location', 'Location'),
        ] },
      ] },
  ],
});

const zahl = v => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim().replace(',', '.');
  if (!s) return '';
  const n = Number(s);
  return Number.isFinite(n) ? n : '';
};
const zahlText = v => (v === '' || v == null ? '' : String(v).replace('.', ','));
const euro = n => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const summePos = p => (zahl(p.menge) === '' || zahl(p.preis) === '' ? 0 : zahl(p.menge) * zahl(p.preis));
const summeGruppe = g => g.positionen.reduce((s, p) => s + summePos(p), 0);
const summeBereich = b => b.gruppen.reduce((s, g) => s + summeGruppe(g), 0);
const mengeText = n => n.toLocaleString('de-DE', { maximumFractionDigits: 2 });

// ------------------------------------------------------------- Datenstand 2: Bedarf ↔ Bestellung, Kuchen

// Bedarf inkl. Sicherheitszuschlag laut Getränke-Kalkulation (planung/…Getraenkekalkulation.xlsx, Stand 24.10.2026)
const BEDARF = {
  'Bier Helles – vom Fass': [25.1, 'l'], 'Kellerbier': [16.1, 'l'], 'Bier Pils': [18.2, 'l'], 'Bier Export': [5.7, 'l'],
  'Weizen': [11.4, 'l'], 'Radler': [13.9, 'l'], 'Alkoholfreies Bier': [16.8, 'l'],
  'Weißwein': [7.8, 'l'], 'Rotwein': [1.3, 'l'], 'Sekt': [8.1, 'l'],
  'Wodka': [0.9, 'l'], 'Gin': [0.6, 'l'], 'Rum': [0.6, 'l'], 'Whisky': [0.4, 'l'], 'Kurze (z. B. Obstler, Jägermeister)': [2.3, 'l'],
  'Energy Drink': [3.9, 'l'], 'Tonic Water': [3.2, 'l'],
  'Cola': [19.2, 'l'], 'Cola Zero': [6.1, 'l'], 'Fanta / Limo': [9.2, 'l'], 'Spezi / Mezzo Mix': [6.1, 'l'],
  'Apfelschorle': [12.3, 'l'], 'Orangensaft': [8.1, 'l'], 'Mangosaft (Bollywood!)': [6.1, 'l'],
  'Wasser mit Sprudel': [56.5, 'l'], 'Wasser still': [43.3, 'l'], 'Eiswürfel': [21.7, 'kg'],
  'Kaffeepulver': [0.47, 'kg'], 'Teebeutel': [10, 'Stück'], 'Milch / Kaffeesahne': [0.8, 'l'],
};

/** Inhalt einer Einheit aus dem Text, z. B. „Kiste 20 × 0,5 l“ → 10, „Fass 30 l“ → 30, „Beutel 2 kg“ → 2. */
function inhaltAus(einheit) {
  const t = String(einheit || '').replace(/,/g, '.');
  let m = t.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*(l|kg)\b/i);
  if (m) return [Math.round(m[1] * m[2] * 100) / 100, m[3]];
  m = t.match(/(\d+(?:\.\d+)?)\s*(l|kg)\b/i);
  if (m) return [Number(m[1]), m[2]];
  if (/^(kg|l|stück)$/i.test(t.trim())) return [1, t.trim()];
  return ['', ''];
}

const kuchen = (was, wer, notiz, status = 'zugesagt', menge = 1) => ({ was, menge, einheit: 'Kuchen', preis: '', status, wer, notiz });
// Aus „App-Antworten Einladungen“ (Stand 24.10.2026) – nur Einladungen mit Zusage
const KUCHEN_GRUPPEN = () => [
  { titel: 'Kuchen – fest zugesagt', positionen: [
    kuchen('Torte', 'Aysel & Robin', 'Selbst'),
    kuchen('Schmandkuchen + wahrscheinlich Eierlikörkuchen', 'Petra & Jens Nissen', 'Nachmittags da. Bitte an Sahnespender erinnern!', 'zugesagt', 2),
    kuchen('Brownies', 'Alex, Stefan & Familie', 'Nachmittags da'),
    kuchen('Apfel-Mango-Crumble', 'Trini, Niklas & Familie', 'Nachmittags da'),
    kuchen('Zebrakuchen', 'Barbara & Martin', 'Kommen erst abends – eher als Dessert'),
    kuchen('Überraschung', 'JJ & Begleitung', 'Kommen erst abends – eher als Dessert'),
    kuchen('Käsekuchen', 'Alex', 'Kommt erst abends – eher als Dessert'),
    kuchen('Brownies (alternativ Mohrenkopftorte)', 'Leon', 'Kommt erst abends – eher als Dessert'),
    kuchen('Schoko-Kuchen', 'Sabrina', 'Kommt erst abends – eher als Dessert'),
    kuchen('Eierlikörkuchen (Marmorkuchen)', 'Justin & Nina', 'Kommen erst abends – eher als Dessert'),
  ] },
  { titel: 'Kuchen – optional (nur bei Bedarf fragen)', positionen: [
    kuchen('Kuchen nach Absprache', 'Mati & Lea', '„Falls als Nachspeise nach dem Buffet noch ein Kuchen benötigt wird: sehr gerne.“', 'offen'),
    kuchen('Kuchen nach Absprache', 'Robin Schwalm', '„Falls ihr noch einen Kuchen benötigt, sagt Bescheid.“', 'offen'),
  ] },
];

// Vorschlagsliste Material (Gästezahlen: 32 nachmittags, 64 abends)
const MATERIAL = () => ({
  id: 'material', titel: 'Material',
  notiz: 'Vorschlagsliste – Kategorien und Zeilen nach Bedarf anpassen, ergänzen oder löschen.',
  gruppen: [
    { titel: 'Geschirr & Besteck', positionen: [
      pos('Kuchenteller', 40, 'Stück', 'Nachmittags 32 Gäste'),
      pos('Kaffeetassen + Untertassen', 40, 'Stück'),
      pos('Kuchengabeln', 40, 'Stück'),
      pos('Teelöffel', 40, 'Stück'),
      pos('Essteller (Buffet)', 75, 'Stück', 'Abends 64 Gäste + Reserve'),
      pos('Dessertteller / Schalen', 70, 'Stück'),
      pos('Messer & Gabeln', 75, 'Set'),
      pos('Esslöffel / Dessertlöffel', 70, 'Stück'),
    ] },
    { titel: 'Gläser', positionen: [
      pos('Biergläser / Krüge', 70, 'Stück', 'Für Fassbier – evtl. von Getränke Stab leihbar'),
      pos('Weingläser', 30, 'Stück'),
      pos('Sektgläser', 70, 'Stück', 'Zum Anstoßen'),
      pos('Longdrinkgläser', 50, 'Stück'),
      pos('Wasser-/Saftgläser', 70, 'Stück'),
      pos('Schnapsgläser', 50, 'Stück'),
    ] },
    { titel: 'Küchengeräte', positionen: [
      pos('Kaffeemaschine / Kaffeekannen', 2, 'Stück', '≈ 8 l Kaffee'),
      pos('Wasserkocher (Tee)', 1, 'Stück'),
      pos('Warmhaltebehälter / Chafing Dishes', 4, 'Stück', 'Fürs Buffet'),
      pos('Sahnespender + Kapseln', 1, 'Stück', 'Petra bittet um Erinnerung'),
      pos('Kühlschrank / Kühlbox', 1, 'Stück', 'Für Sahne, Milch, Buffet'),
      pos('Mehrfachsteckdosen Küche', 2, 'Stück'),
    ] },
    { titel: 'Servieren & Buffet', positionen: [
      pos('Tortenheber', 4, 'Stück'),
      pos('Kuchenmesser', 3, 'Stück'),
      pos('Servierplatten / Tortenplatten', 10, 'Stück'),
      pos('Vorlegebesteck', 10, 'Set'),
      pos('Flaschenöffner / Korkenzieher', 3, 'Stück'),
      pos('Eiswürfelbehälter + Zange', 2, 'Stück'),
    ] },
    { titel: 'Tisch & Deko', positionen: [
      pos('Tischdecken / Tischläufer', '', 'Stück', 'Anzahl Tische klären'),
      pos('Servietten', 200, 'Stück'),
      pos('Kerzen / Teelichter', 30, 'Stück'),
      pos('Deko Oktoberfest (blau-weiß)', 1, 'Set'),
      pos('Deko Bollywood (bunt, Lichter)', 1, 'Set'),
    ] },
    { titel: 'Verbrauch & Reinigung', positionen: [
      pos('Müllsäcke', 20, 'Stück'),
      pos('Spülmittel + Schwämme', 1, 'Set'),
      pos('Geschirrtücher', 10, 'Stück'),
      pos('Küchenrolle', 6, 'Rolle'),
      pos('Alu- & Frischhaltefolie', 1, 'Set'),
      pos('Dosen / Beutel für Reste', 10, 'Stück'),
    ] },
  ],
});

/** Bringt ältere gespeicherte Stände auf den aktuellen Stand. Gibt zurück, was ergänzt wurde (leer = nichts). */
function migrieren(d) {
  const neu = [];
  if ((d.version || 1) < 2) {
    const g = d.bereiche.find(b => b.id === 'getraenke');
    if (g) {
      g.mitBedarf = true;
      if (g.titel === 'Getränke') g.titel = 'Getränke & Kuchen';
      g.gruppen.forEach(gr => gr.positionen.forEach(p => {
        const notizBedarf = String(p.notiz || '').match(/Bedarf ≈ ([\d,.]+) (l|kg)/);
        const [bedarf, einheit] = BEDARF[p.was] || (notizBedarf ? [zahl(notizBedarf[1]), notizBedarf[2]] : ['', '']);
        if (p.bedarf === undefined) { p.bedarf = bedarf; p.bedarfEinheit = einheit; }
        if (p.inhalt === undefined) p.inhalt = inhaltAus(p.einheit)[0];
        // Bedarf steht jetzt in eigener Zeile – aus der Notiz entfernen
        p.notiz = String(p.notiz || '').replace(/,?\s*Bedarf ≈ [\d,.]+ (l|kg)\.?/, '').replace(/^[\s,.]+|[\s,]+$/g, '');
      }));
      if (!g.gruppen.some(gr => /kuchen/i.test(gr.titel) && !/kaffee/i.test(gr.titel))) {
        const i = g.gruppen.findIndex(gr => /kaffee/i.test(gr.titel));
        g.gruppen.splice(i >= 0 ? i + 1 : g.gruppen.length, 0, ...KUCHEN_GRUPPEN());
      }
      neu.push('Bedarf ↔ Bestellung bei den Getränken', 'Kuchen-Liste');
    }
  }
  if ((d.version || 1) < 3 && !d.bereiche.some(b => b.id === 'material')) {
    d.bereiche.push(MATERIAL());
    neu.push('Reiter „Material“');
  }
  d.version = 3;
  return neu;
}

/** „Bedarf 16,1 l → 2 × Kiste 20 × 0,5 l = 20 l · 3,9 l Reserve“ */
function bedarfText(p) {
  const bedarf = zahl(p.bedarf), inhalt = zahl(p.inhalt), menge = zahl(p.menge);
  const e = p.bedarfEinheit || 'l';
  if (bedarf === '' && inhalt === '') return { text: 'Bedarf und Inhalt je Einheit eintragen, dann wird hier verglichen.', art: 'leer' };
  const teile = [];
  if (bedarf !== '') teile.push(`Bedarf ${mengeText(bedarf)} ${e}`);
  if (menge === '' || inhalt === '') return { text: teile.join('') + ' – Menge oder Inhalt je Einheit fehlt.', art: 'leer' };
  const gesamt = menge * inhalt;
  // Bei reinen Einheiten („kg“, „Stück“) kein „0,5 × kg“, sondern direkt „0,5 kg“
  const nurEinheit = /^(kg|l|stück)$/i.test(String(p.einheit || '').trim());
  teile.push(nurEinheit ? `→ bestellt ${mengeText(gesamt)} ${e}` : `→ ${mengeText(menge)} × ${p.einheit || 'Einheit'} = ${mengeText(gesamt)} ${e}`);
  if (bedarf === '') return { text: teile.join(' '), art: 'leer' };
  const diff = Math.round((gesamt - bedarf) * 100) / 100;
  if (diff === 0) return { text: teile.join(' ') + ' · passt genau', art: 'ok' };
  return diff > 0
    ? { text: teile.join(' ') + ` · ${mengeText(diff)} ${e} Reserve`, art: 'ok' }
    : { text: teile.join(' ') + ` · ⚠ ${mengeText(-diff)} ${e} zu wenig`, art: 'knapp' };
}

/** Kurzform für die Spalte „Bestellt ↔ Bedarf“: „20 l · 3,9 l Reserve“ */
function bedarfKurz(p) {
  const voll = bedarfText(p);
  const bedarf = zahl(p.bedarf), inhalt = zahl(p.inhalt), menge = zahl(p.menge), e = p.bedarfEinheit || 'l';
  if (menge === '' || inhalt === '') return { text: '–', art: 'leer', titel: voll.text };
  const gesamt = menge * inhalt, teil = `${mengeText(gesamt)} ${e}`;
  if (bedarf === '') return { text: teil, art: 'leer', titel: voll.text };
  const diff = Math.round((gesamt - bedarf) * 100) / 100;
  if (diff === 0) return { text: teil + ' · passt genau', art: 'ok', titel: voll.text };
  return diff > 0 ? { text: `${teil} · ${mengeText(diff)} ${e} Reserve`, art: 'ok', titel: voll.text }
    : { text: `${teil} · ⚠ ${mengeText(-diff)} ${e} zu wenig`, art: 'knapp', titel: voll.text };
}

/** Darstellung einer Kategorie: Getränke mit Bedarf, Kuchen-Liste oder normale Positionen. */
function gruppenArt(b, g) {
  if (b.mitBedarf && g.positionen.some(p => zahl(p.bedarf) !== '')) return 'bedarf';
  if (/kuchen/i.test(g.titel)) return 'kuchen';
  return 'normal';
}
const KOPF = {
  normal: ['Position', 'Menge', 'Einheit', 'Preis/Einheit €', 'Summe', 'Status', 'Wer / Anbieter', 'Notiz', ''],
  bedarf: ['Position', 'Bedarf', 'Menge', 'Einheit', 'Inhalt je Einheit', 'Bestellt ↔ Bedarf', 'Preis/Einh. €', 'Summe', 'Status', 'Wer / Anbieter', 'Notiz', ''],
  kuchen: ['Kuchen', 'Von', 'Anzahl', 'Status', 'Notiz', ''],
};
const KOPF_KLASSEN = {
  normal: ['z-was', 'z-menge', 'z-einheit', 'z-preis', 'z-summe', 'z-status', 'z-wer', 'z-notiz', 'z-knoepfe'],
  bedarf: ['z-was', 'z-bedarf', 'z-menge', 'z-einheit', 'z-inhalt', 'z-abgleich', 'z-preis', 'z-summe', 'z-status', 'z-wer', 'z-notiz', 'z-knoepfe'],
  kuchen: ['z-was', 'z-wer', 'z-menge', 'z-status', 'z-notiz', 'z-knoepfe'],
};

// Eingeklappte Gruppen merkt sich nur dieser Browser
const zuKey = (b, g) => b.id + '|' + g.titel;
let zuGruppen = new Set();
try { zuGruppen = new Set(JSON.parse(localStorage.getItem('einladung-kalk-zu') || '[]')); } catch { /* egal */ }
const zuMerken = () => { try { localStorage.setItem('einladung-kalk-zu', JSON.stringify([...zuGruppen])); } catch { /* egal */ } };

function kToast(text) {
  const t = el('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

// ------------------------------------------------------------- Start / Login

async function kStart() {
  if (!K.pw) return kLogin();
  try {
    const r = await api({ aktion: 'admin.kalkulationLaden', passwort: K.pw });
    K.neu = !r.kalkulation;
    K.daten = r.kalkulation || VORLAGE();
    K.stand = K.daten.stand || '';
    // Ältere gespeicherte Stände bekommen Bedarf & Kuchen ergänzt – erst nach „Speichern“ sehen das auch die anderen
    const ergaenzt = migrieren(K.daten);
    K.ergaenzt = K.neu ? [] : ergaenzt;
    K.geaendert = K.ergaenzt.length > 0;
    kZeichnen();
  } catch (e) {
    kLogin(e.message);
  }
}

function kLogin(fehler) {
  const feld = el('input', { type: 'password', id: 'pw', autocomplete: 'current-password' });
  const los = ev => {
    ev.preventDefault();
    K.pw = feld.value;
    try { sessionStorage.setItem('einladung-pw', K.pw); } catch { /* egal */ }
    setzen(kRoot, el('p', { class: 'laden' }, 'Anmelden …'));
    kStart();
  };
  setzen(kRoot, el('form', { class: 'block', style: 'max-width:380px;margin:24px auto', onsubmit: los },
    el('label', { for: 'pw', style: 'display:block;margin-bottom:6px' }, 'Passwort (wie bei der Verwaltung)'),
    feld,
    fehler === 'Falsches Passwort' ? el('p', { class: 'fehler' }, 'Das Passwort stimmt nicht.')
      : fehler ? el('p', { class: 'fehler' }, fehler) : null,
    !window.EINLADUNG_API ? el('p', { class: 'leise' }, 'Demo-Modus – Passwort: demo') : null,
    el('div', { class: 'aktionen' }, el('button', { class: 'knopf', type: 'submit' }, 'Anmelden'))));
  feld.focus();
}

// ------------------------------------------------------------- Anzeige

function geaendert() {
  K.geaendert = true;
  document.querySelectorAll('.ungespeichert').forEach(x => { x.hidden = false; });
  summenAktualisieren();
}

function summenAktualisieren() {
  // Nach Löschen/Verschieben zeigt die Anzeige kurz noch auf alte Stellen – die werden übersprungen, kZeichnen folgt
  document.querySelectorAll('[data-bedarf]').forEach(x => {
    const [b, g, p] = x.dataset.bedarf.split('.').map(Number);
    const pos = K.daten.bereiche[b]?.gruppen[g]?.positionen[p];
    if (!pos) return;
    const r = x.dataset.kurz ? bedarfKurz(pos) : bedarfText(pos);
    x.textContent = r.text; x.className = 'bedarf-text ' + r.art + (x.dataset.kurz ? ' z-abgleich' : '');
    if (r.titel) x.title = r.titel;
  });
  document.querySelectorAll('[data-summe]').forEach(x => {
    const [b, g, p] = x.dataset.summe.split('.').map(Number);
    const ber = K.daten.bereiche[b], gr = ber?.gruppen[g];
    if (!ber || (g >= 0 && !gr) || (p >= 0 && !gr.positionen[p])) return;
    const n = p >= 0 ? summePos(gr.positionen[p]) : g >= 0 ? summeGruppe(gr) : summeBereich(ber);
    x.textContent = p >= 0 && !n ? '–' : euro(n);
  });
  const gesamt = document.querySelector('[data-gesamt]');
  if (gesamt) gesamt.textContent = euro(K.daten.bereiche.reduce((s, b) => s + summeBereich(b), 0));
}

function kZeichnen() {
  const bereiche = K.daten.bereiche;
  const reiter = [...bereiche, { id: 'skizze', titel: 'Skizze' }];
  if (!reiter.some(b => b.id === K.bereich)) K.bereich = bereiche[0].id;
  const bi = bereiche.findIndex(b => b.id === K.bereich);
  const skizze = K.bereich === 'skizze';
  setzen(kRoot,
    el('nav', { class: 'tabs', role: 'tablist' },
      el('a', { class: 'tab-link', href: 'admin.html' }, '← Verwaltung'),
      reiter.map(b => el('button', { role: 'tab', 'aria-selected': String(b.id === K.bereich), onclick: () => {
        K.bereich = b.id;
        try { sessionStorage.setItem('einladung-kalk-bereich', b.id); } catch { /* egal */ }
        kZeichnen();
      } }, b.titel))),
    !window.EINLADUNG_API ? el('div', { class: 'meldung warn' }, 'Demo-Modus: Änderungen werden nur in diesem Browser gespeichert, nichts landet in eurer Tabelle.') : null,
    K.neu ? el('div', { class: 'meldung warn' }, 'Noch nicht gespeichert – das sind die Startwerte. Nach dem ersten „Speichern“ sehen alle mit Passwort denselben Stand.') : null,
    K.ergaenzt.length ? el('div', { class: 'meldung warn' }, `Neu ergänzt: ${K.ergaenzt.join(', ')}. Bitte einmal „Speichern“, damit es auch die anderen sehen.`) : null,
    skizze ? null : el('div', { class: 'kacheln' },
      bereiche.map((b, i) => el('div', { class: 'kachel' }, el('div', { class: 'zahl', 'data-summe': `${i}.-1.-1` }, euro(summeBereich(b))), el('div', { class: 'was' }, b.titel))),
      el('div', { class: 'kachel' }, el('div', { class: 'zahl', 'data-gesamt': '' }), el('div', { class: 'was' }, 'Gesamt (nur Positionen mit Preis)'))),
    skizze ? skizzeAnsicht(K.daten, geaendert) : bereichAnsicht(bereiche[bi], bi),
    el('div', { class: 'leiste' },
      el('div', { class: 'ungespeichert', hidden: !K.geaendert }, 'Ungespeicherte Änderungen'),
      el('button', { class: 'knopf zweit', onclick: () => { if (!K.geaendert || confirm('Ungespeicherte Änderungen verwerfen und neu laden?')) { K.geaendert = false; setzen(kRoot, el('p', { class: 'laden' }, 'Wird geladen …')); kStart(); } } }, 'Neu laden'),
      el('button', { class: 'knopf', onclick: kSpeichern }, 'Speichern')),
    el('p', { class: 'leise mitte' }, K.stand ? `Zuletzt gespeichert: ${K.stand} · auch zu sehen im Google Sheet, Blatt „App-Kalkulation“.` : 'Gespeichert wird im Google Sheet, Blatt „App-Kalkulation“.'));
  summenAktualisieren();
}

function bereichAnsicht(b, bi) {
  const notiz = el('textarea', { rows: 2, 'aria-label': 'Notiz zu ' + b.titel, oninput: e => { b.notiz = e.target.value; geaendert(); } });
  notiz.value = b.notiz || '';
  return el('section', {},
    el('div', { class: 'frage' }, el('label', {}, 'Notiz'), notiz),
    b.gruppen.map((g, gi) => gruppeAnsicht(b, bi, g, gi)),
    el('div', { class: 'aktionen' }, el('button', { class: 'knopf zweit', onclick: () => {
      b.gruppen.push({ titel: 'Neue Kategorie', positionen: [pos('', '', '')] });
      geaendert(); kZeichnen();
      setTimeout(() => { const t = kRoot.querySelectorAll('.gruppe-titel-feld'); t[t.length - 1]?.select(); }, 30);
    } }, '+ Kategorie')));
}

function gruppeAnsicht(b, bi, g, gi) {
  const zu = zuGruppen.has(zuKey(b, g));
  const titel = el('input', { type: 'text', class: 'gruppe-titel-feld', value: g.titel, 'aria-label': 'Name der Kategorie',
    oninput: e => {
      const war = zuKey(b, g); g.titel = e.target.value;
      if (zuGruppen.delete(war)) { zuGruppen.add(zuKey(b, g)); zuMerken(); }
      geaendert();
    } });
  const verschiebeGruppe = d => { const j = gi + d; if (j < 0 || j >= b.gruppen.length) return; [b.gruppen[gi], b.gruppen[j]] = [b.gruppen[j], b.gruppen[gi]]; geaendert(); kZeichnen(); };
  const umschalten = () => { zu ? zuGruppen.delete(zuKey(b, g)) : zuGruppen.add(zuKey(b, g)); zuMerken(); kZeichnen(); };
  // Bedarfsspalten, sobald in der Gruppe irgendwo ein Bedarf steht (dann auch für neue Zeilen)
  const art = gruppenArt(b, g);
  const anzahlKuchen = art === 'kuchen' ? g.positionen.reduce((s, p) => s + (zahl(p.menge) || 0), 0) : 0;
  return el('div', { class: 'kalk-gruppe' + (zu ? ' zu' : '') },
    el('div', { class: 'kalk-gruppe-kopf' },
      el('button', { class: 'aufklapper', 'aria-expanded': String(!zu), 'aria-label': (zu ? 'Aufklappen: ' : 'Zuklappen: ') + g.titel, onclick: umschalten }, '›'),
      titel,
      el('span', { class: 'leise' }, art === 'kuchen' ? `${mengeText(anzahlKuchen)} Kuchen von ${new Set(g.positionen.map(p => p.wer).filter(Boolean)).size} Gästen` : `${g.positionen.length} ${g.positionen.length === 1 ? 'Zeile' : 'Zeilen'}`),
      art === 'kuchen' ? null : el('span', { class: 'kalk-summe', 'data-summe': `${bi}.${gi}.-1` }),
      zu ? null : [
        el('button', { class: 'knopf zweit klein', title: 'Kategorie nach oben', 'aria-label': 'Kategorie nach oben', onclick: () => verschiebeGruppe(-1) }, '↑'),
        el('button', { class: 'knopf zweit klein', title: 'Kategorie nach unten', 'aria-label': 'Kategorie nach unten', onclick: () => verschiebeGruppe(1) }, '↓'),
        el('button', { class: 'knopf zweit klein', onclick: () => {
          if (!confirm(`Kategorie „${g.titel}“ mit ${g.positionen.length} Zeilen löschen?`)) return;
          b.gruppen.splice(gi, 1); geaendert(); kZeichnen();
        } }, 'Kategorie löschen')]),
    zu ? null : [
      el('div', { class: 'kalk-kopfzeile art-' + art, 'aria-hidden': 'true' }, KOPF[art].map((t, i) => el('span', { class: KOPF_KLASSEN[art][i] }, t))),
      ...g.positionen.map((p, pi) => zeileAnsicht(b, bi, g, gi, p, pi, art)),
      el('button', { class: 'knopf zweit klein', style: 'margin-top:8px', onclick: () => {
        g.positionen.push(art === 'kuchen' ? kuchen('', '', '', 'offen') : pos('', '', '')); geaendert(); kZeichnen();
        setTimeout(() => { const z = kRoot.querySelectorAll(`[data-gruppe="${gi}"] .f-was`); z[z.length - 1]?.focus(); }, 30);
      } }, '+ Zeile')]);
}

function zeileAnsicht(b, bi, g, gi, p, pi, art) {
  const mitBedarf = art === 'bedarf';
  const feld = (key, label, attrs = {}, alsZahl = false) => el('input', {
    type: 'text', value: alsZahl ? zahlText(p[key]) : (p[key] ?? ''), 'aria-label': label, placeholder: label, ...attrs,
    oninput: e => { p[key] = alsZahl ? zahl(e.target.value) : e.target.value; geaendert(); },
  });
  const status = el('select', { 'aria-label': 'Status', class: 'z-status status-' + (p.status || 'offen'),
    onchange: e => { p.status = e.target.value; e.target.className = 'z-status status-' + p.status; geaendert(); } },
    STATUS.map(s => el('option', { value: s, selected: s === (p.status || 'offen') }, s)));
  const schieben = d => { const j = pi + d; if (j < 0 || j >= g.positionen.length) return; [g.positionen[pi], g.positionen[j]] = [g.positionen[j], g.positionen[pi]]; geaendert(); kZeichnen(); };
  const knoepfe = el('div', { class: 'kalk-knoepfe z-knoepfe' },
    el('button', { class: 'knopf zweit klein', title: 'Nach oben', 'aria-label': 'Nach oben', onclick: () => schieben(-1) }, '↑'),
    el('button', { class: 'knopf zweit klein', title: 'Nach unten', 'aria-label': 'Nach unten', onclick: () => schieben(1) }, '↓'),
    el('button', { class: 'knopf zweit klein', title: 'Zeile entfernen', 'aria-label': 'Zeile entfernen', onclick: () => {
      if ((p.was || p.notiz) && !confirm(`Zeile „${p.was || 'ohne Namen'}“ entfernen?`)) return;
      g.positionen.splice(pi, 1); geaendert(); kZeichnen();
    } }, '×'));
  const zeile = (...kinder) => el('div', { class: 'kalk-zeile art-' + art, 'data-gruppe': String(gi) }, ...kinder);

  if (art === 'kuchen') {
    return zeile(
      feld('was', 'Kuchen', { class: 'f-was z-was' }),
      feld('wer', 'Von', { class: 'z-wer' }),
      feld('menge', 'Anzahl', { inputmode: 'decimal', class: 'f-zahl z-menge' }, true),
      status,
      feld('notiz', 'Notiz', { class: 'f-notiz z-notiz' }),
      knoepfe);
  }

  const einheitFeld = feld('einheit', 'Einheit', { class: 'z-einheit' });
  einheitFeld.addEventListener('change', () => {
    // Inhalt je Einheit automatisch übernehmen, wenn er sich aus dem Text ablesen lässt (z. B. „Kiste 20 × 0,5 l“)
    const [n] = inhaltAus(p.einheit);
    if (mitBedarf && n !== '' && n !== zahl(p.inhalt)) { p.inhalt = n; geaendert(); kZeichnen(); }
  });
  const menge = feld('menge', 'Menge', { inputmode: 'decimal', class: 'f-zahl z-menge' }, true);
  const preis = feld('preis', 'Preis je Einheit (€)', { inputmode: 'decimal', class: 'f-zahl z-preis' }, true);
  const summe = el('span', { class: 'kalk-summe z-summe', 'data-summe': `${bi}.${gi}.${pi}` });
  const wer = feld('wer', 'Wer / Anbieter', { class: 'z-wer' });
  const notiz = feld('notiz', 'Notiz', { class: 'f-notiz z-notiz' });
  if (!mitBedarf) return zeile(feld('was', 'Position', { class: 'f-was z-was' }), menge, einheitFeld, preis, summe, status, wer, notiz, knoepfe);

  if (!p.bedarfEinheit) p.bedarfEinheit = 'l';
  return zeile(
    feld('was', 'Position', { class: 'f-was z-was' }),
    el('label', { class: 'z-bedarf' }, el('span', { class: 'z-label' }, 'Bedarf'),
      feld('bedarf', 'Bedarf', { inputmode: 'decimal', class: 'f-zahl' }, true),
      feld('bedarfEinheit', 'Einheit des Bedarfs', { class: 'f-mini' })),
    menge, einheitFeld,
    el('label', { class: 'z-inhalt' }, el('span', { class: 'z-label' }, 'Inhalt je Einheit'),
      feld('inhalt', 'Inhalt je Einheit', { inputmode: 'decimal', class: 'f-zahl' }, true)),
    el('span', { 'data-bedarf': `${bi}.${gi}.${pi}`, 'data-kurz': '1', class: 'z-abgleich' }),
    preis, summe, status, wer, notiz, knoepfe);
}

async function kSpeichern(ev) {
  const knopf = ev.target;
  knopf.disabled = true; knopf.textContent = 'Wird gespeichert …';
  try {
    const r = await api({ aktion: 'admin.kalkulationSpeichern', passwort: K.pw, kalkulation: K.daten, stand: K.stand });
    K.daten = r.kalkulation; K.stand = r.kalkulation.stand; K.geaendert = false; K.neu = false;
    kZeichnen(); kToast('Kalkulation gespeichert');
  } catch (e) {
    alert('Speichern fehlgeschlagen: ' + e.message);
    knopf.disabled = false; knopf.textContent = 'Speichern';
  }
}

window.addEventListener('beforeunload', e => { if (K.geaendert) e.preventDefault(); });
kStart();
