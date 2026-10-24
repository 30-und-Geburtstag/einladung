/**
 * Einladung Aysel & Robin – Backend im Google Sheet.
 *
 * Einbau: Google Sheet öffnen → Erweiterungen → Apps Script → diesen Code einfügen →
 * Funktion "einrichten" einmal ausführen → Bereitstellen als Web-App
 * (Ausführen als: Ich, Zugriff: Jeder).
 *
 * Die Blattnamen und Spaltenüberschriften unten müssen exakt zu eurer Tabelle passen.
 */

const BLATT_PERSONEN = 'Gästeliste – Personen';
const BLATT_EINHEITEN = 'Versand & Einladungen';
const BLATT_FRAGEN = 'App-Fragen';
const BLATT_EINSTELLUNGEN = 'App-Einstellungen';
const BLATT_ANTW_PERSONEN = 'App-Antworten Personen';
const BLATT_ANTW_EINHEITEN = 'App-Antworten Einladungen';
const BLATT_PROTOKOLL = 'App-Protokoll';
const BLATT_KALKULATION = 'App-Kalkulation';

const SP = {
  personId: 'Person-ID',
  einheitId: 'Einladungseinheit-ID',
  vorname: 'Vorname',
  nachname: 'Nachname',
  umfang: 'Einladungsumfang',
  nachmittag: 'Finale Teilnahme Nachmittag',
  abend: 'Finale Teilnahme Abend',
  bemerkungPerson: 'Bemerkungen zur Person',
  bezeichnung: 'Bezeichnung / Empfänger',
  rueckmeldung: 'Einladung Rückmeldung',
  rueckmeldungAm: 'Einladung Rückmeldung am',
  rueckmeldungUeber: 'Einladung Rückmeldung über',
  code: 'Einladungs-Code',
  link: 'Persönlicher Link',
  telefon: 'Telefonnummer',
  listenstatusPerson: 'Listenstatus',
  listenstatusEinheit: 'Listenstatus (automatisch)',
  versendet: 'Einladung versendet?',
  versendetAm: 'Einladung versendet am',
  versendetVon: 'Einladung versendet von',
  medium: 'Einladung Medium',
};

const BLATT_AUSWERTUNG = 'App-Auswertung';
// Optik wie die Ursprungstabelle (Kopfzeile in Akzentfarbe, Zeilen abwechselnd hellblau/weiß)
const FARBE_KOPF = '#156082';
const FARBE_BAND = '#C1E4F5';
const TEILNAHME_ARTEN = ['Nur Nachmittag', 'Nachmittag + Abend', 'Nur Abend'];

const FRAGEN_KOPF = ['ID', 'Aktiv', 'Ebene', 'Typ', 'Frage', 'Hilfetext', 'Optionen', 'Pflicht', 'Bedingung', 'Zielspalte'];

const STANDARD_FRAGEN = [
  ['ernaehrung', 'Ja', 'Person', 'auswahl', 'Ernährung', '', 'Keine Besonderheiten|Vegetarisch|Vegan|Sonstiges', 'Ja', 'dabei', 'Ernährungsweise'],
  ['ernaehrung_sonst', 'Ja', 'Person', 'text', 'Was genau?', '', '', 'Ja', 'frage:ernaehrung=Sonstiges', ''],
  ['gluten', 'Ja', 'Person', 'ja_nein', 'Muss glutenfrei essen?', '', '', 'Ja', 'dabei', 'Glutenfrei?'],
  ['allergie', 'Ja', 'Person', 'ja_nein', 'Weitere Allergien oder Unverträglichkeiten?', '', '', 'Ja', 'dabei', 'Sonstige Allergien/Besonderheiten?'],
  ['allergie_details', 'Ja', 'Person', 'text', 'Welche?', '', '', 'Ja', 'frage:allergie=Ja', 'Details Allergien/Besonderheiten'],
  ['getraenke', 'Ja', 'Person', 'mehrfach', 'Lieblingsgetränke', 'Hilft uns bei der Getränkeplanung – gern mehrere ankreuzen.', 'Bier vom Fass|Radler|Alkoholfreies Bier|Wein|Sekt / Prosecco|Longdrinks|Softdrinks / Saft|Wasser|Kaffee / Tee', 'Nein', 'dabei', ''],
  ['kind', 'Ja', 'Person', 'ja_nein', 'Ist ein Kind (unter 14 Jahren)?', '', '', 'Nein', 'dabei', ''],
  ['kind_alter', 'Ja', 'Person', 'zahl', 'Alter', '', '', 'Nein', 'frage:kind=Ja', ''],
  ['kuchen', 'Ja', 'Einladung', 'ja_nein', 'Möchtet ihr einen Kuchen zum Kaffee beisteuern?', 'Ganz freiwillig – für Kuchen ist auf jeden Fall gesorgt.', '', 'Nein', 'nachmittag', ''],
  ['kuchen_art', 'Ja', 'Einladung', 'text', 'Was für einen Kuchen?', '', '', 'Nein', 'frage:kuchen=Ja', ''],
  ['musik', 'Ja', 'Einladung', 'text', 'Euer Musikwunsch für die Party', 'Ein oder mehrere Lieder – wir packen sie in die Playlist.', '', 'Nein', 'abend', ''],
  ['zugang', 'Ja', 'Einladung', 'ja_nein', 'Braucht jemand Unterstützung beim Zugang?', 'Der Zugang zur Location ist nicht barrierefrei.', '', 'Nein', 'dabei', ''],
  ['nachricht', 'Ja', 'Einladung', 'text', 'Möchtet ihr uns noch etwas mitteilen?', '', '', 'Nein', 'immer', 'Einladung Bemerkung'],
];

