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
unser Save the Date wird zur Einladung: Am 7. November feiern wir unsere Geburtstage und laden herzlich zu Kaffee und Kuchen von 14 bis 17 Uhr ein! 🥰

Bitte gebt uns bis zum 21. Oktober 2026 verbindlich Bescheid, ob ihr dabei seid – auch wenn es leider nicht klappt. Über euren persönlichen Link oder den QR-Code auf der Karte könnt ihr für jede Person einzeln zu- oder absagen:
{LINK}

${ORT_TEXT}

Trachten aus aller Welt sind willkommen – das Lieblingsoutfit natürlich genauso. 💛
Wir freuen uns auf einen schönen Nachmittag zusammen!
Aysel & Robin`,
  'Begleittext Nachmittag + Abend': `Hallo 💛
unser Save the Date wird zur Einladung: Am 7. November feiern wir unsere Geburtstage – ab 14 Uhr mit Kaffee und Kuchen und ab 18 Uhr mit Buffet, Musik und Party! 🥂

Von 17 bis 18 Uhr bereiten wir alles für den Abend vor. Wer bleibt, darf natürlich vor Ort bleiben und wird auch in dieser Zeit weiter versorgt.

Bitte gebt uns bis zum 21. Oktober 2026 verbindlich Bescheid, ob und wann ihr dabei seid – auch wenn es leider nicht klappt. Über euren persönlichen Link oder den QR-Code auf der Karte könnt ihr für jede Person einzeln angeben, ob sie am Nachmittag, am Abend oder bei beidem dabei ist:
{LINK}

${ORT_TEXT}

Trachten aus aller Welt sind willkommen – das Lieblingsoutfit natürlich genauso. 💛
Wir freuen uns aufs gemeinsame Feiern!
Aysel & Robin`,
  'Begleittext Nur Abend': `Hallo 💛
unser Save the Date wird zur Einladung: Am 7. November feiern wir unsere Geburtstage und laden herzlich ab 18 Uhr zu Buffet, Musik und Party ein! 🥂

Bitte gebt uns bis zum 21. Oktober 2026 verbindlich Bescheid, ob ihr dabei seid – auch wenn es leider nicht klappt. Über euren persönlichen Link oder den QR-Code auf der Karte könnt ihr für jede Person einzeln zu- oder absagen:
{LINK}

${ORT_TEXT}

