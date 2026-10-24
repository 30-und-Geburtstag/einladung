// Kalkulation: Licht & Tontechnik und Getränke – gemeinsam bearbeitbar, gespeichert im Google Sheet (Blatt „App-Kalkulation“).

const kRoot = document.getElementById('kalkulation');
const K = { pw: '', daten: null, stand: '', bereich: 'technik', geaendert: false, neu: false };
try { K.pw = sessionStorage.getItem('einladung-pw') || ''; K.bereich = sessionStorage.getItem('einladung-kalk-bereich') || K.bereich; } catch { /* egal */ }

const STATUS = ['offen', 'angefragt', 'bestellt', 'erledigt'];

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
    K.geaendert = false;
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
  document.querySelectorAll('[data-summe]').forEach(x => {
    const [b, g, p] = x.dataset.summe.split('.').map(Number);
    const ber = K.daten.bereiche[b];
    const n = p >= 0 ? summePos(ber.gruppen[g].positionen[p]) : g >= 0 ? summeGruppe(ber.gruppen[g]) : summeBereich(ber);
    x.textContent = p >= 0 && !n ? '–' : euro(n);
  });
  const gesamt = document.querySelector('[data-gesamt]');
  if (gesamt) gesamt.textContent = euro(K.daten.bereiche.reduce((s, b) => s + summeBereich(b), 0));
}

function kZeichnen() {
  const bereiche = K.daten.bereiche;
  if (!bereiche.some(b => b.id === K.bereich)) K.bereich = bereiche[0].id;
  const bi = bereiche.findIndex(b => b.id === K.bereich);
  setzen(kRoot,
    el('nav', { class: 'tabs', role: 'tablist' },
      el('a', { class: 'tab-link', href: 'admin.html' }, '← Verwaltung'),
      bereiche.map(b => el('button', { role: 'tab', 'aria-selected': String(b.id === K.bereich), onclick: () => {
        K.bereich = b.id;
        try { sessionStorage.setItem('einladung-kalk-bereich', b.id); } catch { /* egal */ }
        kZeichnen();
      } }, b.titel))),
    !window.EINLADUNG_API ? el('div', { class: 'meldung warn' }, 'Demo-Modus: Änderungen werden nur in diesem Browser gespeichert, nichts landet in eurer Tabelle.') : null,
    K.neu ? el('div', { class: 'meldung warn' }, 'Noch nicht gespeichert – das sind die Startwerte. Nach dem ersten „Speichern“ sehen alle mit Passwort denselben Stand.') : null,
    el('div', { class: 'kacheln' },
      bereiche.map((b, i) => el('div', { class: 'kachel' }, el('div', { class: 'zahl', 'data-summe': `${i}.-1.-1` }, euro(summeBereich(b))), el('div', { class: 'was' }, b.titel))),
      el('div', { class: 'kachel' }, el('div', { class: 'zahl', 'data-gesamt': '' }), el('div', { class: 'was' }, 'Gesamt (nur Positionen mit Preis)'))),
    bereichAnsicht(bereiche[bi], bi),
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
      b.gruppen.push({ titel: 'Neue Gruppe', positionen: [pos('', '', '')] });
      geaendert(); kZeichnen();
      setTimeout(() => { const t = kRoot.querySelectorAll('.gruppe-titel-feld'); t[t.length - 1]?.select(); }, 30);
    } }, '+ Gruppe')));
}