const STANDARD_EINSTELLUNGEN = [
  ['Anmeldeschluss', '21.10.2026'],
  ['Formular offen', 'Ja'],
  ['Unsicher erlauben', 'Nein'],
  ['Webseiten-Adresse', ''],
  ['Admin-Passwort', ''],
  ['Begrüßungstext', 'Wir freuen uns riesig, mit euch zu feiern! Gebt uns bitte für jede Person kurz Bescheid.'],
  ['Danketext', 'Danke für eure Rückmeldung! Ihr könnt sie über denselben Link jederzeit ändern.'],
];

// ---------------------------------------------------------------- Einrichtung

function einrichten() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(BLATT_PERSONEN) || !ss.getSheetByName(BLATT_EINHEITEN)) {
    throw new Error('Blätter "' + BLATT_PERSONEN + '" oder "' + BLATT_EINHEITEN + '" nicht gefunden – Namen prüfen.');
  }
  let fr = ss.getSheetByName(BLATT_FRAGEN);
  if (!fr) {
    fr = ss.insertSheet(BLATT_FRAGEN);
    fr.getRange(1, 1, 1, FRAGEN_KOPF.length).setValues([FRAGEN_KOPF]).setFontWeight('bold');
    fr.getRange(2, 1, STANDARD_FRAGEN.length, FRAGEN_KOPF.length).setValues(STANDARD_FRAGEN);
    fr.setFrozenRows(1);
  }
  let ei = ss.getSheetByName(BLATT_EINSTELLUNGEN);
  if (!ei) {
    ei = ss.insertSheet(BLATT_EINSTELLUNGEN);
    ei.getRange(1, 1, 1, 2).setValues([['Einstellung', 'Wert']]).setFontWeight('bold');
    const werte = STANDARD_EINSTELLUNGEN.map(r => r.slice());
    werte.find(r => r[0] === 'Admin-Passwort')[1] = zufallsCode_(10);
    ei.getRange(2, 1, werte.length, 2).setNumberFormat('@').setValues(werte);
  }
  [[BLATT_ANTW_PERSONEN, ['Zeitstempel', 'Einladungseinheit-ID', 'Person-ID', 'Name', 'Nachmittag', 'Abend']],
   [BLATT_ANTW_EINHEITEN, ['Zeitstempel', 'Einladungseinheit-ID', 'Bezeichnung']],
   [BLATT_PROTOKOLL, ['Zeitstempel', 'Einladungseinheit-ID', 'Daten (JSON)']]].forEach(([name, kopf]) => {
    if (!ss.getSheetByName(name)) {
      const sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, kopf.length).setValues([kopf]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  const anzahl = codesErzeugen_();
  antwortBlaetterNeuAufbauen_();
  SpreadsheetApp.getUi && Logger.log('Fertig. Codes für ' + anzahl + ' Einladungseinheiten vorhanden. Admin-Passwort steht im Blatt "' + BLATT_EINSTELLUNGEN + '".');
}

/** Legt fehlende Codes an und schreibt alle Links neu (z. B. nach Änderung der Webseiten-Adresse). */
function codesErzeugen_() {
  const sh = blatt_(BLATT_EINHEITEN);
  const kopf = kopfzeile_(sh);
  let cCode = kopf.indexOf(SP.code), cLink = kopf.indexOf(SP.link);
  if (cCode < 0) { cCode = kopf.length; sh.getRange(1, cCode + 1).setValue(SP.code).setFontWeight('bold'); kopf.push(SP.code); }
  if (cLink < 0) { cLink = kopf.length; sh.getRange(1, cLink + 1).setValue(SP.link).setFontWeight('bold'); kopf.push(SP.link); }
  const cName = kopf.indexOf(SP.bezeichnung), cId = kopf.indexOf(SP.einheitId);
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const daten = sh.getRange(2, 1, n, kopf.length).getValues();
  const basis = einstellungen_()['Webseiten-Adresse'] || '';
  const vorhanden = new Set(daten.map(r => String(r[cCode] || '')).filter(Boolean));
  let anzahl = 0;
  const codes = [], links = [];
  daten.forEach(r => {
    let code = String(r[cCode] || '');
    const aktiv = r[cName] && r[cId];
    if (aktiv && !code) {
      do { code = zufallsCode_(8); } while (vorhanden.has(code));
      vorhanden.add(code);
    }
    if (aktiv) anzahl++;
    codes.push([code]);
    links.push([aktiv && basis ? basis + (basis.indexOf('?') >= 0 ? '&' : '?') + 'c=' + code : '']);
  });
  sh.getRange(2, cCode + 1, n, 1).setNumberFormat('@').setValues(codes);
  sh.getRange(2, cLink + 1, n, 1).setValues(links);
  return anzahl;
}

// ---------------------------------------------------------------- Web-API

function doGet(e) {
  return antwort_({ ok: true, info: 'Einladungs-API läuft.' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const fn = AKTIONEN[req.aktion];
    if (!fn) throw new Error('Unbekannte Aktion');
    if (req.aktion.indexOf('admin.') === 0) adminPruefen_(req.passwort);
    return antwort_(Object.assign({ ok: true }, fn(req)));
  } catch (err) {
    return antwort_({ ok: false, fehler: String(err.message || err) });
  }
}

const AKTIONEN = {
  'gast.laden': req => {
    const einheit = einheitPerCode_(req.code);
    return { einheit: einheitFuerGast_(einheit), fragen: aktiveFragen_(), einstellungen: oeffentlicheEinstellungen_() };
  },
  'gast.senden': req => gastSenden_(req),
  'admin.login': () => ({}),
  'admin.daten': () => adminDaten_(),
  'admin.fragenSpeichern': req => { fragenSpeichern_(req.fragen); antwortBlaetterNeuAufbauen_(); return { fragen: alleFragen_() }; },
  'admin.versandMarkieren': req => { versandMarkieren_(req.ids, req.medium, req.zuruecksetzen); return adminDaten_(); },
  'admin.tabellenAktualisieren': () => { antwortBlaetterNeuAufbauen_(); return adminDaten_(); },
  'admin.einstellungenSpeichern': req => { einstellungenSpeichern_(req.einstellungen); codesErzeugen_(); return adminDaten_(); },
  'admin.codesErzeugen': () => { codesErzeugen_(); return adminDaten_(); },
  'admin.kalkulationLaden': () => ({ kalkulation: kalkulationLaden_() }),
  'admin.kalkulationSpeichern': req => ({ kalkulation: kalkulationSpeichern_(req.kalkulation, req.stand) }),
};

function antwort_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function adminPruefen_(pw) {
  const soll = String(einstellungen_()['Admin-Passwort'] || '');
  if (!soll || String(pw || '') !== soll) throw new Error('Falsches Passwort');
}

// ---------------------------------------------------------------- Gast

function einheitPerCode_(code) {
  code = String(code || '').trim();
  if (!code) throw new Error('Kein Einladungs-Code');
  const sh = blatt_(BLATT_EINHEITEN), kopf = kopfzeile_(sh);
  const daten = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), kopf.length).getValues();
  const cCode = kopf.indexOf(SP.code);
  for (let i = 0; i < daten.length; i++) {
    if (String(daten[i][cCode]) === code) {
      return { zeile: i + 2, id: daten[i][kopf.indexOf(SP.einheitId)], name: daten[i][kopf.indexOf(SP.bezeichnung)] };
    }
  }
  throw new Error('Diese Einladung wurde nicht gefunden. Bitte prüft den Link.');
}

function personenDerEinheit_(einheitId) {
  const sh = blatt_(BLATT_PERSONEN), kopf = kopfzeile_(sh);
  const daten = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), kopf.length).getValues();
  const k = name => kopf.indexOf(name);
  const liste = [];
  daten.forEach((r, i) => {
    if (r[k(SP.einheitId)] !== einheitId || !r[k(SP.vorname)]) return;
    liste.push({
      zeile: i + 2,
      id: String(r[k(SP.personId)]),
      vorname: String(r[k(SP.vorname)]),
      nachname: String(r[k(SP.nachname)] || ''),
      umfang: String(r[k(SP.umfang)] || ''),
    });
  });
  return liste;
}