Trachten aus aller Welt sind willkommen – das Lieblingsoutfit natürlich genauso. 💛
Wir freuen uns auf einen schönen Abend zusammen!
Aysel & Robin`,
};
// Zeiten: Kaffee & Kuchen 14–17 Uhr, Buffet & Party ab 18 Uhr – korrigiert auch bereits im Sheet gespeicherte Begleittexte.
const neueZeiten = t => String(t)
  .replace(/Von 18 bis 19 Uhr bereiten/g, 'Von 17 bis 18 Uhr bereiten')
  .replace(/1[45] bis 18 Uhr/g, '14 bis 17 Uhr')
  .replace(/ab 1[45] Uhr mit Kaffee/g, 'ab 14 Uhr mit Kaffee')
  .replace(/ab 19 Uhr/g, 'ab 18 Uhr');

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
    setzen(root, el('p', { class: 'laden' }, 'Anmelden …'));
    adminStart();
  };
  setzen(root, el('form', { class: 'block', style: 'max-width:380px;margin:24px auto', onsubmit: los },
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
  setzen(root, 
    el('nav', { class: 'tabs', role: 'tablist' }, Object.entries(tabs).map(([k, t]) =>
      el('button', { role: 'tab', 'aria-selected': String(A.tab === k), onclick: () => tabWechsel(k) }, t)),
      el('a', { class: 'tab-link', href: 'kalkulation.html' }, 'Kalkulation →')),
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

const TEILNAHME_ARTEN = ['Nur Nachmittag', 'Nachmittag + Abend', 'Nur Abend'];

function teilnahme(p) {
  if (p.nachmittag === 'Ja' && p.abend === 'Ja') return 'Nachmittag + Abend';
  if (p.nachmittag === 'Ja') return 'Nur Nachmittag';
  if (p.abend === 'Ja') return 'Nur Abend';
  if (p.nachmittag === 'Unsicher' || p.abend === 'Unsicher') return 'Unsicher';
  if (p.nachmittag === 'Nein' || p.abend === 'Nein') return 'Abgesagt';
  return 'Noch offen';
}

/** Anzeige-Status: „Versandt“ (gelb) ersetzt „Offen“, sobald die Einladung verschickt wurde. */
function anzeigeStatus(e) {
  if ((!e.status || e.status === 'Offen') && e.versendet) return { text: 'Versandt', klasse: 'versandt' };
  const s = e.status || 'Offen';
  const klasse = { 'Zugesagt': 'zugesagt', 'Teilweise zugesagt': 'teilweise', 'Abgesagt': 'abgesagt', 'Unsicher': 'unsicher' }[s] || 'offen';
  return { text: s, klasse };
}

/** Wann eine Einladung kommt – für Kuchen & Co. (Nachmittag hat Vorrang, weil Kuchen zum Kaffee gehört). */
function einladungKommt(e) {
  const t = e.personen.map(teilnahme);
  if (t.some(x => x === 'Nur Nachmittag' || x === 'Nachmittag + Abend')) return t.some(x => x === 'Nachmittag + Abend' || x === 'Nur Abend') ? 'Nachmittag + Abend' : 'Nachmittag';
  if (t.includes('Nur Abend')) return 'Abend';
  return 'kommt nicht';
}

// Darstellung der Namenslisten: a = aufklappen, b = Fenster, c = Seitenleiste – umschaltbar, im Browser gemerkt
const DARSTELLUNGEN = { b: 'Fenster', a: 'Aufklappen', c: 'Seitenleiste' };
function darstellung() {
  const url = (new URLSearchParams(location.search).get('design') || '').toLowerCase();
  if (DARSTELLUNGEN[url]) return url;
  try { const g = localStorage.getItem('einladung-darstellung'); if (DARSTELLUNGEN[g]) return g; } catch { /* egal */ }
  return 'b';
}

function darstellungWahl() {
  return el('div', { class: 'darstellung-wahl' }, el('span', { class: 'leise' }, 'Namen anzeigen als'),
    el('div', { class: 'wahl', role: 'group', 'aria-label': 'Darstellung der Namenslisten' },
      Object.entries(DARSTELLUNGEN).map(([k, t]) => el('button', { type: 'button', 'aria-pressed': String(darstellung() === k),
        onclick: () => {
          try { localStorage.setItem('einladung-darstellung', k); } catch { /* egal */ }
          if (new URLSearchParams(location.search).has('design')) history.replaceState(null, '', location.pathname + location.search.replace(/[?&]design=[^&]*/, '').replace(/^&/, '?'));
          document.querySelectorAll('.namen-panel, .namen-leiste, .modal-hg.namen-fenster').forEach(x => x.remove());
          zeichneAdmin();
        } }, t))));
}

/** Kachel, die beim Anklicken die zugehörigen Namen zeigt. eintraege: [{ name, gruppe?, info? }] */
function kachel(zahl, was, eintraege) {
  if (!eintraege) return el('div', { class: 'kachel' }, el('div', { class: 'zahl' }, String(zahl)), el('div', { class: 'was' }, was));
  const k = el('button', { type: 'button', class: 'kachel klickbar', 'aria-expanded': 'false', title: 'Namen anzeigen',
    onclick: () => namenZeigen(k, was, zahl, eintraege) },
    el('div', { class: 'zahl' }, String(zahl)), el('div', { class: 'was' }, was), el('div', { class: 'pfeil', 'aria-hidden': 'true' }, '›'));
  return k;
}

function namenListe(eintraege, gruppieren) {
  if (!eintraege.length) return el('p', { class: 'leise' }, 'Niemand.');
  if (!gruppieren) {
    return el('div', { class: 'namen-chips' }, eintraege.map(x =>
      el('span', { class: 'chip' }, x.name, x.info ? el('span', { class: 'chip-info' }, ' · ' + x.info) : null)));
  }
  const gruppen = new Map();
  eintraege.forEach(x => { const g = x.gruppe || x.name; if (!gruppen.has(g)) gruppen.set(g, []); gruppen.get(g).push(x); });
  return el('div', { class: 'namen-gruppen' }, [...gruppen].map(([g, liste]) => el('div', { class: 'namen-gruppe' },
    el('div', { class: 'gruppe-titel' }, g),
    liste.filter(x => x.name !== g || x.info).map(x => el('div', { class: 'gruppe-zeile' },
      x.name !== g ? x.name : '', x.info ? el('span', { class: 'leise' }, (x.name !== g ? ' · ' : '') + x.info) : null)))));
}

function namenZeigen(kachelEl, titel, zahl, eintraege) {
  document.querySelectorAll('.kachel.klickbar[aria-expanded="true"]').forEach(k => { if (k !== kachelEl) k.setAttribute('aria-expanded', 'false'); });
  const offen = kachelEl.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.namen-panel, .namen-leiste, .modal-hg.namen-fenster').forEach(x => x.remove());
  if (offen) { kachelEl.setAttribute('aria-expanded', 'false'); return; }
  kachelEl.setAttribute('aria-expanded', 'true');
  const zu = () => { document.querySelectorAll('.namen-panel, .namen-leiste, .modal-hg.namen-fenster').forEach(x => x.remove()); kachelEl.setAttribute('aria-expanded', 'false'); };
  const kopf = el('div', { class: 'namen-kopf' }, el('strong', {}, `${titel} (${zahl})`),
    el('button', { class: 'knopf zweit klein', 'aria-label': 'Schließen', onclick: zu }, '×'));

  const design = darstellung();
  if (design === 'a') {
    // Aufklappen: Panel direkt unter der Kachelreihe, über die volle Breite
    kachelEl.closest('.kacheln').after(el('div', { class: 'namen-panel', role: 'region', 'aria-label': titel }, kopf, namenListe(eintraege, false)));
  } else if (design === 'c') {
    // Seitenleiste rechts – Kacheln bleiben sichtbar, man kann direkt die nächste anklicken
    document.body.append(el('aside', { class: 'namen-leiste', role: 'complementary', 'aria-label': titel }, kopf, namenListe(eintraege, true)));
  } else {
    // Fenster in der Mitte, Namen nach Einladung gruppiert
    const hg = el('div', { class: 'modal-hg namen-fenster', onclick: ev => { if (ev.target === hg) zu(); } },
      el('div', { class: 'modal breit links', role: 'dialog', 'aria-label': titel }, kopf, namenListe(eintraege, true)));
    document.body.append(hg);
  }
}

function tabUebersicht() {
  const e = A.daten.einheiten;
  const personen = e.flatMap(x => x.personen.map(p => ({ ...p, einladung: x.name, teil: teilnahme(p) })));
  const pe = (f, info) => personen.filter(f).map(p => ({ name: p.name, gruppe: p.einladung, info: info ? info(p) : '' }));
  const ee = (f, info) => e.filter(f).map(x => ({ name: x.name, info: info ? info(x) : '' }));
  const pk = (was, f, info) => { const l = pe(f, info); return kachel(l.length, was, l); };
  const ek = (was, f, info) => { const l = ee(f, info); return kachel(l.length, was, l); };
  const ist = (...t) => p => t.includes(p.teil);
  const fragen = A.daten.fragen.filter(f => f.aktiv);
  const kuchenFrage = fragen.find(f => f.id === 'kuchen');

  const aktualisieren = async ev => {
    ev.target.disabled = true; ev.target.textContent = 'Wird aktualisiert …';
    try { A.daten = await adminApi('admin.tabellenAktualisieren'); zeichneAdmin(); toast('Tabellen aktualisiert'); }
    catch (err) { alert('Hat nicht geklappt: ' + err.message); ev.target.disabled = false; }
  };

  return el('div', {},
    el('div', { class: 'uebersicht-kopf' }, el('p', { class: 'leise' }, 'Tipp: Auf eine Kachel klicken, um die Namen zu sehen.'), darstellungWahl()),
    el('h3', {}, 'Einladungen'),
    el('div', { class: 'kacheln' },
      ek('Einladungen gesamt', () => true, x => anzeigeStatus(x).text),
      ek('versandt', x => x.versendet, x => x.versendetAm.split(' ')[0].replace(/,$/, '')),
      ek('haben geantwortet', x => x.status && x.status !== 'Offen', x => x.status),
      ek('noch ohne Antwort', x => !x.status || x.status === 'Offen', x => x.versendet ? 'versandt' : 'noch nicht versandt'),
      ek('komplett abgesagt', x => x.status === 'Abgesagt')),
    el('h3', { style: 'margin-top:22px' }, 'Personen'),
    el('div', { class: 'kacheln' },
      pk('Zusagen Nachmittag', ist('Nur Nachmittag', 'Nachmittag + Abend')),
      pk('Zusagen Abend', ist('Nur Abend', 'Nachmittag + Abend')),
      pk('kommen insgesamt', ist(...TEILNAHME_ARTEN), p => p.teil),
      pk('nur Nachmittag', ist('Nur Nachmittag')),
      pk('Nachmittag + Abend', ist('Nachmittag + Abend')),
      pk('nur Abend', ist('Nur Abend')),
      pk('Absagen', ist('Abgesagt')),
      pk('noch offen / unsicher', ist('Noch offen', 'Unsicher'), p => p.teil === 'Unsicher' ? 'unsicher' : '')),
    kuchenFrage ? [
      el('h3', { style: 'margin-top:22px' }, 'Kuchen'),
      el('div', { class: 'kacheln' },
        ek('bringen Kuchen mit', x => x.antworten?.kuchen === 'Ja', x => [x.antworten?.kuchen_art, einladungKommt(x)].filter(Boolean).join(' · ')),
        ek('davon nachmittags da', x => x.antworten?.kuchen === 'Ja' && einladungKommt(x).startsWith('Nachmittag'), x => x.antworten?.kuchen_art || ''),
        ek('davon nur abends da', x => x.antworten?.kuchen === 'Ja' && einladungKommt(x) === 'Abend', x => x.antworten?.kuchen_art || ''))] : null,
    fragen.map(f => frageAuswertung(f, personen, e)),
    el('div', { class: 'aktionen' },
      el('p', { class: 'leise' }, 'Die Blätter „App-Antworten Personen“, „App-Antworten Einladungen“ und „App-Auswertung“ werden bei jeder Rückmeldung und beim Speichern der Fragen automatisch neu erstellt.'),
      el('button', { class: 'knopf zweit', onclick: aktualisieren }, 'Tabellen jetzt neu erstellen')));
}

function frageAuswertung(f, personen, einheiten) {
  const auswahl = ['ja_nein', 'auswahl', 'mehrfach'].includes(f.typ);
  const treffer = (w, o) => Array.isArray(w) ? w.includes(o) : String(w ?? '') === o;
  const hatWert = w => w != null && w !== '' && !(Array.isArray(w) && !w.length);
  const titel = el('h3', { style: 'margin-top:26px' }, f.frage, f.ebene === 'Einladung' ? el('span', { class: 'leise' }, ' · pro Einladung') : null);

  if (f.ebene === 'Person') {
    const dabei = personen.filter(p => TEILNAHME_ARTEN.includes(p.teil) && hatWert(p.antworten?.[f.id]));
    if (auswahl) {
      const optionen = f.typ === 'ja_nein' ? ['Ja', 'Nein'] : [...f.optionen];
      const n = (o, t) => dabei.filter(p => p.teil === t && treffer(p.antworten[f.id], o)).length;
      return el('div', {}, titel, el('div', { class: 'tabellen-huelle' }, el('table', { class: 'tabelle auswertung' },
        el('thead', {}, el('tr', {}, ['Antwort', 'Nur Nachm.', 'Nachm. + Abend', 'Nur Abend', 'Σ Nachmittag', 'Σ Abend', 'Gesamt'].map(t => el('th', {}, t)))),
        el('tbody', {}, optionen.map(o => {
          const nN = n(o, 'Nur Nachmittag'), nNA = n(o, 'Nachmittag + Abend'), nA = n(o, 'Nur Abend');
          return el('tr', { class: nN + nNA + nA ? '' : 'leer' },
            el('td', {}, o), ...[nN, nNA, nA, nN + nNA, nA + nNA, nN + nNA + nA].map((x, i) => el('td', { class: i >= 3 ? 'zahl summe' : 'zahl' }, String(x))));
        })))));
    }
    return el('div', {}, titel, antwortListe(dabei.map(p => [p.name + ' · ' + p.teil, p.antworten[f.id]])));
  }
  const mitAntwort = einheiten.filter(x => hatWert(x.antworten?.[f.id]));
  // Bei Kuchen (und allen Fragen pro Einladung) dazuschreiben, wann die Einladung da ist
  const wann = x => ' · ' + einladungKommt(x);
  if (auswahl) {
    const optionen = f.typ === 'ja_nein' ? ['Ja', 'Nein'] : [...f.optionen];
    return el('div', {}, titel, el('div', { class: 'kacheln' }, optionen.map(o => {
      const l = mitAntwort.filter(x => treffer(x.antworten[f.id], o)).map(x => ({ name: x.name, info: einladungKommt(x) }));
      return kachel(l.length, o, l);
    })),
    f.typ === 'ja_nein' ? antwortListe(mitAntwort.filter(x => x.antworten[f.id] === 'Ja').map(x => [x.name + wann(x), 'Ja']), true) : null);
  }
  return el('div', {}, titel, antwortListe(mitAntwort.map(x => [x.name + wann(x), x.antworten[f.id]])));
}

function antwortListe(eintraege, nurNamen = false) {
  if (!eintraege.length) return el('p', { class: 'leise' }, 'Noch keine Antworten.');
  return el('ul', { class: 'antwortliste' }, eintraege.map(([wer, w]) =>
    el('li', {}, el('strong', {}, wer), nurNamen ? null : ': ' + [].concat(w).join(', '))));
}

// ------------------------------------------------------------- Einladungen

function begleittext(einheit) {
  const umfang = einheit.personen[0]?.umfang || '';
  const key = /nachmittag/i.test(umfang) && /abend/i.test(umfang) ? 'Begleittext Nachmittag + Abend'
    : /nachmittag/i.test(umfang) ? 'Begleittext Nur Nachmittag' : 'Begleittext Nur Abend';
  return neueZeiten(A.daten.einstellungen[key] || VORLAGEN[key]).replaceAll('{LINK}', einheit.link);
}

A.auswahl = new Set();
A.listenFilter = A.listenFilter || '';

function tabEinladungen() {
  const neu = () => setzen(liste, tabelle());
  const suche = el('input', { type: 'text', placeholder: 'Suchen …', value: A.suche, 'aria-label': 'Einladungen durchsuchen',
    oninput: ev => { A.suche = ev.target.value; neu(); } });
  const filter = el('select', { 'aria-label': 'Nach Status filtern', style: 'max-width:200px',
    onchange: ev => { A.statusFilter = ev.target.value; neu(); } },
    ['', 'Offen', 'Versandt', 'Zugesagt', 'Teilweise zugesagt', 'Abgesagt', 'Unsicher'].map(s =>
      el('option', { value: s, selected: A.statusFilter === s }, s || 'Alle Status')));
  const listen = el('select', { 'aria-label': 'Nach Liste filtern', style: 'max-width:180px',
    onchange: ev => { A.listenFilter = ev.target.value; neu(); } },
    ['', 'Hauptliste', 'Optional'].map(s => el('option', { value: s, selected: A.listenFilter === s }, s || 'Alle Listen')));
  const ohneLink = A.daten.einheiten.filter(e => !e.link).length;
  const liste = el('div', { class: 'tabellen-huelle' }, tabelle());
  return el('div', {},
    ohneLink ? el('div', { class: 'meldung warn' }, `${ohneLink} Einladungen haben noch keinen Link. Tragt unter „Einstellungen“ die Webseiten-Adresse ein.`) : null,
    el('div', { class: 'filter' }, suche, filter, listen),
    liste);

  function sichtbar() {
    const s = A.suche.toLowerCase();
    return A.daten.einheiten.filter(e =>
      (!A.statusFilter || anzeigeStatus(e).text === A.statusFilter) &&
      (!A.listenFilter || e.listenstatus === A.listenFilter) &&
      (!s || (e.name + ' ' + e.personen.map(p => p.name).join(' ')).toLowerCase().includes(s)));
  }

  function tabelle() {
    const zeilen = sichtbar();
    const waehlbar = zeilen.filter(e => e.telefon && e.link);
    const alleGewaehlt = waehlbar.length > 0 && waehlbar.every(e => A.auswahl.has(e.id));
    const umschalten = (e, an) => { an ? A.auswahl.add(e.id) : A.auswahl.delete(e.id); neu(); };
    const gewaehlt = A.daten.einheiten.filter(e => A.auswahl.has(e.id));
    return el('div', {},
      el('div', { class: 'auswahlleiste' },
        el('button', { class: 'knopf zweit klein', onclick: () => {
          A.daten.einheiten.filter(e => e.listenstatus === 'Hauptliste' && e.telefon && e.link && !e.versendet).forEach(e => A.auswahl.add(e.id)); neu();
        } }, 'Hauptliste (noch nicht versandt) wählen'),
        el('button', { class: 'knopf zweit klein', disabled: !A.auswahl.size, onclick: () => { A.auswahl.clear(); neu(); } }, 'Auswahl aufheben'),
        el('span', { class: 'leise' }, `${A.auswahl.size} ausgewählt`),
        el('button', { class: 'knopf klein whatsapp', disabled: !gewaehlt.length, onclick: () => versandAssistent(gewaehlt) },
          `Per WhatsApp senden (${gewaehlt.length})`)),
      el('table', { class: 'tabelle' },
        el('thead', {}, el('tr', {},
          el('th', {}, el('input', { type: 'checkbox', 'aria-label': 'Alle sichtbaren auswählen', checked: alleGewaehlt, disabled: !waehlbar.length,
            onchange: ev => { waehlbar.forEach(e => ev.target.checked ? A.auswahl.add(e.id) : A.auswahl.delete(e.id)); neu(); } })),
          ['Einladung', 'Personen', 'Status', ''].map(t => el('th', {}, t)))),
        el('tbody', {}, zeilen.map(e => {
          const st = anzeigeStatus(e);
          return el('tr', { class: A.auswahl.has(e.id) ? 'gewaehlt' : '' },
            el('td', {}, el('input', { type: 'checkbox', 'aria-label': e.name + ' auswählen', checked: A.auswahl.has(e.id),
              disabled: !e.telefon || !e.link, title: e.telefon ? '' : 'Keine Telefonnummer hinterlegt',
              onchange: ev => umschalten(e, ev.target.checked) })),
            el('td', {}, el('strong', {}, e.name),
              el('div', { class: 'leise' }, [e.id, e.personen[0]?.umfang, e.listenstatus].filter(Boolean).join(' · ')),
              el('div', { class: 'leise' }, e.telefon ? '+' + e.telefon : 'keine Telefonnummer')),
            el('td', {}, e.personen.map(p => el('div', {}, p.name, ' ',
              el('span', { class: 'leise' }, [p.nachmittag !== 'Nicht eingeladen' ? 'N: ' + p.nachmittag : '', p.abend !== 'Nicht eingeladen' ? 'A: ' + p.abend : ''].filter(Boolean).join(' · '))))),
            el('td', {}, el('span', { class: 'status ' + st.klasse }, st.text),
              st.klasse === 'versandt' ? el('div', { class: 'leise' }, e.versendetAm) : e.am ? el('div', { class: 'leise' }, e.am) : null,
              e.versendet && st.klasse !== 'versandt' ? el('div', { class: 'leise' }, 'versandt ' + e.versendetAm.split(' ')[0].replace(/,$/, '')) : null),
            el('td', {}, el('div', { class: 'knoepfe' },
              el('button', { class: 'knopf klein whatsapp', disabled: !e.telefon || !e.link, title: e.telefon ? '' : 'Keine Telefonnummer hinterlegt',
                onclick: () => versandAssistent([e]) }, 'WhatsApp'),
              el('button', { class: 'knopf zweit klein', disabled: !e.link, onclick: () => karteZeigen(e) }, 'Karte'),
              el('button', { class: 'knopf zweit klein', disabled: !e.link, onclick: () => kopieren(begleittext(e), 'Begleittext kopiert') }, 'Text'),
              el('a', { class: 'knopf zweit klein', href: e.link || '#', target: '_blank', rel: 'noopener' }, 'Ansehen'),
              el('button', { class: 'knopf zweit klein', onclick: () => versandSetzen([e.id], !e.versendet) },
                e.versendet ? 'Versand zurücksetzen' : 'Als versandt markieren'))));
        }))));
  }
}

async function versandSetzen(ids, versandt, medium = 'WhatsApp') {
  try {
    A.daten = await adminApi('admin.versandMarkieren', { ids, medium, zuruecksetzen: !versandt });
    if (A.tab === 'einladungen' && !document.querySelector('.modal-hg')) zeichneAdmin();
  } catch (err) { alert('Versand konnte nicht gespeichert werden: ' + err.message); }
}

// ------------------------------------------------------------- WhatsApp-Versand

const MOBIL = /Android|iPhone|iPad/i.test(navigator.userAgent);
function waModus() { try { return localStorage.getItem('einladung-wa') || (MOBIL ? 'mobil' : 'app'); } catch { return MOBIL ? 'mobil' : 'app'; } }

// Chat bewusst OHNE vorausgefüllten Text öffnen: Sonst macht WhatsApp den Text beim Einfügen der Karte zur
// Bildunterschrift – die ist auf 1024 Zeichen begrenzt (Telegram ebenso), und der Begleittext wird abgeschnitten.
function waLink(e) {
  const modus = waModus();
  if (modus === 'web') return `https://web.whatsapp.com/send?phone=${e.telefon}`;
  if (modus === 'mobil') return `https://wa.me/${e.telefon}`;
  return `whatsapp://send?phone=${e.telefon}`;
}

