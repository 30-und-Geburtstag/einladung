// Admin-Ansicht: Übersicht, Einladungen (Links, QR, Begleittexte), Fragen-Editor, Einstellungen.

const root = document.getElementById('admin');
const A = { pw: '', daten: null, tab: 'uebersicht', fragen: [], geaendert: false, suche: '', statusFilter: '' };
try { A.pw = sessionStorage.getItem('einladung-pw') || ''; A.tab = sessionStorage.getItem('einladung-tab') || A.tab; } catch { /* egal */ }

const TYPEN = { ja_nein: 'Ja / Nein', auswahl: 'Auswahl (eine Antwort)', mehrfach: 'Mehrfachauswahl', text: 'Freitext', zahl: 'Zahl' };
const EBENEN = { Person: 'Für jede Person', Einladung: 'Einmal pro Einladung' };
const BEDINGUNGEN = { immer: 'Immer', dabei: 'Wenn dabei (Nachmittag oder Abend)', nachmittag: 'Wenn beim Nachmittag dabei', abend: 'Wenn beim Abend dabei', frage: 'Wenn eine andere Frage beantwortet wurde mit …' };

const ORT_TEXT = 'Wir feiern im Gewölbekeller im alten Pfarrhaus, Kirchberg 2, 63877 Sailauf. Öffentliche Straßenparkplätze gibt es in der direkten Umgebung am Kirchberg und im Ortskern. Bitte beachtet: Der Zugang zur Location ist nicht barrierefrei.';
const VORLAGEN = {
  'Begleittext Nur Nachmittag': `Hallo 💛
unser Save the Date wird zur Einladung: Am 7. November feiern wir unsere Geburtstage und laden herzlich zu Kaffee und Kuchen von 14 bis 18 Uhr ein! 🥰

Bitte gebt uns bis zum 21. Oktober 2026 verbindlich Bescheid, ob ihr dabei seid – auch wenn es leider nicht klappt. Über euren persönlichen Link oder den QR-Code auf der Karte könnt ihr für jede Person einzeln zu- oder absagen:
{LINK}

${ORT_TEXT}

Trachten aus aller Welt sind willkommen – das Lieblingsoutfit natürlich genauso. 💛
Wir freuen uns auf einen schönen Nachmittag zusammen!
Aysel & Robin`,
  'Begleittext Nachmittag + Abend': `Hallo 💛
unser Save the Date wird zur Einladung: Am 7. November feiern wir unsere Geburtstage – ab 14 Uhr mit Kaffee und Kuchen und ab 19 Uhr mit Buffet, Musik und Party! 🥂

Von 18 bis 19 Uhr bereiten wir alles für den Abend vor. Wer bleibt, darf natürlich vor Ort bleiben und wird auch in dieser Zeit weiter versorgt.

Bitte gebt uns bis zum 21. Oktober 2026 verbindlich Bescheid, ob und wann ihr dabei seid – auch wenn es leider nicht klappt. Über euren persönlichen Link oder den QR-Code auf der Karte könnt ihr für jede Person einzeln angeben, ob sie am Nachmittag, am Abend oder bei beidem dabei ist:
{LINK}

${ORT_TEXT}

Trachten aus aller Welt sind willkommen – das Lieblingsoutfit natürlich genauso. 💛
Wir freuen uns aufs gemeinsame Feiern!
Aysel & Robin`,
  'Begleittext Nur Abend': `Hallo 💛
unser Save the Date wird zur Einladung: Am 7. November feiern wir unsere Geburtstage und laden herzlich ab 19 Uhr zu Buffet, Musik und Party ein! 🥂

Bitte gebt uns bis zum 21. Oktober 2026 verbindlich Bescheid, ob ihr dabei seid – auch wenn es leider nicht klappt. Über euren persönlichen Link oder den QR-Code auf der Karte könnt ihr für jede Person einzeln zu- oder absagen:
{LINK}

${ORT_TEXT}

Trachten aus aller Welt sind willkommen – das Lieblingsoutfit natürlich genauso. 💛
Wir freuen uns auf einen schönen Abend zusammen!
Aysel & Robin`,
};
const EINSTELLUNGEN_FELDER = [
  ['Formular offen', 'jn', 'Wenn „Nein“, können Gäste nichts mehr eintragen (z. B. nach dem Anmeldeschluss).'],
  ['Anmeldeschluss', 'text', 'Wird den Gästen angezeigt, z. B. 21.10.2026.'],
  ['Unsicher erlauben', 'jn', 'Zusätzlich zu „Bin dabei“ / „Leider nicht“ auch „Noch unsicher“ anbieten.'],
  ['Begrüßungstext', 'lang', 'Steht oben auf der Anmeldeseite.'],
  ['Danketext', 'lang', 'Erscheint nach dem Absenden.'],
  ['Webseiten-Adresse', 'text', 'Adresse der Anmeldeseite – daraus werden die persönlichen Links gebaut.'],
  ['Begleittext Nur Nachmittag', 'vorlage', '{LINK} wird durch den persönlichen Link ersetzt.'],
  ['Begleittext Nachmittag + Abend', 'vorlage', ''],
  ['Begleittext Nur Abend', 'vorlage', ''],
  ['Admin-Passwort', 'pw', 'Leer lassen, um das Passwort nicht zu ändern.'],
];