function istPlatzhalter_(vorname) {
  return /^(Freund|Freundin|Begleitung|Partner|Partnerin|Kind)\b/i.test(vorname) || /\+1/.test(vorname);
}

function einheitFuerGast_(einheit) {
  const gespeichert = gespeicherteAntworten_(einheit.id);
  return {
    name: einheit.name,
    personen: personenDerEinheit_(einheit.id).map(p => ({
      id: p.id,
      vorname: p.vorname,
      nachname: p.nachname,
      platzhalter: istPlatzhalter_(p.vorname),
      nachmittagEingeladen: /nachmittag/i.test(p.umfang),
      abendEingeladen: /abend/i.test(p.umfang),
      antwort: gespeichert.personen[p.id] || null,
    })),
    antworten: gespeichert.einheit,
    gesendetAm: gespeichert.zeit,
  };
}

function gespeicherteAntworten_(einheitId) {
  const sh = blatt_(BLATT_PROTOKOLL);
  const n = sh.getLastRow() - 1;
  if (n < 1) return { personen: {}, einheit: {}, zeit: null };
  const daten = sh.getRange(2, 1, n, 3).getValues();
  for (let i = daten.length - 1; i >= 0; i--) {
    if (daten[i][1] === einheitId) {
      const d = JSON.parse(daten[i][2]);
      const personen = {};
      (d.personen || []).forEach(p => { personen[p.id] = p; });
      return { personen, einheit: d.antworten || {}, zeit: daten[i][0] };
    }
  }
  return { personen: {}, einheit: {}, zeit: null };
}

