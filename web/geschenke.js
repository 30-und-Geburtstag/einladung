// Geschenke & Dankesnachrichten: wer hat was geschenkt, Beträge, persönliche Dankesnachricht pro Gast, Versand per WhatsApp.

const gRoot = document.getElementById('geschenke');
const G = { pw: '', admin: null, daten: null, stand: '', geaendert: false, suche: '', filter: '' };
try { G.pw = sessionStorage.getItem('einladung-pw') || ''; } catch { /* egal */ }

const gZahl = v => {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim().replace(/\./g, '').replace(',', '.');
  if (s === '') return 0;
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};
const gEuro = n => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const neueId = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function gToast(text) {
  const t = el('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

// ------------------------------------------------------------- Start / Login

async function gStart() {
  if (!G.pw) return gLogin();
  try {
    const [admin, r] = await Promise.all([
      api({ aktion: 'admin.daten', passwort: G.pw }),
      api({ aktion: 'admin.geschenkeLaden', passwort: G.pw }),
    ]);
    G.admin = admin;
    G.daten = r.geschenke || { eintraege: startListe(admin) };
    G.stand = G.daten.stand || '';
    gZeichnen();
  } catch (e) {
    gLogin(e.message);
  }
}

/** Erste Fassung: eine Zeile pro Einladung, die (zumindest teilweise) zugesagt hatte. */
function startListe(admin) {
  return admin.einheiten
    .filter(e => e.status === 'Zugesagt' || e.status === 'Teilweise zugesagt')
    .map(e => ({ id: neueId(), von: e.name, einheit: e.id, geschenk: '', betrag: '', notiz: '', dank: '', verschickt: false, verschicktAm: '' }));
}

function gLogin(fehler) {
  const feld = el('input', { type: 'password', id: 'pw', autocomplete: 'current-password' });
  const los = ev => {
    ev.preventDefault();
    G.pw = feld.value;
    try { sessionStorage.setItem('einladung-pw', G.pw); } catch { /* egal */ }
    setzen(gRoot, el('p', { class: 'laden' }, 'Anmelden …'));
    gStart();
  };
  setzen(gRoot, el('form', { class: 'block', style: 'max-width:380px;margin:24px auto', onsubmit: los },
    el('label', { for: 'pw', style: 'display:block;margin-bottom:6px' }, 'Passwort (wie bei der Verwaltung)'),
    feld,
    fehler === 'Falsches Passwort' ? el('p', { class: 'fehler' }, 'Das Passwort stimmt nicht.')
      : fehler ? el('p', { class: 'fehler' }, fehler) : null,
    !window.EINLADUNG_API ? el('p', { class: 'leise' }, 'Demo-Modus – Passwort: demo') : null,
    el('div', { class: 'aktionen' }, el('button', { class: 'knopf', type: 'submit' }, 'Anmelden'))));
  feld.focus();
}

// ------------------------------------------------------------- Anzeige

const einheitVon = e => G.admin.einheiten.find(x => x.id === e.einheit);

function geaendert() {
  G.geaendert = true;
  document.querySelectorAll('.ungespeichert').forEach(x => { x.hidden = false; });
  kachelnAktualisieren();
}

function kennzahlen() {
  const l = G.daten.eintraege;
  return {
    summe: l.reduce((s, e) => s + gZahl(e.betrag), 0),
    mitGeld: l.filter(e => gZahl(e.betrag) > 0).length,
    erfasst: l.filter(e => e.geschenk.trim() || gZahl(e.betrag) > 0).length,
    dankFertig: l.filter(e => e.dank.trim()).length,
    verschickt: l.filter(e => e.verschickt).length,
    gesamt: l.length,
  };
}

function kachelnAktualisieren() {
  const k = kennzahlen();
  const setze = (sel, text) => { const x = document.querySelector(sel); if (x) x.textContent = text; };
  setze('[data-k="summe"]', gEuro(k.summe));
  setze('[data-k="erfasst"]', `${k.erfasst} von ${k.gesamt}`);
  setze('[data-k="dank"]', `${k.dankFertig} von ${k.gesamt}`);
  setze('[data-k="verschickt"]', `${k.verschickt} von ${k.gesamt}`);
}

function gZeichnen() {
  const k = kennzahlen();
  const kachel = (key, zahl, was) => el('div', { class: 'kachel' }, el('div', { class: 'zahl', 'data-k': key }, zahl), el('div', { class: 'was' }, was));
  const liste = el('div', {});
  const neuListe = () => setzen(liste, ...eintraegeAnsicht());
  setzen(gRoot,
    el('nav', { class: 'tabs' },
      el('a', { class: 'tab-link', href: 'admin.html' }, '← Verwaltung'),
      el('a', { class: 'tab-link', href: 'kalkulation.html' }, 'Kalkulation')),
    el('div', { class: 'kacheln' },
      kachel('summe', gEuro(k.summe), 'Geldgeschenke gesamt'),
      kachel('erfasst', `${k.erfasst} von ${k.gesamt}`, 'Geschenke eingetragen'),
      kachel('dank', `${k.dankFertig} von ${k.gesamt}`, 'Dankesnachricht fertig'),
      kachel('verschickt', `${k.verschickt} von ${k.gesamt}`, 'Dank verschickt')),
    el('div', { class: 'filter', style: 'margin-top:16px' },
      el('input', { type: 'text', placeholder: 'Suchen …', value: G.suche, 'aria-label': 'Suchen', oninput: ev => { G.suche = ev.target.value; neuListe(); } }),
      el('select', { 'aria-label': 'Filtern', style: 'max-width:240px', onchange: ev => { G.filter = ev.target.value; neuListe(); } },
        [['', 'Alle'], ['ohne', 'Noch ohne Geschenk'], ['offen', 'Dank noch nicht verschickt'], ['verschickt', 'Dank verschickt']]
          .map(([v, t]) => el('option', { value: v, selected: G.filter === v }, t)))),
    liste,
    el('div', { class: 'leiste' },
      el('div', { class: 'ungespeichert', hidden: !G.geaendert }, 'Ungespeicherte Änderungen'),
      el('button', { class: 'knopf zweit', onclick: () => {
        G.daten.eintraege.push({ id: neueId(), von: '', einheit: '', geschenk: '', betrag: '', notiz: '', dank: '', verschickt: false, verschicktAm: '' });
        G.filter = ''; G.suche = ''; geaendert(); gZeichnen();
        setTimeout(() => { const f = gRoot.querySelectorAll('.geschenk-karte'); f[f.length - 1]?.scrollIntoView({ behavior: 'smooth' }); f[f.length - 1]?.querySelector('input')?.focus(); }, 50);
      } }, '+ Eintrag'),
      el('button', { class: 'knopf', onclick: gSpeichern }, 'Speichern')));
  neuListe();
}

function eintraegeAnsicht() {
  const s = G.suche.toLowerCase();
  const sichtbar = G.daten.eintraege.filter(e =>
    (!s || [e.von, e.geschenk, e.notiz, einheitVon(e)?.personen.map(p => p.name).join(' ') || ''].join(' ').toLowerCase().includes(s)) &&
    (G.filter !== 'ohne' || (!e.geschenk.trim() && !gZahl(e.betrag))) &&
    (G.filter !== 'offen' || !e.verschickt) &&
    (G.filter !== 'verschickt' || e.verschickt));
  if (!sichtbar.length) return [el('p', { class: 'leise mitte' }, 'Keine Einträge.')];
  return sichtbar.map(e => karte(e));
}

function karte(e) {
  const feld = (label, eingabe) => el('label', { class: 'g-feld' }, el('span', { class: 'l' }, label), eingabe);
  const text = (key, attrs = {}) => el('input', { type: 'text', value: e[key] || '', ...attrs, oninput: ev => { e[key] = ev.target.value; geaendert(); } });
  const dank = el('textarea', { rows: 7, 'aria-label': 'Dankesnachricht für ' + (e.von || 'diesen Eintrag'),
    oninput: ev => { e.dank = ev.target.value; geaendert(); } });
  dank.value = e.dank || '';
  const einheit = einheitVon(e);
  const tel = einheit?.telefon || '';
  const verschicktKnopf = () => el('button', { class: 'knopf zweit klein', onclick: () => {
    e.verschickt = !e.verschickt;
    e.verschicktAm = e.verschickt ? new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '';
    geaendert(); gZeichnen();
  } }, e.verschickt ? 'Verschickt ✓ (zurücknehmen)' : 'Als verschickt markieren');

  return el('div', { class: 'geschenk-karte block' + (e.verschickt ? ' verschickt' : '') },
    el('div', { class: 'g-kopf' },
      el('input', { type: 'text', class: 'g-von', value: e.von, placeholder: 'Von wem?', 'aria-label': 'Von wem',
        oninput: ev => { e.von = ev.target.value; geaendert(); } }),
      e.verschickt ? el('span', { class: 'status zugesagt' }, 'Dank verschickt ' + (e.verschicktAm || '')) : null,
      el('button', { class: 'knopf zweit klein', 'aria-label': 'Eintrag entfernen', onclick: () => {
        if (!confirm(`Eintrag „${e.von || 'ohne Namen'}“ entfernen?`)) return;
        G.daten.eintraege = G.daten.eintraege.filter(x => x !== e); geaendert(); gZeichnen();
      } }, 'Entfernen')),
    einheit ? el('div', { class: 'leise' }, einheit.personen.map(p => p.name).join(', ')) : null,
    el('div', { class: 'g-raster' },
      feld('Geschenk', text('geschenk', { placeholder: 'z. B. Gutschein, Wein, Karte …' })),
      feld('Betrag (€)', el('input', { type: 'text', inputmode: 'decimal', class: 'f-zahl', value: e.betrag ?? '', placeholder: '0',
        oninput: ev => { e.betrag = ev.target.value; geaendert(); } })),
      feld('Einladung (für WhatsApp)', el('select', { onchange: ev => { e.einheit = ev.target.value; geaendert(); gZeichnen(); } },
        el('option', { value: '' }, '– keine –'),
        G.admin.einheiten.map(x => el('option', { value: x.id, selected: x.id === e.einheit }, x.name)))),
      feld('Notiz', text('notiz'))),
    feld('Dankesnachricht', dank),
    el('div', { class: 'knoepfe', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px' },
      el('button', { class: 'knopf klein whatsapp', disabled: !tel, title: tel ? '+' + tel : 'Keine Telefonnummer – Einladung wählen',
        onclick: () => dankSenden(e, tel) }, 'Per WhatsApp senden'),
      el('button', { class: 'knopf zweit klein', onclick: () => kopierenText(e.dank) }, 'Text kopieren'),
      verschicktKnopf()));
}

async function kopierenText(t) {
  try { await navigator.clipboard.writeText(t || ''); gToast('Text kopiert'); }
  catch { prompt('Zum Kopieren markieren:', t || ''); }
}

/** Ohne Bild kann der Text direkt im Chat vorausgefüllt werden (die 1024-Zeichen-Grenze gilt nur für Bildunterschriften). */
function dankSenden(e, tel) {
  if (!e.dank.trim()) return alert('Bitte zuerst eine Dankesnachricht eintragen.');
  const mobil = /Android|iPhone|iPad/i.test(navigator.userAgent);
  let modus = 'app';
  try { modus = localStorage.getItem('einladung-wa') || (mobil ? 'mobil' : 'app'); } catch { /* egal */ }
  const text = encodeURIComponent(e.dank);
  const url = modus === 'web' ? `https://web.whatsapp.com/send?phone=${tel}&text=${text}`
    : modus === 'mobil' ? `https://wa.me/${tel}?text=${text}` : `whatsapp://send?phone=${tel}&text=${text}`;
  if (modus === 'app') location.href = url; else window.open(url, 'whatsapp');
  gToast('Chat geöffnet – danach „Als verschickt markieren“');
}

async function gSpeichern(ev) {
  const knopf = ev.target;
  knopf.disabled = true; knopf.textContent = 'Wird gespeichert …';
  try {
    const r = await api({ aktion: 'admin.geschenkeSpeichern', passwort: G.pw, stand: G.stand, geschenke: G.daten });
    G.daten = r.geschenke; G.stand = r.geschenke.stand; G.geaendert = false;
    gZeichnen(); gToast('Gespeichert');
  } catch (err) {
    alert('Speichern fehlgeschlagen: ' + err.message);
    knopf.disabled = false; knopf.textContent = 'Speichern';
  }
}

window.addEventListener('beforeunload', ev => { if (G.geaendert) ev.preventDefault(); });
gStart();
