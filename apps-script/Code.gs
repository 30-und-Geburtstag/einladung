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
};

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
  'admin.fragenSpeichern': req => { fragenSpeichern_(req.fragen); return { fragen: alleFragen_() }; },
  'admin.einstellungenSpeichern': req => { einstellungenSpeichern_(req.einstellungen); codesErzeugen_(); return adminDaten_(); },
  'admin.codesErzeugen': () => { codesErzeugen_(); return adminDaten_(); },
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

    // Antwortblätter (je Person / je Einladung eine aktuelle Zeile)
    const fP = fragen.filter(f => f.ebene === 'Person'), fE = fragen.filter(f => f.ebene === 'Einladung');
    sauber.forEach(p => {
      const werte = { 'Zeitstempel': jetzt, 'Einladungseinheit-ID': einheit.id, 'Person-ID': p.id,
        'Name': p.name || (p.vorname + ' ' + p.nachname).trim(), 'Nachmittag': p.nachmittag, 'Abend': p.abend };
      fP.forEach(f => { werte[spaltenName_(f)] = wertText_(p.antworten[f.id]); });
      zeileSchreiben_(BLATT_ANTW_PERSONEN, 'Person-ID', p.id, werte);
    });
    const werteE = { 'Zeitstempel': jetzt, 'Einladungseinheit-ID': einheit.id, 'Bezeichnung': einheit.name };
    fE.forEach(f => { werteE[spaltenName_(f)] = wertText_(antwortenE[f.id]); });
    zeileSchreiben_(BLATT_ANTW_EINHEITEN, 'Einladungseinheit-ID', einheit.id, werteE);

    blatt_(BLATT_PROTOKOLL).appendRow([jetzt, einheit.id, JSON.stringify({
      personen: sauber.map(p => ({ id: p.id, name: p.name, nachmittag: p.nachmittag, abend: p.abend, antworten: p.antworten })),
      antworten: antwortenE,
    })]);
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
  const shE = blatt_(BLATT_EINHEITEN), kopfE = kopfzeile_(shE);
  const datenE = shE.getRange(2, 1, Math.max(shE.getLastRow() - 1, 1), kopfE.length).getValues();
  const k = n => kopfE.indexOf(n);
  const shP = blatt_(BLATT_PERSONEN), kopfP = kopfzeile_(shP);
  const datenP = shP.getRange(2, 1, Math.max(shP.getLastRow() - 1, 1), kopfP.length).getValues();
  const kp = n => kopfP.indexOf(n);

  const personenJeEinheit = {};
  datenP.forEach(r => {
    if (!r[kp(SP.vorname)]) return;
    const id = r[kp(SP.einheitId)];
    (personenJeEinheit[id] = personenJeEinheit[id] || []).push({
      name: (r[kp(SP.vorname)] + ' ' + (r[kp(SP.nachname)] || '')).trim(),
      umfang: r[kp(SP.umfang)], nachmittag: r[kp(SP.nachmittag)], abend: r[kp(SP.abend)],
      ernaehrung: r[kp('Ernährungsweise')], gluten: r[kp('Glutenfrei?')],
    });
  });
  const einheiten = datenE.filter(r => r[k(SP.bezeichnung)]).map(r => ({
    id: r[k(SP.einheitId)], name: r[k(SP.bezeichnung)], code: r[k(SP.code)], link: r[k(SP.link)],
    status: r[k(SP.rueckmeldung)] || 'Offen',
    am: r[k(SP.rueckmeldungAm)] instanceof Date ? Utilities.formatDate(r[k(SP.rueckmeldungAm)], 'Europe/Berlin', 'dd.MM.yyyy HH:mm') : '',
    personen: personenJeEinheit[r[k(SP.einheitId)]] || [],
  }));
  const st = einstellungen_();
  return {
    einheiten,
    fragen: alleFragen_(),
    einstellungen: st,
    spaltenPerson: kopfP.filter(Boolean),
    spaltenEinladung: kopfE.filter(Boolean),
  };
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

function spaltenName_(f) { return f.frage + ' [' + f.id + ']'; }

function zeileSchreiben_(blattName, schluesselSpalte, schluessel, werte) {
  const sh = blatt_(blattName);
  const kopf = kopfzeile_(sh);
  Object.keys(werte).forEach(name => {
    if (kopf.indexOf(name) < 0) {
      kopf.push(name);
      sh.getRange(1, kopf.length).setValue(name).setFontWeight('bold');
    }
  });
  const cKey = kopf.indexOf(schluesselSpalte);
  const n = sh.getLastRow() - 1;
  let zeile = -1;
  if (n > 0) {
    const keys = sh.getRange(2, cKey + 1, n, 1).getValues();
    const i = keys.findIndex(r => r[0] === schluessel);
    if (i >= 0) zeile = i + 2;
  }
  if (zeile < 0) zeile = sh.getLastRow() + 1;
  const alt = zeile <= sh.getLastRow() ? sh.getRange(zeile, 1, 1, kopf.length).getValues()[0] : new Array(kopf.length).fill('');
  kopf.forEach((name, i) => { if (name in werte) alt[i] = werte[name]; });
  sh.getRange(zeile, 1, 1, kopf.length).setValues([alt]);
}

function zufallsCode_(len) {
  const zeichen = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += zeichen.charAt(Math.floor(Math.random() * zeichen.length));
  return s;
}