function gastSenden_(req) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const st = einstellungen_();
    if (String(st['Formular offen']).toLowerCase() !== 'ja') throw new Error('Die Anmeldung ist geschlossen. Bitte meldet euch direkt bei uns.');
    const einheit = einheitPerCode_(req.code);
    const personen = personenDerEinheit_(einheit.id);
    const fragen = aktiveFragen_();
    const jetzt = new Date();
    const erlaubt = ['Ja', 'Nein'].concat(String(st['Unsicher erlauben']).toLowerCase() === 'ja' ? ['Unsicher'] : []);

    const eingang = {};
    (req.personen || []).forEach(p => { eingang[p.id] = p; });
    const sauber = personen.map(p => {
      const e = eingang[p.id] || {};
      const nm = /nachmittag/i.test(p.umfang) ? (erlaubt.indexOf(e.nachmittag) >= 0 ? e.nachmittag : 'Offen') : 'Nicht eingeladen';
      const ab = /abend/i.test(p.umfang) ? (erlaubt.indexOf(e.abend) >= 0 ? e.abend : 'Offen') : 'Nicht eingeladen';
      return { id: p.id, zeile: p.zeile, vorname: p.vorname, nachname: p.nachname, name: String(e.name || '').slice(0, 100),
               nachmittag: nm, abend: ab, antworten: e.antworten || {} };
    });

    // Personenblatt
    const shP = blatt_(BLATT_PERSONEN), kopfP = kopfzeile_(shP);
    sauber.forEach(p => {
      const dabei = p.nachmittag === 'Ja' || p.abend === 'Ja' || p.nachmittag === 'Unsicher' || p.abend === 'Unsicher';
      zelle_(shP, kopfP, p.zeile, SP.nachmittag, p.nachmittag);
      zelle_(shP, kopfP, p.zeile, SP.abend, p.abend);
      if (p.name && istPlatzhalter_(p.vorname)) zelle_(shP, kopfP, p.zeile, SP.bemerkungPerson, 'Name laut Anmeldung: ' + p.name);
      fragen.filter(f => f.ebene === 'Person' && f.zielspalte).forEach(f => {
        const sichtbar = bedingungErfuellt_(f.bedingung, { person: p, personen: sauber, antworten: p.antworten });
        zelle_(shP, kopfP, p.zeile, f.zielspalte, sichtbar && dabei ? wertText_(p.antworten[f.id]) : '');
      });
    });

    // Einheitenblatt
    const shE = blatt_(BLATT_EINHEITEN), kopfE = kopfzeile_(shE);
    const status = gesamtStatus_(sauber);
    zelle_(shE, kopfE, einheit.zeile, SP.rueckmeldung, status);
    zelle_(shE, kopfE, einheit.zeile, SP.rueckmeldungAm, jetzt);
    zelle_(shE, kopfE, einheit.zeile, SP.rueckmeldungUeber, 'Online-Formular');
    const antwortenE = req.antworten || {};
    fragen.filter(f => f.ebene === 'Einladung' && f.zielspalte).forEach(f => {
      const sichtbar = bedingungErfuellt_(f.bedingung, { personen: sauber, antworten: antwortenE });
      zelle_(shE, kopfE, einheit.zeile, f.zielspalte, sichtbar ? wertText_(antwortenE[f.id]) : '');
    });

    blatt_(BLATT_PROTOKOLL).appendRow([jetzt, einheit.id, JSON.stringify({
      personen: sauber.map(p => ({ id: p.id, name: p.name, nachmittag: p.nachmittag, abend: p.abend, antworten: p.antworten })),
      antworten: antwortenE,
    })]);
    antwortBlaetterNeuAufbauen_();
    return { status };
  } finally {
    lock.releaseLock();
  }
}

function gesamtStatus_(personen) {
  let ja = 0, unsicher = 0, nein = 0;
  personen.forEach(p => {
    const w = [p.nachmittag, p.abend];
    if (w.indexOf('Ja') >= 0) ja++;
    else if (w.indexOf('Unsicher') >= 0) unsicher++;
    else nein++;
  });
  if (ja === personen.length) return 'Zugesagt';
  if (ja > 0) return 'Teilweise zugesagt';
  if (unsicher > 0) return 'Unsicher';
  return 'Abgesagt';
}

/** Gleiche Logik wie im Browser (app.js → bedingungErfuellt). */
function bedingungErfuellt_(bed, ctx) {
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
    return Array.isArray(w) ? w.indexOf(m[2]) >= 0 : String(w || '') === m[2];
  }
  return true;
}

// ---------------------------------------------------------------- Fragen & Einstellungen

function alleFragen_() {
  const sh = blatt_(BLATT_FRAGEN);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, FRAGEN_KOPF.length).getValues().filter(r => r[0]).map(r => ({
    id: String(r[0]), aktiv: String(r[1]).toLowerCase() !== 'nein', ebene: r[2] === 'Einladung' ? 'Einladung' : 'Person',
    typ: String(r[3] || 'text'), frage: String(r[4]), hilfe: String(r[5] || ''),
    optionen: String(r[6] || '').split('|').map(s => s.trim()).filter(Boolean),
    pflicht: String(r[7]).toLowerCase() === 'ja', bedingung: String(r[8] || 'immer'), zielspalte: String(r[9] || ''),
  }));
}

function aktiveFragen_() { return alleFragen_().filter(f => f.aktiv); }

function fragenSpeichern_(fragen) {
  if (!Array.isArray(fragen)) throw new Error('Keine Fragen übergeben');
  const ids = new Set();
  const zeilen = fragen.map(f => {
    let id = String(f.id || '').trim().replace(/[^a-zA-Z0-9_]/g, '_') || ('frage_' + zufallsCode_(5));
    while (ids.has(id)) id += '_2';
    ids.add(id);
    return [id, f.aktiv ? 'Ja' : 'Nein', f.ebene === 'Einladung' ? 'Einladung' : 'Person', f.typ, f.frage, f.hilfe || '',
      (f.optionen || []).join('|'), f.pflicht ? 'Ja' : 'Nein', f.bedingung || 'immer', f.zielspalte || ''];
  });
  const sh = blatt_(BLATT_FRAGEN);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, FRAGEN_KOPF.length).clearContent();
  if (zeilen.length) sh.getRange(2, 1, zeilen.length, FRAGEN_KOPF.length).setValues(zeilen);
}

function einstellungen_() {
  const sh = blatt_(BLATT_EINSTELLUNGEN);
  const n = sh.getLastRow() - 1;
  const obj = {};
  if (n > 0) sh.getRange(2, 1, n, 2).getDisplayValues().forEach(r => { if (r[0]) obj[r[0]] = r[1]; });
  return obj;
}

function oeffentlicheEinstellungen_() {
  const st = einstellungen_();
  return {
    anmeldeschluss: st['Anmeldeschluss'] || '',
    offen: String(st['Formular offen']).toLowerCase() === 'ja',
    unsicherErlaubt: String(st['Unsicher erlauben']).toLowerCase() === 'ja',
    begruessung: st['Begrüßungstext'] || '',
    danke: st['Danketext'] || '',
  };
}

