// Gastansicht: lädt die Einladung zum Code aus dem Link (?c=...) und sendet die Rückmeldung.

async function api(req) {
  if (!window.EINLADUNG_API) return window.DEMO_API(req);
  const res = await fetch(window.EINLADUNG_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(req),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.fehler || 'Unbekannter Fehler');
  return data;
}

/** Gleiche Logik wie im Google-Skript (Code.gs → bedingungErfuellt_). */
function bedingungErfuellt(bed, ctx) {
  bed = String(bed || 'immer').trim();
  const teil = (p, t) => p[t] === 'Ja' || p[t] === 'Unsicher';
  const liste = ctx.person ? [ctx.person] : ctx.personen;
  if (bed === 'immer' || bed === '') return true;
  if (bed === 'dabei') return liste.some(p => teil(p, 'nachmittag') || teil(p, 'abend'));
  if (bed === 'nachmittag') return liste.some(p => teil(p, 'nachmittag'));
  if (bed === 'abend') return liste.some(p => teil(p, 'abend'));
  const m = bed.match(/^frage:([^=]+)=(.*)$/);
  if (m) {
    const w = ctx.antworten[m[1]];
    return Array.isArray(w) ? w.includes(m[2]) : String(w ?? '') === m[2];
  }
  return true;
}

const el = (tag, attrs = {}, ...kinder) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const k of kinder.flat()) if (k != null && k !== false) e.append(k);
  return e;
};

const app = document.getElementById('app');
const zustand = { daten: null, personen: [], antworten: {}, fehler: {}, gesendet: false, sendet: false };

async function start() {
  const code = new URLSearchParams(location.search).get('c');
  if (!code) {
    app.replaceChildren(el('div', { class: 'meldung warn mitte' },
      'Bitte öffnet die Seite über euren persönlichen Link oder den QR-Code auf eurer Einladung.'));
    return;
  }
  try {
    const d = await api({ aktion: 'gast.laden', code });
    zustand.daten = d;
    zustand.personen = d.einheit.personen.map(p => ({
      id: p.id,
      name: p.antwort?.name || '',
      nachmittag: p.nachmittagEingeladen ? (gueltig(p.antwort?.nachmittag) || '') : 'Nicht eingeladen',
      abend: p.abendEingeladen ? (gueltig(p.antwort?.abend) || '') : 'Nicht eingeladen',
      antworten: { ...(p.antwort?.antworten || {}) },
    }));
    zustand.antworten = { ...(d.einheit.antworten || {}) };
    zustand.gesendet = !!d.einheit.gesendetAm;
    zeichnen();
  } catch (e) {
    app.replaceChildren(el('div', { class: 'meldung warn mitte' }, e.message));
  }
}

function gueltig(w) { return ['Ja', 'Nein', 'Unsicher'].includes(w) ? w : ''; }

function zeichnen() {
  const { daten } = zustand;
  if (zustand.gesendet) return zeichneDanke();
  const st = daten.einstellungen;
  const teile = [
    el('h2', {}, `Hallo ${daten.einheit.name} `, el('span', { class: 'herz' }, '♥')),
    st.begruessung && el('p', { class: 'mitte' }, st.begruessung),
    st.anmeldeschluss && el('p', { class: 'mitte leise' }, `Bitte meldet euch bis zum ${st.anmeldeschluss} verbindlich an – auch wenn es leider nicht klappt.`),
  ];
  if (!st.offen) {
    teile.push(el('div', { class: 'meldung warn mitte' }, 'Die Online-Anmeldung ist geschlossen. Bitte meldet euch direkt bei Aysel oder Robin.'));
    app.replaceChildren(...teile, infoBloecke());
    return;
  }
  daten.einheit.personen.forEach((p, i) => teile.push(personBlock(p, zustand.personen[i])));

  const fragenE = sichtbareFragen('Einladung', { personen: zustand.personen, antworten: zustand.antworten });
  if (fragenE.length) {
    teile.push(el('div', { class: 'block' },
      el('h3', {}, daten.einheit.personen.length > 1 ? 'Für euch alle' : 'Noch ein paar Fragen'),
      fragenE.map(f => frageFeld(f, zustand.antworten, 'E'))));
  }
  const anzahlFehler = Object.keys(zustand.fehler).length;
  teile.push(el('div', { class: 'aktionen' },
    anzahlFehler ? el('p', { class: 'fehler' }, 'Bitte ergänzt noch die markierten Angaben.') : null,
    el('button', { class: 'knopf', disabled: zustand.sendet, onclick: senden }, zustand.sendet ? 'Wird gesendet …' : 'Rückmeldung senden')));
  teile.push(infoBloecke());
  app.replaceChildren(...teile);
}

