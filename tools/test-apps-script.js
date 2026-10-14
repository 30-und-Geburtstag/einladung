// Testet Code.gs gegen eine nachgebaute Tabelle (gleiche Blattnamen/Überschriften wie die echte Gästeliste).
// Aufruf: node tools/test-apps-script.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

class Range {
  constructor(sh, r, c, nr = 1, nc = 1) { Object.assign(this, { sh, r, c, nr, nc }); }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) row.push(this.sh.get(this.r + i, this.c + j));
      out.push(row);
    }
    return out;
  }
  getDisplayValues() { return this.getValues().map(r => r.map(v => (v instanceof Date ? v.toISOString() : String(v)))); }
  setValues(v) {
    assert.strictEqual(v.length, this.nr, 'Zeilenanzahl passt nicht');
    v.forEach((row, i) => { assert.strictEqual(row.length, this.nc, 'Spaltenanzahl passt nicht'); row.forEach((x, j) => this.sh.set(this.r + i, this.c + j, x)); });
    return this;
  }
  setValue(x) { this.sh.set(this.r, this.c, x); return this; }
  clearContent() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sh.set(this.r + i, this.c + j, ''); return this; }
  setNumberFormat() { return this; }
  setFontWeight() { return this; }
}
class Sheet {
  constructor(name, rows = []) { this.name = name; this.rows = rows.map(r => r.slice()); }
  get(r, c) { return (this.rows[r - 1] || [])[c - 1] ?? ''; }
  set(r, c, v) { while (this.rows.length < r) this.rows.push([]); const row = this.rows[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr, nc); }
  getLastRow() { for (let i = this.rows.length; i > 0; i--) if (this.rows[i - 1].some(v => v !== '')) return i; return 0; }
  getLastColumn() { return Math.max(0, ...this.rows.map(r => { for (let i = r.length; i > 0; i--) if (r[i - 1] !== '') return i; return 0; })); }
  appendRow(v) { const r = this.getLastRow() + 1; v.forEach((x, j) => this.set(r, j + 1, x)); }
  setFrozenRows() {}
  // Hilfe für Tests
  zeile(spalte, wert) { const k = this.rows[0]; const c = k.indexOf(spalte); return this.rows.find(r => r[c] === wert); }
  wert(schluesselSpalte, schluessel, spalte) { return this.zeile(schluesselSpalte, schluessel)[this.rows[0].indexOf(spalte)]; }
}

const PERSONEN_KOPF = ['Person-ID', 'Einladungseinheit-ID', 'Vorname', 'Nachname', 'Bezug', 'Gästegruppe', 'Listenstatus', 'Einladungsumfang', 'Straße + Hausnummer', 'PLZ', 'Ort', 'Telefonnummer', 'E-Mail-Adresse', 'Voraussichtliche Teilnahme Nachmittag', 'Voraussichtliche Teilnahme Abend', 'Finale Teilnahme Nachmittag', 'Finale Teilnahme Abend', 'Ernährungsweise', 'Glutenfrei?', 'Sonstige Allergien/Besonderheiten?', 'Details Allergien/Besonderheiten', 'Bemerkungen zur Person'];
const EINHEITEN_KOPF = ['Einladungseinheit-ID', 'Bezeichnung / Empfänger', 'Hauptansprechpartner', 'Anzahl eingeladene Personen (automatisch)', 'Listenstatus (automatisch)', 'Save-the-Date versendet?', 'Save-the-Date versendet am', 'Save-the-Date versendet von', 'Save-the-Date Medium', 'Save-the-Date Rückmeldung', 'vorerst zugesagte Personen', 'Save-the-Date Rückmeldung am', 'Save-the-Date Reminder versendet am', 'Save-the-Date Rückmeldung über', 'Save-the-Date Bemerkung', 'Einladung versendet?', 'Einladung versendet am', 'Einladung versendet von', 'Einladung Medium', 'Einladung Rückmeldung', 'Einladung Rückmeldung am', 'Einladung Rückmeldung über', 'Einladung Bemerkung'];
const person = (id, e, v, n, umfang) => {
  const r = PERSONEN_KOPF.map(() => '');
  Object.assign(r, { 0: id, 1: e, 2: v, 3: n, 6: 'Hauptliste', 7: umfang });
  r[15] = /nachmittag/i.test(umfang) ? 'Offen' : 'Nicht eingeladen';
  r[16] = /abend/i.test(umfang) ? 'Offen' : 'Nicht eingeladen';
  return r;
};
const einheit = (id, name) => { const r = EINHEITEN_KOPF.map(() => ''); r[0] = id; r[1] = name; return r; };