function einstellungenSpeichern_(neu) {
  const sh = blatt_(BLATT_EINSTELLUNGEN);
  const n = sh.getLastRow() - 1;
  const daten = n > 0 ? sh.getRange(2, 1, n, 2).getValues() : [];
  Object.keys(neu || {}).forEach(k => {
    if (k === 'Admin-Passwort' && !String(neu[k]).trim()) return;
    const i = daten.findIndex(r => r[0] === k);
    if (i >= 0) daten[i][1] = neu[k]; else daten.push([k, neu[k]]);
  });
  sh.getRange(2, 1, daten.length, 2).setNumberFormat('@').setValues(daten);
}

// ---------------------------------------------------------------- Admin

function adminDaten_() {
  const personen = allePersonen_();
  const letzte = letzteAntworten_();
  const shE = blatt_(BLATT_EINHEITEN), kopfE = kopfzeile_(shE);
  const datenE = shE.getRange(2, 1, Math.max(shE.getLastRow() - 1, 1), kopfE.length).getValues();
  const k = n => kopfE.indexOf(n);
  const wert = (r, n) => k(n) >= 0 ? r[k(n)] : '';
  const antwortVon = {};
  Object.keys(letzte).forEach(id => (letzte[id].daten.personen || []).forEach(p => { antwortVon[p.id] = p; }));
  const einheiten = datenE.filter(r => wert(r, SP.bezeichnung)).map(r => {
    const id = wert(r, SP.einheitId);
    const ps = personen.filter(p => p.einheit === id);
    return {
      id, name: wert(r, SP.bezeichnung), code: wert(r, SP.code), link: wert(r, SP.link),
      listenstatus: wert(r, SP.listenstatusEinheit) || (ps[0] ? ps[0].listenstatus : ''),
      status: wert(r, SP.rueckmeldung) || 'Offen', am: datumText_(wert(r, SP.rueckmeldungAm)),
      versendet: String(wert(r, SP.versendet)).toLowerCase() === 'ja', versendetAm: datumText_(wert(r, SP.versendetAm)),
      versendetVon: wert(r, SP.versendetVon), medium: wert(r, SP.medium),
      // oberste Telefonnummer der Einladung
      telefon: ps.map(p => telefonNormal_(p.telefon)).filter(Boolean)[0] || '',
      personen: ps.map(p => ({ id: p.id, name: p.anzeigeName, umfang: p.umfang, nachmittag: p.nachmittag, abend: p.abend,
        antworten: antwortVon[p.id] ? antwortVon[p.id].antworten || {} : {} })),
      antworten: letzte[id] ? letzte[id].daten.antworten || {} : {},
    };
  });
  return {
    einheiten,
    fragen: alleFragen_(),
    einstellungen: einstellungen_(),
    spaltenPerson: kopfzeile_(blatt_(BLATT_PERSONEN)).filter(Boolean),
    spaltenEinladung: kopfE.filter(Boolean),
  };
}

function datumText_(d) {
  return d instanceof Date ? Utilities.formatDate(d, 'Europe/Berlin', 'dd.MM.yyyy HH:mm') : String(d || '');
}

function telefonNormal_(t) {
  let s = String(t || '').replace(/[^\d+]/g, '');
  if (!s) return '';
  if (s.indexOf('+') === 0) s = s.slice(1);
  else if (s.indexOf('00') === 0) s = s.slice(2);
  else if (s.indexOf('0') === 0) s = '49' + s.slice(1);
  return s.replace(/\D/g, '');
}

/** Trägt in „Versand & Einladungen“ ein, dass die Einladung über die Website verschickt wurde (oder setzt es zurück). */
function versandMarkieren_(ids, medium, zuruecksetzen) {
  const sh = blatt_(BLATT_EINHEITEN), kopf = kopfzeile_(sh);
  const n = sh.getLastRow() - 1;
  if (n < 1) return;
  const gesucht = {};
  (ids || []).forEach(id => { gesucht[id] = true; });
  const jetzt = new Date();
  sh.getRange(2, kopf.indexOf(SP.einheitId) + 1, n, 1).getValues().forEach((r, i) => {
    if (!gesucht[r[0]]) return;
    const zeile = i + 2;
    zelle_(sh, kopf, zeile, SP.versendet, zuruecksetzen ? 'Nein' : 'Ja');
    zelle_(sh, kopf, zeile, SP.versendetAm, zuruecksetzen ? '' : jetzt);
    zelle_(sh, kopf, zeile, SP.versendetVon, zuruecksetzen ? '' : 'Sonstige Person');
    zelle_(sh, kopf, zeile, SP.medium, zuruecksetzen ? '' : (medium || 'WhatsApp'));
  });
}

// ---------------------------------------------------------------- Antwortblätter & Auswertung

function allePersonen_() {
  const sh = blatt_(BLATT_PERSONEN), kopf = kopfzeile_(sh);
  const daten = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), kopf.length).getValues();
  const wert = (r, n) => kopf.indexOf(n) >= 0 ? r[kopf.indexOf(n)] : '';
  return daten.filter(r => wert(r, SP.vorname)).map(r => {
    const vorname = String(wert(r, SP.vorname)), nachname = String(wert(r, SP.nachname) || '');
    const m = String(wert(r, SP.bemerkungPerson) || '').match(/Name laut Anmeldung: (.+)/);
    return {
      id: String(wert(r, SP.personId)), einheit: wert(r, SP.einheitId), vorname, nachname,
      anzeigeName: istPlatzhalter_(vorname) && m ? m[1].trim() + ' (' + vorname + ')' : (vorname + ' ' + nachname).trim(),
      umfang: String(wert(r, SP.umfang) || ''), listenstatus: wert(r, SP.listenstatusPerson), telefon: wert(r, SP.telefon),
      nachmittag: wert(r, SP.nachmittag) || 'Offen', abend: wert(r, SP.abend) || 'Offen',
    };
  });
}