function personBlock(p, a) {
  const fehltTeil = zustand.fehler[p.id + ':teil'];
  const optionen = ['Ja', 'Nein'].concat(zustand.daten.einstellungen.unsicherErlaubt ? ['Unsicher'] : []);
  const anzeige = { Ja: 'Bin dabei', Nein: 'Leider nicht', Unsicher: 'Noch unsicher' };
  const teil = (schluessel, titel, zeit) => el('div', { class: 'teil' },
    el('div', { class: 'titel' }, titel, ' ', el('span', { class: 'zeit' }, zeit)),
    wahlKnoepfe(optionen.map(o => [o, anzeige[o]]), a[schluessel], w => { a[schluessel] = w; pruefenFalls(); zeichnen(); }));
  const ctx = { person: a, antworten: a.antworten };
  const kind = /^Kind/i.test(p.vorname);
  return el('div', { class: 'block person' + (fehltTeil || zustand.fehler[p.id + ':name'] ? ' fehlt' : '') },
    el('h3', {}, p.platzhalter ? (kind ? 'Euer Kind' : 'Eure Begleitung') : `${p.vorname} ${p.nachname}`.trim()),
    p.platzhalter ? el('div', { class: 'frage' },
      el('label', { for: 'name-' + p.id }, kind ? 'Name des Kindes' : 'Name der Begleitung'),
      el('input', { type: 'text', id: 'name-' + p.id, value: a.name, placeholder: 'Vor- und Nachname', autocomplete: 'off',
        oninput: e => { a.name = e.target.value; } }),
      zustand.fehler[p.id + ':name'] ? el('div', { class: 'fehler' }, 'Bitte tragt den Namen ein.') : null) : null,
    p.nachmittagEingeladen ? teil('nachmittag', 'Kaffee & Kuchen', '· 14 bis 18 Uhr') : null,
    p.abendEingeladen ? teil('abend', 'Buffet & Party', '· ab 19 Uhr') : null,
    fehltTeil ? el('div', { class: 'fehler' }, 'Bitte gebt an, ob diese Person dabei ist.') : null,
    sichtbareFragen('Person', ctx).map(f => frageFeld(f, a.antworten, p.id)));
}

function sichtbareFragen(ebene, ctx) {
  return zustand.daten.fragen.filter(f => f.ebene === ebene && bedingungErfuellt(f.bedingung, ctx));
}

function wahlKnoepfe(optionen, aktuell, beiWahl, mehrfach = false) {
  return el('div', { class: 'wahl', role: 'group' }, optionen.map(([wert, text]) => {
    const an = mehrfach ? (aktuell || []).includes(wert) : aktuell === wert;
    return el('button', { type: 'button', 'aria-pressed': String(an), onclick: () => beiWahl(wert) }, text);
  }));
}

function frageFeld(f, ziel, praefix) {
  const id = `f-${praefix}-${f.id}`;
  const fehlt = zustand.fehler[praefix + ':' + f.id];
  const wert = ziel[f.id];
  let feld;
  const neu = w => { ziel[f.id] = w; pruefenFalls(); zeichnen(); };
  switch (f.typ) {
    case 'ja_nein':
      feld = wahlKnoepfe([['Ja', 'Ja'], ['Nein', 'Nein']], wert, neu); break;
    case 'auswahl':
      feld = wahlKnoepfe(f.optionen.map(o => [o, o]), wert, neu); break;
    case 'mehrfach':
      feld = wahlKnoepfe(f.optionen.map(o => [o, o]), wert, o => {
        const liste = new Set(wert || []);
        liste.has(o) ? liste.delete(o) : liste.add(o);
        neu(f.optionen.filter(x => liste.has(x)));
      }, true); break;
    case 'zahl':
      feld = el('input', { type: 'number', id, inputmode: 'numeric', min: 0, value: wert ?? '', style: 'max-width:140px',
        oninput: e => { ziel[f.id] = e.target.value; } }); break;
    default:
      feld = el('textarea', { id, rows: 2, oninput: e => { ziel[f.id] = e.target.value; } });
      feld.value = wert || '';
  }
  const textFeld = f.typ === 'text' || f.typ === 'zahl';
  return el('div', { class: 'frage' },
    el(textFeld ? 'label' : 'div', textFeld ? { for: id } : { class: 'titel' }, f.frage, f.pflicht ? el('span', { class: 'pflicht' }, ' *') : null),
    f.hilfe ? el('div', { class: 'hilfe' }, f.hilfe) : null,
    feld,
    fehlt ? el('div', { class: 'fehler' }, 'Bitte beantworten.') : null);
}

function leer(w) { return w == null || (Array.isArray(w) ? w.length === 0 : String(w).trim() === ''); }