/** Karte mittig auf ein schwarzes Quadrat setzen – Chat-Vorschauen schneiden hohe Bilder sonst oben und unten ab. */
function quadratisch(karte) {
  const c = document.createElement('canvas');
  c.width = c.height = Math.max(karte.width, karte.height);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(karte, (c.width - karte.width) / 2, (c.height - karte.height) / 2);
  return c;
}

async function karteKopieren(blob) {
  try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); return true; }
  catch { return false; }
}

/** Führt nacheinander durch die ausgewählten Einladungen: Karte kopieren + Chat mit Text öffnen, danach als versandt markieren. */
function versandAssistent(liste) {
  const queue = liste.filter(e => e.telefon && e.link);
  let i = 0, blob = null, gesendet = 0;
  const inhalt = el('div', {});
  const zu = () => { hg.remove(); zeichneAdmin(); };
  const hg = el('div', { class: 'modal-hg' }, el('div', { class: 'modal breit', role: 'dialog', 'aria-label': 'WhatsApp-Versand' }, inhalt));
  document.body.append(hg);

  const modusWahl = () => el('label', { class: 'leise', style: 'display:flex;gap:8px;align-items:center;justify-content:center;margin-top:10px' }, 'WhatsApp öffnen über',
    el('select', { style: 'max-width:200px;padding:4px 8px', onchange: ev => { try { localStorage.setItem('einladung-wa', ev.target.value); } catch { /* egal */ } } },
      [['app', 'WhatsApp-App (PC)'], ['web', 'WhatsApp Web'], ['mobil', 'Handy (wa.me)']].map(([v, t]) => el('option', { value: v, selected: waModus() === v }, t))));

  async function zeige() {
    if (i >= queue.length) {
      setzen(inhalt, el('h3', {}, 'Fertig ', el('span', { class: 'herz' }, '♥')),
        el('p', {}, `${gesendet} von ${queue.length} Einladungen als versandt eingetragen.`),
        el('button', { class: 'knopf', onclick: zu }, 'Schließen'));
      return;
    }
    const e = queue[i];
    blob = null;
    const vorschau = el('div', { class: 'laden' }, 'Karte wird erstellt …');
    const oeffnen = el('button', { class: 'knopf whatsapp', disabled: true }, '1. Karte kopieren & Chat öffnen');
    const textKnopf = el('button', { class: 'knopf whatsapp', onclick: () => kopieren(begleittext(e), 'Text kopiert – im Chat Strg + V, dann Enter') }, '2. Begleittext kopieren');
    const teilen = navigator.canShare ? el('button', { class: 'knopf zweit', disabled: true }, 'Karte über Handy teilen …') : null;
    const weiter = el('button', { class: 'knopf', onclick: async () => {
      weiter.disabled = true; weiter.textContent = 'Wird eingetragen …';
      await versandSetzen([e.id], true);
      gesendet++; i++; zeige();
    } }, '3. Gesendet ✓ – weiter');
    setzen(inhalt, 
      el('div', { class: 'leise' }, `Einladung ${i + 1} von ${queue.length}`),
      el('h3', {}, e.name),
      el('div', { class: 'leise' }, '+' + e.telefon + ' · ' + (e.personen[0]?.umfang || '')),
      e.versendet ? el('div', { class: 'meldung warn' }, `Wurde bereits am ${e.versendetAm} versandt.`) : null,
      vorschau,
      el('ol', { class: 'anleitung' },
        el('li', {}, '„Karte kopieren & Chat öffnen“ – im Chat Strg + V und Enter: die Karte geht allein raus.'),
        el('li', {}, 'Zurück hierher, „Begleittext kopieren“ – im Chat Strg + V und Enter: der Text kommt als eigene Nachricht.'),
        el('li', {}, '„Gesendet – weiter“ trägt den Versand in die Tabelle ein.')),
      el('p', { class: 'leise' }, 'Bitte den Text nicht als Bildunterschrift zur Karte schicken – WhatsApp und Telegram kürzen Bildunterschriften nach 1024 Zeichen.'),
      el('div', { class: 'knoepfe-mitte' }, oeffnen, textKnopf, teilen),
      el('div', { class: 'knoepfe-mitte' }, weiter,
        el('button', { class: 'knopf zweit', onclick: () => { i++; zeige(); } }, 'Überspringen'),
        el('button', { class: 'knopf zweit', onclick: zu }, 'Beenden')),
      modusWahl());

    const karte = quadratisch(await karteErzeugen(e));
    karte.style.cssText = 'width:180px;border-radius:4px;display:block;margin:10px auto';
    vorschau.replaceWith(karte);
    blob = await new Promise(ok => karte.toBlob(ok, 'image/png'));
    oeffnen.disabled = false;
    oeffnen.onclick = async () => {
      // Kopieren starten und den Chat sofort öffnen (noch innerhalb des Klicks, sonst blockiert der Browser)
      const kopiert = karteKopieren(blob);
      const url = waLink(e);
      if (waModus() === 'app') location.href = url; else window.open(url, 'whatsapp');
      const ok = await kopiert;
      toast(ok ? 'Karte kopiert – im Chat Strg + V' : 'Karte konnte nicht kopiert werden – bitte „Karte“ herunterladen');
    };
    if (teilen) {
      const datei = new File([blob], dateiName(e) + '.png', { type: 'image/png' });
      if (navigator.canShare({ files: [datei] })) {
        teilen.disabled = false;
        // nur die Karte teilen – der Text kommt getrennt über „Begleittext kopieren“ (sonst wird er zur gekürzten Bildunterschrift)
        teilen.onclick = () => navigator.share({ files: [datei] }).catch(() => {});
      } else teilen.remove();
    }
  }
  zeige();
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

const dateiName = e => `Einladung_${e.id}_${e.name.replace(/[^\wäöüÄÖÜß-]+/g, '_')}`;

async function karteZeigen(e) {
  const zu = () => hg.remove();
  const inhalt = el('div', {}, el('p', { class: 'laden' }, 'Karte wird erstellt …'));
  const hg = el('div', { class: 'modal-hg', onclick: ev => { if (ev.target === hg) zu(); } },
    el('div', { class: 'modal', role: 'dialog', 'aria-label': 'Karte ' + e.name }, el('h3', {}, e.name), inhalt));
  document.body.append(hg);
  const karte = await karteErzeugen(e);
  const qr = qrCanvas(e.link);
  karte.style.cssText = 'width:100%;max-height:60vh;object-fit:contain;background:none;border-radius:4px';
  setzen(inhalt, karte,
    el('div', { style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px' },
      el('a', { class: 'knopf klein', href: quadratisch(karte).toDataURL('image/jpeg', 0.92), download: dateiName(e) + '_Chat.jpg' }, 'Karte für Chats'),
      el('a', { class: 'knopf zweit klein', href: karte.toDataURL('image/jpeg', 0.92), download: dateiName(e) + '.jpg' }, 'Original'),
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
    const start = art === 'pw' ? '' : art === 'vorlage' ? neueZeiten(st[key] ?? VORLAGEN[key]) : (st[key] ?? VORLAGEN[key] ?? '');
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

// Escape schließt eine offene Namensliste
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Escape') return;
  const offen = document.querySelector('.kachel.klickbar[aria-expanded="true"]');
  if (offen) { offen.click(); offen.focus(); }
});
window.addEventListener('beforeunload', e => { if (A.geaendert) e.preventDefault(); });
adminStart();