/** Letzte gespeicherte Rückmeldung je Einladung aus dem Protokoll. */
function letzteAntworten_() {
  const sh = blatt_(BLATT_PROTOKOLL);
  const n = sh.getLastRow() - 1;
  const out = {};
  if (n < 1) return out;
  sh.getRange(2, 1, n, 3).getValues().forEach(r => {
    if (!r[1]) return;
    try { out[r[1]] = { zeit: r[0], daten: JSON.parse(r[2]) }; } catch (e) { /* kaputte Zeile überspringen */ }
  });
  return out;
}

function teilnahme_(nm, ab) {
  if (nm === 'Ja' && ab === 'Ja') return 'Nachmittag + Abend';
  if (nm === 'Ja') return 'Nur Nachmittag';
  if (ab === 'Ja') return 'Nur Abend';
  if (nm === 'Unsicher' || ab === 'Unsicher') return 'Unsicher';
  if (nm === 'Nein' || ab === 'Nein') return 'Abgesagt';
  return 'Noch offen';
}

/** Baut „App-Antworten Personen“, „App-Antworten Einladungen“ und „App-Auswertung“ komplett neu auf – immer mit den aktuellen Fragen. */
function antwortBlaetterNeuAufbauen_() {
  const ss = SpreadsheetApp.getActive();
  const fragen = aktiveFragen_();
  const fP = fragen.filter(f => f.ebene === 'Person'), fE = fragen.filter(f => f.ebene === 'Einladung');
  const personen = allePersonen_();
  const letzte = letzteAntworten_();
  const shE = blatt_(BLATT_EINHEITEN), kopfE = kopfzeile_(shE);
  const cId = kopfE.indexOf(SP.einheitId), cName = kopfE.indexOf(SP.bezeichnung), cStatus = kopfE.indexOf(SP.rueckmeldung);
  const datenE = shE.getRange(2, 1, Math.max(shE.getLastRow() - 1, 1), kopfE.length).getValues().filter(r => r[cName]);
  const einheitName = {};
  datenE.forEach(r => { einheitName[r[cId]] = r[cName]; });
  const zeit = id => letzte[id] ? letzte[id].zeit : '';
  const antwortVon = {};
  Object.keys(letzte).forEach(id => (letzte[id].daten.personen || []).forEach(p => { antwortVon[p.id] = p; }));

  const zeilenP = personen.map(p => {
    const a = antwortVon[p.id];
    const antw = a ? a.antworten || {} : {};
    return [einheitName[p.einheit] || p.einheit, p.anzeigeName, p.umfang, a ? teilnahme_(a.nachmittag, a.abend) : 'Noch offen',
      a ? a.nachmittag : p.nachmittag, a ? a.abend : p.abend]
      .concat(fP.map(f => wertText_(antw[f.id])))
      .concat([p.einheit, p.id, zeit(p.einheit)]);
  });
  blattSchreiben_(ss, BLATT_ANTW_PERSONEN,
    ['Einladung', 'Name', 'Eingeladen zu', 'Teilnahme', 'Nachmittag', 'Abend'].concat(fP.map(f => f.frage))
      .concat(['Einladungseinheit-ID', 'Person-ID', 'Zuletzt geändert']), zeilenP);

  const zeilenE = datenE.map(r => {
    const id = r[cId], l = letzte[id];
    const anzahl = personen.filter(p => p.einheit === id).length;
    const dabei = l ? (l.daten.personen || []).filter(p => p.nachmittag === 'Ja' || p.abend === 'Ja').length : 0;
    const antw = l ? l.daten.antworten || {} : {};
    return [r[cName], r[cStatus] || 'Offen', l ? dabei + ' von ' + anzahl : '']
      .concat(fE.map(f => wertText_(antw[f.id]))).concat([id, zeit(id)]);
  });
  blattSchreiben_(ss, BLATT_ANTW_EINHEITEN,
    ['Einladung', 'Rückmeldung', 'Personen dabei'].concat(fE.map(f => f.frage)).concat(['Einladungseinheit-ID', 'Zuletzt geändert']), zeilenE);

  auswertungSchreiben_(ss, fragen, personen, antwortVon, letzte);
}

function blattLeeren_(ss, name) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.getBandings().forEach(b => b.remove());
  sh.clear();
  return sh;
}

function blattSchreiben_(ss, name, kopf, zeilen) {
  const sh = blattLeeren_(ss, name);
  const alle = [kopf].concat(zeilen.map(z => z.map(v => (v === undefined || v === null ? '' : v))));
  sh.getRange(1, 1, alle.length, kopf.length).setValues(alle);
  sh.getRange(1, 1, 1, kopf.length).setBackground(FARBE_KOPF).setFontColor('#FFFFFF').setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle');
  if (alle.length > 1) {
    sh.getRange(1, 1, alle.length, kopf.length).applyRowBanding()
      .setHeaderRowColor(FARBE_KOPF).setFirstRowColor(FARBE_BAND).setSecondRowColor('#FFFFFF');
    sh.getRange(2, 1, alle.length - 1, kopf.length).setWrap(true).setVerticalAlignment('top');
  }
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, kopf.length, 170);
  sh.setColumnWidths(1, 2, 210);
}