async function adminApi(aktion, extra = {}) {
  return api({ aktion, passwort: A.pw, ...extra });
}

function toast(text) {
  const t = el('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

async function kopieren(text, meldung) {
  try { await navigator.clipboard.writeText(text); toast(meldung); }
  catch { prompt('Zum Kopieren markieren:', text); }
}

// ------------------------------------------------------------- Start / Login

async function adminStart() {
  if (!A.pw) return loginZeigen();
  try {
    A.daten = await adminApi('admin.daten');
    A.fragen = structuredClone(A.daten.fragen);
    zeichneAdmin();
  } catch (e) {
    loginZeigen(e.message);
  }
}

function loginZeigen(fehler) {
  const feld = el('input', { type: 'password', id: 'pw', autocomplete: 'current-password' });
  const los = async ev => {
    ev.preventDefault();
    A.pw = feld.value;
    try { sessionStorage.setItem('einladung-pw', A.pw); } catch { /* egal */ }
    root.replaceChildren(el('p', { class: 'laden' }, 'Anmelden …'));
    adminStart();
  };
  root.replaceChildren(el('form', { class: 'block', style: 'max-width:380px;margin:24px auto', onsubmit: los },
    el('label', { for: 'pw', style: 'display:block;margin-bottom:6px' }, 'Passwort'),
    feld,
    fehler && fehler !== 'Falsches Passwort' ? el('p', { class: 'fehler' }, fehler) : null,
    fehler === 'Falsches Passwort' ? el('p', { class: 'fehler' }, 'Das Passwort stimmt nicht.') : null,
    !window.EINLADUNG_API ? el('p', { class: 'leise' }, 'Demo-Modus – Passwort: demo') : null,
    el('div', { class: 'aktionen' }, el('button', { class: 'knopf', type: 'submit' }, 'Anmelden'))));
  feld.focus();
}

function zeichneAdmin() {
  const tabs = { uebersicht: 'Übersicht', einladungen: 'Einladungen', fragen: 'Fragen', einstellungen: 'Einstellungen' };
  const inhalt = { uebersicht: tabUebersicht, einladungen: tabEinladungen, fragen: tabFragen, einstellungen: tabEinstellungen }[A.tab]();
  root.replaceChildren(
    el('nav', { class: 'tabs', role: 'tablist' }, Object.entries(tabs).map(([k, t]) =>
      el('button', { role: 'tab', 'aria-selected': String(A.tab === k), onclick: () => tabWechsel(k) }, t))),
    !window.EINLADUNG_API ? el('div', { class: 'meldung warn' }, 'Demo-Modus: Es werden nur Beispieldaten in diesem Browser gespeichert, nichts landet in eurer Tabelle.') : null,
    inhalt);
}

function tabWechsel(k) {
  if (A.tab === 'fragen' && A.geaendert && !confirm('Die Fragen haben ungespeicherte Änderungen. Trotzdem wechseln?')) return;
  if (A.tab === 'fragen') { A.fragen = structuredClone(A.daten.fragen); A.geaendert = false; }
  A.tab = k;
  try { sessionStorage.setItem('einladung-tab', k); } catch { /* egal */ }
  zeichneAdmin();
}

// ------------------------------------------------------------- Übersicht

function tabUebersicht() {
  const e = A.daten.einheiten;
  const personen = e.flatMap(x => x.personen);
  const z = (liste, f) => liste.filter(f).length;
  const kachel = (zahl, was) => el('div', { class: 'kachel' }, el('div', { class: 'zahl' }, String(zahl)), el('div', { class: 'was' }, was));
  const zugesagt = personen.filter(p => p.nachmittag === 'Ja' || p.abend === 'Ja');
  return el('div', {},
    el('h3', {}, 'Einladungen'),
    el('div', { class: 'kacheln' },
      kachel(e.length, 'Einladungen gesamt'),
      kachel(z(e, x => x.status !== 'Offen'), 'haben geantwortet'),
      kachel(z(e, x => x.status === 'Offen'), 'noch offen'),
      kachel(z(e, x => x.status === 'Abgesagt'), 'komplett abgesagt')),
    el('h3', { style: 'margin-top:22px' }, 'Personen'),
    el('div', { class: 'kacheln' },
      kachel(z(personen, p => p.nachmittag === 'Ja'), 'Zusagen Nachmittag'),
      kachel(z(personen, p => p.abend === 'Ja'), 'Zusagen Abend'),
      kachel(zugesagt.length, 'kommen insgesamt'),
      kachel(z(personen, p => p.nachmittag === 'Nein' && p.abend !== 'Ja' || p.abend === 'Nein' && p.nachmittag !== 'Ja'), 'sagen komplett ab'),
      kachel(z(personen, p => p.nachmittag === 'Offen' || p.abend === 'Offen'), 'noch ohne Antwort')),
    el('h3', { style: 'margin-top:22px' }, 'Essen (nur Zusagen)'),
    el('div', { class: 'kacheln' },
      kachel(z(zugesagt, p => p.ernaehrung === 'Vegetarisch'), 'vegetarisch'),
      kachel(z(zugesagt, p => p.ernaehrung === 'Vegan'), 'vegan'),
      kachel(z(zugesagt, p => p.ernaehrung === 'Sonstiges'), 'sonstige Ernährung'),
      kachel(z(zugesagt, p => p.gluten === 'Ja'), 'glutenfrei')),
    el('p', { class: 'leise', style: 'margin-top:18px' }, 'Alle Einzelheiten (Getränke, Kuchen, Musikwünsche, Allergien …) stehen in der Tabelle in den Blättern „App-Antworten Personen“ und „App-Antworten Einladungen“.'));
}

// ------------------------------------------------------------- Einladungen

function begleittext(einheit) {
  const umfang = einheit.personen[0]?.umfang || '';
  const key = /nachmittag/i.test(umfang) && /abend/i.test(umfang) ? 'Begleittext Nachmittag + Abend'
    : /nachmittag/i.test(umfang) ? 'Begleittext Nur Nachmittag' : 'Begleittext Nur Abend';
  return (A.daten.einstellungen[key] || VORLAGEN[key]).replaceAll('{LINK}', einheit.link);
}

function tabEinladungen() {
  const suche = el('input', { type: 'text', placeholder: 'Suchen …', value: A.suche, 'aria-label': 'Einladungen durchsuchen',
    oninput: ev => { A.suche = ev.target.value; liste.replaceChildren(tabelle()); } });
  const filter = el('select', { 'aria-label': 'Nach Status filtern', style: 'max-width:220px',
    onchange: ev => { A.statusFilter = ev.target.value; liste.replaceChildren(tabelle()); } },
    ['', 'Offen', 'Zugesagt', 'Teilweise zugesagt', 'Abgesagt', 'Unsicher'].map(s =>
      el('option', { value: s, selected: A.statusFilter === s }, s || 'Alle Status')));
  const ohneLink = A.daten.einheiten.filter(e => !e.link).length;
  const liste = el('div', { class: 'tabellen-huelle' }, tabelle());
  return el('div', {},
    ohneLink ? el('div', { class: 'meldung warn' }, `${ohneLink} Einladungen haben noch keinen Link. Tragt unter „Einstellungen“ die Webseiten-Adresse ein.`) : null,
    el('div', { class: 'filter' }, suche, filter),
    liste);

  function tabelle() {
    const s = A.suche.toLowerCase();
    const zeilen = A.daten.einheiten.filter(e =>
      (!A.statusFilter || e.status === A.statusFilter) &&
      (!s || (e.name + ' ' + e.personen.map(p => p.name).join(' ')).toLowerCase().includes(s)));
    return el('table', { class: 'tabelle' },
      el('thead', {}, el('tr', {}, ['Einladung', 'Personen', 'Status', ''].map(t => el('th', {}, t)))),
      el('tbody', {}, zeilen.map(e => el('tr', {},
        el('td', {}, el('strong', {}, e.name), el('div', { class: 'leise' }, e.id + ' · ' + (e.personen[0]?.umfang || ''))),
        el('td', {}, e.personen.map(p => el('div', {}, p.name, ' ',
          el('span', { class: 'leise' }, [p.nachmittag !== 'Nicht eingeladen' ? 'N: ' + p.nachmittag : '', p.abend !== 'Nicht eingeladen' ? 'A: ' + p.abend : ''].filter(Boolean).join(' · '))))),
        el('td', {}, el('span', { class: 'status ' + e.status.split(' ')[0] }, e.status), e.am ? el('div', { class: 'leise' }, e.am) : null),
        el('td', {}, el('div', { class: 'knoepfe' },
          el('button', { class: 'knopf zweit klein', disabled: !e.link, onclick: () => kopieren(begleittext(e), 'Begleittext kopiert') }, 'Text kopieren'),
          el('button', { class: 'knopf zweit klein', disabled: !e.link, onclick: () => kopieren(e.link, 'Link kopiert') }, 'Link'),
          el('button', { class: 'knopf zweit klein', disabled: !e.link, onclick: () => karteZeigen(e) }, 'Karte'),
          el('a', { class: 'knopf zweit klein', href: e.link || '#', target: '_blank', rel: 'noopener' }, 'Ansehen'))))))
    );
  }
}

function qrCanvas(text, groesse = 600) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(), rand = 2, zelle = Math.floor(groesse / (n + rand * 2));
  const c = document.createElement('canvas');
  c.width = c.height = zelle * (n + rand * 2);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#000';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
    if (qr.isDark(y, x)) ctx.fillRect((x + rand) * zelle, (y + rand) * zelle, zelle, zelle);
  return c;
}

// Kartenvorlagen je Einladungsumfang; das weiße QR-Feld liegt bei allen an derselben Stelle (Anteile der Bildgröße).
const KARTEN = { nachmittag: 'karten/nachmittag.jpg', beides: 'karten/beides.jpg', abend: 'karten/abend.jpg' };
const QR_FELD = { x: 1167 / 1429, y: 1806 / 2000, b: 147 / 1429, h: 143 / 2000 };

function kartenArt(e) {
  const u = e.personen[0]?.umfang || '';
  return /nachmittag/i.test(u) && /abend/i.test(u) ? 'beides' : /nachmittag/i.test(u) ? 'nachmittag' : 'abend';
}

async function karteErzeugen(e) {
  const bild = await new Promise((ok, fehler) => {
    const b = new Image();
    b.onload = () => ok(b);
    b.onerror = () => fehler(new Error('Kartenbild nicht gefunden'));
    b.src = KARTEN[kartenArt(e)];
  });
  const c = document.createElement('canvas');
  c.width = bild.naturalWidth; c.height = bild.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(bild, 0, 0);
  const fx = QR_FELD.x * c.width, fy = QR_FELD.y * c.height, fb = QR_FELD.b * c.width, fh = QR_FELD.h * c.height;
  const qr = qrcode(0, 'M');
  qr.addData(e.link);
  qr.make();
  const n = qr.getModuleCount();
  const seite = Math.min(fb, fh) * 0.86;
  const zelle = seite / n;
  const x0 = fx + (fb - seite) / 2, y0 = fy + (fh - seite) / 2;
  ctx.fillStyle = '#000';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
    if (qr.isDark(y, x)) ctx.fillRect(Math.floor(x0 + x * zelle), Math.floor(y0 + y * zelle), Math.ceil(zelle), Math.ceil(zelle));
  return c;
}

const dateiName = e => `Einladung_${e.id}_${e.name.replace(/[^wäöüÄÖÜß-]+/g, '_')}`;

async function karteZeigen(e) {
  const zu = () => hg.remove();
  const inhalt = el('div', {}, el('p', { class: 'laden' }, 'Karte wird erstellt …'));
  const hg = el('div', { class: 'modal-hg', onclick: ev => { if (ev.target === hg) zu(); } },
    el('div', { class: 'modal', role: 'dialog', 'aria-label': 'Karte ' + e.name }, el('h3', {}, e.name), inhalt));
  document.body.append(hg);
  const karte = await karteErzeugen(e);
  const qr = qrCanvas(e.link);
  karte.style.cssText = 'width:100%;max-height:60vh;object-fit:contain;background:none;border-radius:4px';
  inhalt.replaceChildren(karte,
    el('div', { style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px' },
      el('a', { class: 'knopf klein', href: karte.toDataURL('image/jpeg', 0.92), download: dateiName(e) + '.jpg' }, 'Karte herunterladen'),
      el('a', { class: 'knopf zweit klein', href: qr.toDataURL('image/png'), download: 'QR_' + dateiName(e) + '.png' }, 'Nur QR'),
      el('button', { class: 'knopf zweit klein', onclick: () => kopieren(begleittext(e), 'Begleittext kopiert') }, 'Text kopieren'),
      el('button', { class: 'knopf zweit klein', onclick: zu }, 'Schließen')));
}

// ------------------------------------------------------------- Fragen-Editor

function tabFragen() {
  const geaendert = () => { A.geaendert = true; };
  const neuZeichnen = () => { geaendert(); zeichneAdmin(); };
  const speichern = async () => {
    for (const f of A.fragen) {
      if (!f.frage.trim()) return alert('Eine Frage hat noch keinen Text.');
      if (['auswahl', 'mehrfach'].includes(f.typ) && f.optionen.filter(o => o.trim()).length < 2) return alert(`„${f.frage}“ braucht mindestens zwei Antwortmöglichkeiten.`);
    }
    try {
      const r = await adminApi('admin.fragenSpeichern', { fragen: A.fragen.map(f => ({ ...f, optionen: f.optionen.map(o => o.trim()).filter(Boolean) })) });
      A.daten.fragen = r.fragen; A.fragen = structuredClone(r.fragen); A.geaendert = false;
      zeichneAdmin(); toast('Fragen gespeichert');
    } catch (e) { alert('Speichern fehlgeschlagen: ' + e.message); }
  };
  const neueFrage = () => {
    A.fragen.push({ id: 'frage_' + Math.random().toString(36).slice(2, 7), aktiv: true, ebene: 'Person', typ: 'ja_nein', frage: '', hilfe: '', optionen: [], pflicht: false, bedingung: 'dabei', zielspalte: '' });
    neuZeichnen();
    setTimeout(() => { const f = root.querySelectorAll('.frage-edit'); f[f.length - 1]?.scrollIntoView({ behavior: 'smooth' }); f[f.length - 1]?.querySelector('input')?.focus(); }, 50);
  };

  return el('div', {},
    el('p', { class: 'leise' }, 'Hier legt ihr fest, was die Gäste gefragt werden. Die Teilnahme (Nachmittag/Abend) wird immer abgefragt und muss hier nicht stehen. Änderungen gelten sofort nach dem Speichern – auch für Gäste, die schon geantwortet haben.'),
    A.fragen.map((f, i) => frageEditor(f, i, neuZeichnen, geaendert)),
    el('div', { class: 'leiste' },
      A.geaendert ? el('div', { class: 'ungespeichert' }, 'Ungespeicherte Änderungen') : null,
      el('button', { class: 'knopf zweit', onclick: neueFrage }, '+ Neue Frage'),
      el('button', { class: 'knopf', onclick: speichern }, 'Speichern')));
}

function frageEditor(f, i, neuZeichnen, geaendert) {
  const verschieben = d => { const j = i + d; if (j < 0 || j >= A.fragen.length) return; [A.fragen[i], A.fragen[j]] = [A.fragen[j], A.fragen[i]]; neuZeichnen(); };
  const feld = (label, inhalt, ganz) => el('div', { class: ganz ? 'ganz' : '' }, el('label', { class: 'l' }, label), inhalt);
  const auswahl = (wert, optionen, beiAenderung) => el('select', { onchange: e => beiAenderung(e.target.value) },
    Object.entries(optionen).map(([k, t]) => el('option', { value: k, selected: k === wert }, t)));
  const text = (wert, beiAenderung, attrs = {}) => el('input', { type: 'text', value: wert, ...attrs, oninput: e => { beiAenderung(e.target.value); geaendert(); } });

  // Bedingung „frage:ID=Wert“ zerlegen
  const m = String(f.bedingung).match(/^frage:([^=]+)=(.*)$/);
  const bedArt = m ? 'frage' : (BEDINGUNGEN[f.bedingung] ? f.bedingung : 'immer');
  const andere = A.fragen.filter(x => x !== f && ['ja_nein', 'auswahl', 'mehrfach'].includes(x.typ) && x.ebene === f.ebene);
  const bedFrage = m ? A.fragen.find(x => x.id === m[1]) : null;
  const bedWerte = bedFrage ? (bedFrage.typ === 'ja_nein' ? ['Ja', 'Nein'] : bedFrage.optionen) : [];

  const spalten = f.ebene === 'Einladung' ? A.daten.spaltenEinladung : A.daten.spaltenPerson;
  const zielOptionen = { '': '— nur in den App-Antworten —' };
  spalten.forEach(s => { zielOptionen[s] = s; });
  if (f.zielspalte && !zielOptionen[f.zielspalte]) zielOptionen[f.zielspalte] = f.zielspalte + ' (nicht gefunden)';

  return el('div', { class: 'frage-edit' + (f.aktiv ? '' : ' aus') },
    el('div', { class: 'kopfzeile' },
      el('span', { class: 'nr' }, `Frage ${i + 1}`, f.aktiv ? '' : ' · ausgeblendet'),
      el('div', { style: 'display:flex;gap:6px' },
        el('button', { class: 'knopf zweit klein', title: 'Nach oben', 'aria-label': 'Nach oben', onclick: () => verschieben(-1) }, '↑'),
        el('button', { class: 'knopf zweit klein', title: 'Nach unten', 'aria-label': 'Nach unten', onclick: () => verschieben(1) }, '↓'),
        el('button', { class: 'knopf zweit klein', onclick: () => {
          if (!confirm(`Frage „${f.frage || 'ohne Text'}“ löschen? Tipp: „Ausblenden“ behält sie für später.`)) return;
          A.fragen.splice(i, 1); neuZeichnen();
        } }, 'Löschen'))),
    el('div', { class: 'raster' },
      feld('Frage', text(f.frage, v => { f.frage = v; }, { placeholder: 'z. B. Kommt ihr mit dem Auto?' }), true),
      feld('Hilfetext (optional, klein darunter)', text(f.hilfe, v => { f.hilfe = v; }), true),
      feld('Antwortart', auswahl(f.typ, TYPEN, v => { f.typ = v; if (['auswahl', 'mehrfach'].includes(v) && f.optionen.length < 2) f.optionen = [...f.optionen, '', ''].slice(0, Math.max(2, f.optionen.length)); neuZeichnen(); })),
      feld('Gefragt wird', auswahl(f.ebene, EBENEN, v => { f.ebene = v; f.zielspalte = ''; neuZeichnen(); })),
      ['auswahl', 'mehrfach'].includes(f.typ) ? feld('Antwortmöglichkeiten', el('div', { class: 'optionen-liste' },
        f.optionen.map((o, j) => el('div', { class: 'opt' },
          text(o, v => { f.optionen[j] = v; }, { 'aria-label': `Antwort ${j + 1}` }),
          el('button', { class: 'knopf zweit klein', 'aria-label': 'Antwort entfernen', onclick: () => { f.optionen.splice(j, 1); neuZeichnen(); } }, '×'))),
        el('button', { class: 'knopf zweit klein', onclick: () => { f.optionen.push(''); neuZeichnen(); } }, '+ Antwort')), true) : null,
      feld('Anzeigen', el('div', {},
        auswahl(bedArt, BEDINGUNGEN, v => {
          f.bedingung = v === 'frage' ? `frage:${andere[0]?.id || ''}=` : v; neuZeichnen();
        }),
        bedArt === 'frage' ? el('div', { style: 'display:flex;gap:6px;margin-top:6px' },
          el('select', { 'aria-label': 'Abhängige Frage', onchange: e => { f.bedingung = `frage:${e.target.value}=`; neuZeichnen(); } },
            andere.map(x => el('option', { value: x.id, selected: m && x.id === m[1] }, x.frage || x.id))),
          el('select', { 'aria-label': 'Antwort', onchange: e => { f.bedingung = `frage:${m[1]}=${e.target.value}`; neuZeichnen(); } },
            el('option', { value: '' }, '– Antwort –'),
            bedWerte.map(w => el('option', { value: w, selected: m && m[2] === w }, w)))) : null)),
      feld('Zusätzlich eintragen in Spalte', auswahl(f.zielspalte, zielOptionen, v => { f.zielspalte = v; geaendert(); })),
      el('div', { class: 'ganz haken' },
        el('label', {}, el('input', { type: 'checkbox', checked: f.pflicht, onchange: e => { f.pflicht = e.target.checked; geaendert(); } }), 'Pflichtfrage'),
        el('label', {}, el('input', { type: 'checkbox', checked: f.aktiv, onchange: e => { f.aktiv = e.target.checked; neuZeichnen(); } }), 'Anzeigen (sonst ausgeblendet)'))));
}

// ------------------------------------------------------------- Einstellungen

function tabEinstellungen() {
  const st = A.daten.einstellungen;
  const werte = {};
  const felder = EINSTELLUNGEN_FELDER.map(([key, art, hilfe]) => {
    const id = 'st-' + key.replace(/\W+/g, '-');
    let input;
    const start = art === 'pw' ? '' : (st[key] ?? VORLAGEN[key] ?? '');
    werte[key] = start;
    if (art === 'jn') {
      input = el('select', { id, onchange: e => { werte[key] = e.target.value; } },
        ['Ja', 'Nein'].map(v => el('option', { value: v, selected: String(start).toLowerCase() === v.toLowerCase() }, v)));
    } else if (art === 'lang' || art === 'vorlage') {
      input = el('textarea', { id, rows: art === 'vorlage' ? 12 : 3, oninput: e => { werte[key] = e.target.value; } });
      input.value = start;
    } else {
      input = el('input', { id, type: art === 'pw' ? 'password' : 'text', value: start, autocomplete: art === 'pw' ? 'new-password' : 'off',
        oninput: e => { werte[key] = e.target.value; } });
    }
    return el('div', { class: 'frage' }, el('label', { for: id }, key), hilfe ? el('div', { class: 'hilfe' }, hilfe) : null, input);
  });
  const speichern = async () => {
    try {
      A.daten = await adminApi('admin.einstellungenSpeichern', { einstellungen: werte });
      if (werte['Admin-Passwort']) { A.pw = werte['Admin-Passwort']; try { sessionStorage.setItem('einladung-pw', A.pw); } catch { /* egal */ } }
      zeichneAdmin(); toast('Einstellungen gespeichert');
    } catch (e) { alert('Speichern fehlgeschlagen: ' + e.message); }
  };
  return el('div', {}, felder,
    el('div', { class: 'leiste' },
      el('button', { class: 'knopf zweit', onclick: () => { try { sessionStorage.removeItem('einladung-pw'); } catch { /* egal */ } location.reload(); } }, 'Abmelden'),
      el('button', { class: 'knopf', onclick: speichern }, 'Speichern')));
}

window.addEventListener('beforeunload', e => { if (A.geaendert) e.preventDefault(); });
adminStart();