const sheets = {
  'Gästeliste – Personen': new Sheet('Gästeliste – Personen', [PERSONEN_KOPF,
    person('P001', 'E001', 'Max', 'Muster', 'Nachmittag + Abend'),
    person('P002', 'E001', 'Freundin Max', '', 'Nachmittag + Abend'),
    person('P003', 'E002', 'Erika', 'Probe', 'Nur Abend')]),
  'Versand & Einladungen': new Sheet('Versand & Einladungen', [EINHEITEN_KOPF, einheit('E001', 'Max & Begleitung'), einheit('E002', 'Erika'), einheit('E003', '')]),
};
const ss = {
  getSheetByName: n => sheets[n] || null,
  insertSheet: n => (sheets[n] = new Sheet(n)),
};
const ctx = {
  SpreadsheetApp: { getActive: () => ss },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: t => ({ text: t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
  Utilities: { formatDate: d => d.toISOString() },
  Logger: { log: m => console.log('  [Logger]', m) },
  console,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx);

const post = obj => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(obj) } }).text);

// 1. Einrichten
ctx.einrichten();
const E = sheets['Versand & Einladungen'], P = sheets['Gästeliste – Personen'];
for (const n of ['App-Fragen', 'App-Einstellungen', 'App-Antworten Personen', 'App-Antworten Einladungen', 'App-Protokoll']) assert(sheets[n], n + ' fehlt');
const code1 = E.wert('Einladungseinheit-ID', 'E001', 'Einladungs-Code');
assert(code1 && code1.length === 8, 'Code für E001 fehlt');
assert.strictEqual(E.wert('Einladungseinheit-ID', 'E003', 'Einladungs-Code'), '', 'leere Einheit darf keinen Code bekommen');
console.log('✓ einrichten: Blätter + Codes angelegt');

// 2. Admin
const pw = sheets['App-Einstellungen'].wert('Einstellung', 'Admin-Passwort', 'Wert');
assert.strictEqual(post({ aktion: 'admin.daten', passwort: 'falsch' }).ok, false);
let r = post({ aktion: 'admin.einstellungenSpeichern', passwort: pw, einstellungen: { 'Webseiten-Adresse': 'https://beispiel.de/einladung/' } });
assert(r.ok, r.fehler);
assert.strictEqual(E.wert('Einladungseinheit-ID', 'E001', 'Persönlicher Link'), 'https://beispiel.de/einladung/?c=' + code1);
assert.strictEqual(E.wert('Einladungseinheit-ID', 'E001', 'Einladungs-Code'), code1, 'Code darf sich nicht ändern');
assert.strictEqual(r.einheiten.length, 2);
console.log('✓ Admin: Passwortprüfung, Links erzeugt, Codes stabil');

// 3. Gast laden
r = post({ aktion: 'gast.laden', code: code1 });
assert(r.ok, r.fehler);
assert.strictEqual(r.einheit.personen.length, 2);
assert.strictEqual(r.einheit.personen[1].platzhalter, true);
assert.strictEqual(r.einheit.personen[0].nachmittagEingeladen && r.einheit.personen[0].abendEingeladen, true);
assert.strictEqual(post({ aktion: 'gast.laden', code: 'gibtsnicht' }).ok, false);
console.log('✓ Gast laden: Personen, Platzhalter, Einladungsumfang');