/** Zählt alle Auswahlfragen – bei Personenfragen getrennt nach Nachmittag / Nachmittag + Abend / Abend. */
function auswertungSchreiben_(ss, fragen, personen, antwortVon, letzte) {
  const sh = blattLeeren_(ss, BLATT_AUSWERTUNG);
  const breite = 7;
  const zeilen = [], titel = [], koepfe = [];
  const zeile = werte => { const z = new Array(breite).fill(''); werte.forEach((w, i) => { z[i] = w; }); zeilen.push(z); return zeilen.length; };
  const treffer = (w, o) => Array.isArray(w) ? w.indexOf(o) >= 0 : String(w) === o;

  const teil = personen.map(p => antwortVon[p.id] ? teilnahme_(antwortVon[p.id].nachmittag, antwortVon[p.id].abend) : 'Noch offen');
  const zaehl = t => teil.filter(x => x === t).length;
  titel.push(zeile(['Teilnahme (Personen)']));
  koepfe.push([zeile(['Teilnahme', 'Personen']), 2]);
  TEILNAHME_ARTEN.concat(['Unsicher', 'Abgesagt', 'Noch offen']).forEach(t => zeile([t, zaehl(t)]));
  zeile(['Gesamt Nachmittag', zaehl('Nur Nachmittag') + zaehl('Nachmittag + Abend')]);
  zeile(['Gesamt Abend', zaehl('Nur Abend') + zaehl('Nachmittag + Abend')]);
  zeile([]);

  fragen.filter(f => ['ja_nein', 'auswahl', 'mehrfach'].indexOf(f.typ) >= 0).forEach(f => {
    const optionen = f.typ === 'ja_nein' ? ['Ja', 'Nein'] : f.optionen.slice();
    if (f.ebene === 'Person') {
      titel.push(zeile([f.frage]));
      koepfe.push([zeile(['Antwort'].concat(TEILNAHME_ARTEN).concat(['Gesamt Nachmittag', 'Gesamt Abend', 'Gesamt'])), breite]);
      const daten = Object.keys(antwortVon).map(id => antwortVon[id])
        .map(a => ({ t: teilnahme_(a.nachmittag, a.abend), w: (a.antworten || {})[f.id] }))
        .filter(x => TEILNAHME_ARTEN.indexOf(x.t) >= 0 && x.w !== undefined && x.w !== '');
      optionen.forEach(o => {
        const n = t => daten.filter(x => x.t === t && treffer(x.w, o)).length;
        const nN = n('Nur Nachmittag'), nNA = n('Nachmittag + Abend'), nA = n('Nur Abend');
        zeile([o, nN, nNA, nA, nN + nNA, nA + nNA, nN + nNA + nA]);
      });
    } else {
      titel.push(zeile([f.frage + ' (pro Einladung)']));
      koepfe.push([zeile(['Antwort', 'Einladungen']), 2]);
      const werte = Object.keys(letzte).map(id => (letzte[id].daten.antworten || {})[f.id]).filter(w => w !== undefined && w !== '');
      optionen.forEach(o => zeile([o, werte.filter(w => treffer(w, o)).length]));
    }
    zeile([]);
  });
  zeile(['Dieses Blatt wird bei jeder Rückmeldung automatisch neu erstellt. Freitexte stehen in „' + BLATT_ANTW_PERSONEN + '“ und „' + BLATT_ANTW_EINHEITEN + '“.']);

  sh.getRange(1, 1, zeilen.length, breite).setValues(zeilen);
  titel.forEach(z => sh.getRange(z, 1).setFontWeight('bold').setFontSize(12).setFontColor(FARBE_KOPF));
  koepfe.forEach(([z, b]) => sh.getRange(z, 1, 1, b).setBackground(FARBE_KOPF).setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true));
  sh.setColumnWidth(1, 260);
  sh.setColumnWidths(2, breite - 1, 130);
}

// ---------------------------------------------------------------- Kalkulation (Licht & Ton, Getränke, Skizze)

const SKIZZE_NAMEN = {
  raum: 'Raum', mauer: 'Mauer', wand: 'Mauerstück', pfeiler: 'Pfeiler', bogen: 'Bogen / Durchgang', balken: 'Balken / Träger', tuer: 'Tür',
  notausgang: 'Notausgang', fenster: 'Fenster', treppe: 'Treppe', nische: 'Nische', tisch: 'Tisch', tischrund: 'Runder Tisch', stehtisch: 'Stehtisch',
  bank: 'Bank', stuhl: 'Stuhl', theke: 'Theke', arbeitstheke: 'Arbeitsfläche', buffet: 'Buffettisch', zapfanlage: 'Zapfanlage', kuehlschrank: 'Kühlschrank',
  sofa: 'Sofa / Lounge', uplight: 'Uplight', deckenleuchte: 'Deckenleuchte (vorhanden)', lichtbar: 'Lichtbar', spot: 'Scheinwerfer / Spot',
  movinghead: 'Moving Head', spiegelkugel: 'Spiegelkugel', laterne: 'Laterne / Kerze', kette: 'Lichterkette', box: 'Lautsprecher', subwoofer: 'Subwoofer',
  mischpult: 'DJ / Mischpult', mikrofon: 'Mikrofon', steckdose: 'Steckdose', verteiler: 'Mehrfachsteckdose', kabel: 'Kabel', weg: 'Rettungsweg',
  feuerloescher: 'Feuerlöscher', rauchmelder: 'Rauchmelder', bereich: 'Bereich / Zone', text: 'Text', pfeil: 'Pfeil',
};
const KALK_STUECK = 45000; // eine Zelle fasst höchstens 50.000 Zeichen – längeres JSON (z. B. mit Skizze) wird aufgeteilt