function gruppeAnsicht(b, bi, g, gi) {
  const titel = el('input', { type: 'text', class: 'gruppe-titel-feld', value: g.titel, 'aria-label': 'Name der Gruppe',
    oninput: e => { g.titel = e.target.value; geaendert(); } });
  const verschiebeGruppe = d => { const j = gi + d; if (j < 0 || j >= b.gruppen.length) return; [b.gruppen[gi], b.gruppen[j]] = [b.gruppen[j], b.gruppen[gi]]; geaendert(); kZeichnen(); };
  return el('div', { class: 'kalk-gruppe' },
    el('div', { class: 'kalk-gruppe-kopf' }, titel,
      el('span', { class: 'kalk-summe', 'data-summe': `${bi}.${gi}.-1` }),
      el('button', { class: 'knopf zweit klein', title: 'Gruppe nach oben', 'aria-label': 'Gruppe nach oben', onclick: () => verschiebeGruppe(-1) }, '↑'),
      el('button', { class: 'knopf zweit klein', title: 'Gruppe nach unten', 'aria-label': 'Gruppe nach unten', onclick: () => verschiebeGruppe(1) }, '↓'),
      el('button', { class: 'knopf zweit klein', onclick: () => {
        if (!confirm(`Gruppe „${g.titel}“ mit ${g.positionen.length} Positionen löschen?`)) return;
        b.gruppen.splice(gi, 1); geaendert(); kZeichnen();
      } }, 'Gruppe löschen')),
    el('div', { class: 'kalk-kopfzeile', 'aria-hidden': 'true' },
      ['Position', 'Menge', 'Einheit', 'Preis/Einheit €', 'Summe', 'Status', 'Wer / Anbieter', 'Notiz', ''].map(t => el('span', {}, t))),
    g.positionen.map((p, pi) => zeileAnsicht(b, bi, g, gi, p, pi)),
    el('button', { class: 'knopf zweit klein', style: 'margin-top:8px', onclick: () => {
      g.positionen.push(pos('', '', '')); geaendert(); kZeichnen();
      setTimeout(() => { const z = kRoot.querySelectorAll(`[data-gruppe="${gi}"] .f-was`); z[z.length - 1]?.focus(); }, 30);
    } }, '+ Position'));
}

function zeileAnsicht(b, bi, g, gi, p, pi) {
  const feld = (key, label, attrs = {}, alsZahl = false) => el('input', {
    type: 'text', value: alsZahl ? zahlText(p[key]) : (p[key] ?? ''), 'aria-label': label, placeholder: label, ...attrs,
    oninput: e => { p[key] = alsZahl ? zahl(e.target.value) : e.target.value; geaendert(); },
  });
  const status = el('select', { 'aria-label': 'Status', class: 'status-' + (p.status || 'offen'),
    onchange: e => { p.status = e.target.value; e.target.className = 'status-' + p.status; geaendert(); } },
    STATUS.map(s => el('option', { value: s, selected: s === (p.status || 'offen') }, s)));
  const schieben = d => { const j = pi + d; if (j < 0 || j >= g.positionen.length) return; [g.positionen[pi], g.positionen[j]] = [g.positionen[j], g.positionen[pi]]; geaendert(); kZeichnen(); };
  return el('div', { class: 'kalk-zeile', 'data-gruppe': String(gi) },
    feld('was', 'Position', { class: 'f-was' }),
    feld('menge', 'Menge', { inputmode: 'decimal', class: 'f-zahl' }, true),
    feld('einheit', 'Einheit'),
    feld('preis', 'Preis je Einheit (€)', { inputmode: 'decimal', class: 'f-zahl' }, true),
    el('span', { class: 'kalk-summe', 'data-summe': `${bi}.${gi}.${pi}` }),
    status,
    feld('wer', 'Wer / Anbieter'),
    feld('notiz', 'Notiz', { class: 'f-notiz' }),
    el('div', { class: 'kalk-knoepfe' },
      el('button', { class: 'knopf zweit klein', title: 'Nach oben', 'aria-label': 'Nach oben', onclick: () => schieben(-1) }, '↑'),
      el('button', { class: 'knopf zweit klein', title: 'Nach unten', 'aria-label': 'Nach unten', onclick: () => schieben(1) }, '↓'),
      el('button', { class: 'knopf zweit klein', title: 'Position löschen', 'aria-label': 'Position löschen', onclick: () => {
        if ((p.was || p.notiz) && !confirm(`„${p.was || 'Position'}“ löschen?`)) return;
        g.positionen.splice(pi, 1); geaendert(); kZeichnen();
      } }, '×')));
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