// 4. Gast senden
r = post({ aktion: 'gast.senden', code: code1, personen: [
  { id: 'P001', nachmittag: 'Ja', abend: 'Ja', antworten: { ernaehrung: 'Vegetarisch', gluten: 'Nein', allergie: 'Ja', allergie_details: 'Nüsse', getraenke: ['Wein', 'Wasser'] } },
  { id: 'P002', name: 'Lisa Probe', nachmittag: 'Nein', abend: 'Ja', antworten: { ernaehrung: 'Vegan', gluten: 'Ja', allergie: 'Nein' } },
], antworten: { kuchen: 'Ja', kuchen_art: 'Käsekuchen', nachricht: 'Freuen uns!' } });
assert(r.ok, r.fehler);
assert.strictEqual(r.status, 'Zugesagt');
assert.strictEqual(P.wert('Person-ID', 'P001', 'Finale Teilnahme Nachmittag'), 'Ja');
assert.strictEqual(P.wert('Person-ID', 'P002', 'Finale Teilnahme Nachmittag'), 'Nein');
assert.strictEqual(P.wert('Person-ID', 'P001', 'Ernährungsweise'), 'Vegetarisch');
assert.strictEqual(P.wert('Person-ID', 'P001', 'Details Allergien/Besonderheiten'), 'Nüsse');
assert.strictEqual(P.wert('Person-ID', 'P002', 'Glutenfrei?'), 'Ja');
assert.strictEqual(P.wert('Person-ID', 'P002', 'Bemerkungen zur Person'), 'Name laut Anmeldung: Lisa Probe');
assert.strictEqual(E.wert('Einladungseinheit-ID', 'E001', 'Einladung Rückmeldung'), 'Zugesagt');
assert.strictEqual(E.wert('Einladungseinheit-ID', 'E001', 'Einladung Rückmeldung über'), 'Online-Formular');
assert.strictEqual(E.wert('Einladungseinheit-ID', 'E001', 'Einladung Bemerkung'), 'Freuen uns!');
const AP = sheets['App-Antworten Personen'];
assert.strictEqual(AP.wert('Person-ID', 'P001', 'Lieblingsgetränke [getraenke]'), 'Wein, Wasser');
assert.strictEqual(sheets['App-Antworten Einladungen'].wert('Einladungseinheit-ID', 'E001', 'Was für einen Kuchen? [kuchen_art]'), 'Käsekuchen');
console.log('✓ Gast senden: Personenblatt, Einladungsblatt, App-Antworten');

// 5. Änderung: Absage überschreibt, Essensangaben werden geleert, Antwortzeilen werden ersetzt statt angehängt
r = post({ aktion: 'gast.senden', code: code1, personen: [
  { id: 'P001', nachmittag: 'Nein', abend: 'Nein', antworten: { ernaehrung: 'Vegetarisch' } },
  { id: 'P002', name: 'Lisa Probe', nachmittag: 'Nein', abend: 'Ja', antworten: { ernaehrung: 'Vegan', gluten: 'Ja', allergie: 'Nein' } },
], antworten: {} });
assert.strictEqual(r.status, 'Teilweise zugesagt');
assert.strictEqual(P.wert('Person-ID', 'P001', 'Ernährungsweise'), '');
assert.strictEqual(AP.getLastRow(), 3, 'pro Person nur eine Zeile');
assert.strictEqual(post({ aktion: 'gast.laden', code: code1 }).einheit.personen[0].antwort.nachmittag, 'Nein');
console.log('✓ Änderung: überschreibt sauber, Status „Teilweise zugesagt“');

// 6. Ungültige Werte und „Nicht eingeladen“ bleiben geschützt
const code2 = E.wert('Einladungseinheit-ID', 'E002', 'Einladungs-Code');
post({ aktion: 'gast.senden', code: code2, personen: [{ id: 'P003', nachmittag: 'Ja', abend: 'Unsicher', antworten: {} }], antworten: {} });
assert.strictEqual(P.wert('Person-ID', 'P003', 'Finale Teilnahme Nachmittag'), 'Nicht eingeladen');
assert.strictEqual(P.wert('Person-ID', 'P003', 'Finale Teilnahme Abend'), 'Offen', 'Unsicher ist standardmäßig nicht erlaubt');
console.log('✓ Schutz: nicht eingeladene Teile + nicht erlaubte Werte');

// 7. Fragen bearbeiten
const fragen = post({ aktion: 'admin.daten', passwort: pw }).fragen;
fragen.push({ id: 'anreise', aktiv: true, ebene: 'Einladung', typ: 'auswahl', frage: 'Wie reist ihr an?', optionen: ['Auto', 'Zu Fuß'], pflicht: false, bedingung: 'dabei', zielspalte: '' });
fragen.splice(0, 1);
r = post({ aktion: 'admin.fragenSpeichern', passwort: pw, fragen });
assert(r.ok, r.fehler);
assert.strictEqual(r.fragen.at(-1).optionen.join('|'), 'Auto|Zu Fuß');
assert(!r.fragen.some(f => f.id === 'ernaehrung'));
assert.strictEqual(sheets['App-Fragen'].getLastRow(), fragen.length + 1, 'alte Zeilen müssen weg sein');
console.log('✓ Fragen speichern: hinzufügen, löschen, Reihenfolge');

// 8. Formular schließen
post({ aktion: 'admin.einstellungenSpeichern', passwort: pw, einstellungen: { 'Formular offen': 'Nein' } });
assert.strictEqual(post({ aktion: 'gast.senden', code: code1, personen: [], antworten: {} }).ok, false);
console.log('✓ Formular geschlossen blockiert Antworten');
console.log('\nAlle Tests bestanden.');