/** Gespeicherte Kalkulation (JSON in A2 von „App-Kalkulation“, Fortsetzung ab C2) – null, solange noch nie gespeichert wurde. */
function kalkulationLaden_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(BLATT_KALKULATION);
  if (!sh) return null;
  const breite = Math.max(3, sh.getLastColumn());
  const zeile = sh.getRange(2, 1, 1, breite).getValues()[0];
  const json = [zeile[0]].concat(zeile.slice(2)).map(v => String(v || '')).join('');
  return json ? JSON.parse(json) : null;
}

/** Speichert die Kalkulation. „stand“ = Zeitstempel beim Laden – so überschreibt niemand unbemerkt die Änderungen des anderen. */
function kalkulationSpeichern_(kalk, stand) {
  if (!kalk || !Array.isArray(kalk.bereiche)) throw new Error('Keine Kalkulation übergeben');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const alt = kalkulationLaden_();
    if (alt && alt.stand && alt.stand !== stand) {
      throw new Error('Inzwischen hat jemand anderes gespeichert (' + alt.stand + '). Bitte die Seite neu laden – deine Änderungen vorher notieren.');
    }
    kalk.stand = Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy HH:mm:ss');
    const ss = SpreadsheetApp.getActive();
    const sh = blattLeeren_(ss, BLATT_KALKULATION);
    sh.getRange(1, 1, 1, 2).setValues([['Daten (JSON – bitte nicht von Hand ändern, wird von der Seite „Kalkulation“ geschrieben)', 'Gespeichert am']]).setFontWeight('bold');
    const json = JSON.stringify(kalk);
    const stuecke = [];
    for (let i = 0; i < json.length; i += KALK_STUECK) stuecke.push(json.slice(i, i + KALK_STUECK));
    sh.getRange(2, 1, 1, 2).setNumberFormat('@').setValues([[stuecke[0], kalk.stand]]);
    if (stuecke.length > 1) {
      sh.getRange(1, 3).setValue('Fortsetzung der Daten').setFontWeight('bold');
      sh.getRange(2, 3, 1, stuecke.length - 1).setNumberFormat('@').setValues([stuecke.slice(1)]);
    }
    // Lesbare Kopie zum Nachschauen im Sheet
    const kopf = ['Bereich', 'Gruppe', 'Position', 'Menge', 'Einheit', 'Preis je Einheit (€)', 'Summe (€)', 'Status', 'Wer / Anbieter', 'Notiz', 'Bedarf', 'Inhalt je Einheit', 'Bestellt gesamt'];
    const zeilen = [];
    kalk.bereiche.forEach(b => (b.gruppen || []).forEach(g => (g.positionen || []).forEach(p => {
      const menge = zahl_(p.menge), preis = zahl_(p.preis);
      zeilen.push([b.titel, g.titel, p.was || '', menge === '' ? '' : menge, p.einheit || '', preis === '' ? '' : preis,
        menge === '' || preis === '' ? '' : Math.round(menge * preis * 100) / 100, p.status || '', p.wer || '', p.notiz || '',
        zahl_(p.bedarf) === '' ? '' : zahl_(p.bedarf) + ' ' + (p.bedarfEinheit || 'l'), zahl_(p.inhalt),
        menge === '' || zahl_(p.inhalt) === '' ? '' : Math.round(menge * zahl_(p.inhalt) * 100) / 100]);
    })));
    sh.getRange(4, 1, 1, kopf.length).setValues([kopf]).setBackground(FARBE_KOPF).setFontColor('#FFFFFF').setFontWeight('bold');
    if (zeilen.length) sh.getRange(5, 1, zeilen.length, kopf.length).setValues(zeilen);
    // Skizze: was steht in welchem Plan (nur zum Nachschauen)
    const plaene = (kalk.skizze && kalk.skizze.plaene) || [];
    if (plaene.length) {
      const eigene = {};
      (kalk.skizze.symbole || []).forEach(s => { eigene[s.key] = s.name; });
      const skZeilen = [];
      plaene.forEach(pl => {
        const anzahl = {};
        (pl.objekte || []).forEach(o => { const n = SKIZZE_NAMEN[o.typ] || eigene[o.typ] || o.typ; anzahl[n] = (anzahl[n] || 0) + 1; });
        Object.keys(anzahl).sort().forEach(n => skZeilen.push([pl.name || '', n, anzahl[n]]));
      });
      const start = 5 + zeilen.length + 2;
      sh.getRange(start, 1, 1, 3).setValues([['Skizze – Plan', 'Objekt', 'Anzahl']]).setBackground(FARBE_KOPF).setFontColor('#FFFFFF').setFontWeight('bold');
      if (skZeilen.length) sh.getRange(start + 1, 1, skZeilen.length, 3).setValues(skZeilen);
    }
    sh.setColumnWidths(1, kopf.length, 150);
    sh.setColumnWidth(1, 300);
    return kalk;
  } finally {
    lock.releaseLock();
  }
}

function zahl_(v) {
  if (typeof v === 'number') return v;
  const s = String(v == null ? '' : v).trim().replace(',', '.');
  if (s === '') return '';
  const n = Number(s);
  return isNaN(n) ? '' : n;
}

// ---------------------------------------------------------------- Hilfsfunktionen

function blatt_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('Blatt "' + name + '" fehlt – bitte "einrichten" ausführen.');
  return sh;
}

function kopfzeile_(sh) {
  return sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(v => String(v).trim());
}

function zelle_(sh, kopf, zeile, spalte, wert) {
  const c = kopf.indexOf(spalte);
  if (c >= 0) sh.getRange(zeile, c + 1).setValue(wert);
}

function wertText_(w) {
  if (Array.isArray(w)) return w.join(', ');
  return w === undefined || w === null ? '' : w;
}

function zufallsCode_(len) {
  const zeichen = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += zeichen.charAt(Math.floor(Math.random() * zeichen.length));
  return s;
}