function pruefen() {
  const fehler = {};
  zustand.daten.einheit.personen.forEach((p, i) => {
    const a = zustand.personen[i];
    if ((p.nachmittagEingeladen && !a.nachmittag) || (p.abendEingeladen && !a.abend)) fehler[p.id + ':teil'] = true;
    const dabei = ['Ja', 'Unsicher'].includes(a.nachmittag) || ['Ja', 'Unsicher'].includes(a.abend);
    if (p.platzhalter && dabei && !a.name.trim()) fehler[p.id + ':name'] = true;
    sichtbareFragen('Person', { person: a, antworten: a.antworten })
      .forEach(f => { if (f.pflicht && leer(a.antworten[f.id])) fehler[p.id + ':' + f.id] = true; });
  });
  sichtbareFragen('Einladung', { personen: zustand.personen, antworten: zustand.antworten })
    .forEach(f => { if (f.pflicht && leer(zustand.antworten[f.id])) fehler['E:' + f.id] = true; });
  zustand.fehler = fehler;
  return Object.keys(fehler).length === 0;
}

// Nach dem ersten Absendeversuch Markierungen live aktualisieren.
let geprueft = false;
function pruefenFalls() { if (geprueft) pruefen(); }

/** Nur Antworten auf Fragen senden, die gerade sichtbar sind. */
function sichtbareAntworten(ebene, ctx, quelle) {
  const out = {};
  sichtbareFragen(ebene, ctx).forEach(f => { if (!leer(quelle[f.id])) out[f.id] = quelle[f.id]; });
  return out;
}

async function senden() {
  geprueft = true;
  if (!pruefen()) {
    zeichnen();
    document.querySelector('.fehlt, .fehler')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  zustand.sendet = true; zeichnen();
  try {
    await api({
      aktion: 'gast.senden',
      code: new URLSearchParams(location.search).get('c'),
      personen: zustand.personen.map(a => ({
        id: a.id, name: a.name.trim(), nachmittag: a.nachmittag, abend: a.abend,
        antworten: sichtbareAntworten('Person', { person: a, antworten: a.antworten }, a.antworten),
      })),
      antworten: sichtbareAntworten('Einladung', { personen: zustand.personen, antworten: zustand.antworten }, zustand.antworten),
    });
    zustand.gesendet = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    alert('Das hat leider nicht geklappt: ' + e.message + '\nBitte versucht es gleich noch einmal.');
  }
  zustand.sendet = false; zeichnen();
}

function zeichneDanke() {
  const { daten } = zustand;
  const zeile = (p, a) => {
    const name = p.platzhalter ? (a.name || (/^Kind/i.test(p.vorname) ? 'Kind' : 'Begleitung')) : `${p.vorname} ${p.nachname}`.trim();
    const wort = { Ja: 'dabei', Nein: 'nicht dabei', Unsicher: 'noch unsicher' };
    const teile = [];
    if (p.nachmittagEingeladen) teile.push('Nachmittag ' + (wort[a.nachmittag] || 'offen'));
    if (p.abendEingeladen) teile.push('Abend ' + (wort[a.abend] || 'offen'));
    return el('li', {}, el('strong', {}, name), ' – ', teile.join(' · '));
  };
  app.replaceChildren(
    el('h2', {}, 'Danke! ', el('span', { class: 'herz' }, '♥')),
    el('div', { class: 'meldung ok' },
      el('p', { style: 'margin-top:0' }, daten.einstellungen.danke),
      el('ul', {}, daten.einheit.personen.map((p, i) => zeile(p, zustand.personen[i])))),
    daten.einstellungen.offen ? el('div', { class: 'aktionen' },
      el('button', { class: 'knopf zweit', onclick: () => { zustand.gesendet = false; zeichnen(); } }, 'Antwort ändern')) : null,
    infoBloecke());
}

function infoBloecke() {
  const karte = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Kirchberg 2, 63877 Sailauf');
  return el('section', { class: 'infos' },
    el('div', { class: 'block' }, el('div', { class: 'titel' }, 'Wann'),
      'Samstag, 7. November 2026', el('br'), 'Kaffee & Kuchen 14–18 Uhr', el('br'), 'Buffet & Party ab 19 Uhr'),
    el('div', { class: 'block' }, el('div', { class: 'titel' }, 'Wo'),
      'Gewölbekeller im alten Pfarrhaus', el('br'), 'Kirchberg 2, 63877 Sailauf', el('br'),
      el('a', { href: karte, target: '_blank', rel: 'noopener' }, 'In Karten öffnen')),
    el('div', { class: 'block' }, el('div', { class: 'titel' }, 'Anfahrt'),
      'Öffentliche Straßenparkplätze gibt es in der direkten Umgebung am Kirchberg und im Ortskern. Der Zugang zur Location ist nicht barrierefrei.'),
    el('div', { class: 'block' }, el('div', { class: 'titel' }, 'Outfit'),
      'Dirndl, Sari, Lederhose – Trachten aus aller Welt sind willkommen, das Lieblingsoutfit natürlich genauso.'));
}

if (app) start();
