// Demo-Backend mit erfundenen Beispieldaten, aktiv solange in config.js keine API-Adresse steht.
// Gast-Links zum Ausprobieren: ?c=demo1, ?c=demo2, ?c=demo3 – Admin-Passwort: demo
(function () {
  const SPEICHER = 'einladung-demo-v1';
  const frage = (id, ebene, typ, text, optionen, pflicht, bedingung, hilfe = '', zielspalte = '') =>
    ({ id, aktiv: true, ebene, typ, frage: text, hilfe, optionen, pflicht, bedingung, zielspalte });
  const start = () => ({
    einstellungen: {
      'Anmeldeschluss': '21.10.2026', 'Formular offen': 'Ja', 'Unsicher erlauben': 'Nein',
      'Webseiten-Adresse': location.origin + location.pathname.replace(/admin\.html$/, ''), 'Admin-Passwort': 'demo',
      'Begrüßungstext': 'Wir freuen uns riesig, mit euch zu feiern! Gebt uns bitte für jede Person kurz Bescheid.',
      'Danketext': 'Danke für eure Rückmeldung! Ihr könnt sie über denselben Link jederzeit ändern.',
    },
    fragen: [
      frage('ernaehrung', 'Person', 'auswahl', 'Ernährung', ['Keine Besonderheiten', 'Vegetarisch', 'Vegan', 'Sonstiges'], true, 'dabei', '', 'Ernährungsweise'),
      frage('ernaehrung_sonst', 'Person', 'text', 'Was genau?', [], true, 'frage:ernaehrung=Sonstiges'),
      frage('gluten', 'Person', 'ja_nein', 'Muss glutenfrei essen?', [], true, 'dabei', '', 'Glutenfrei?'),
      frage('allergie', 'Person', 'ja_nein', 'Weitere Allergien oder Unverträglichkeiten?', [], true, 'dabei', '', 'Sonstige Allergien/Besonderheiten?'),
      frage('allergie_details', 'Person', 'text', 'Welche?', [], true, 'frage:allergie=Ja', '', 'Details Allergien/Besonderheiten'),
      frage('getraenke', 'Person', 'mehrfach', 'Lieblingsgetränke', ['Bier vom Fass', 'Radler', 'Alkoholfreies Bier', 'Wein', 'Sekt / Prosecco', 'Longdrinks', 'Softdrinks / Saft', 'Wasser', 'Kaffee / Tee'], false, 'dabei', 'Hilft uns bei der Getränkeplanung – gern mehrere ankreuzen.'),
      frage('kind', 'Person', 'ja_nein', 'Ist ein Kind (unter 14 Jahren)?', [], false, 'dabei'),
      frage('kind_alter', 'Person', 'zahl', 'Alter', [], false, 'frage:kind=Ja'),
      frage('kuchen', 'Einladung', 'ja_nein', 'Möchtet ihr einen Kuchen zum Kaffee beisteuern?', [], false, 'nachmittag', 'Ganz freiwillig – für Kuchen ist auf jeden Fall gesorgt.'),
      frage('kuchen_art', 'Einladung', 'text', 'Was für einen Kuchen?', [], false, 'frage:kuchen=Ja'),
      frage('musik', 'Einladung', 'text', 'Euer Musikwunsch für die Party', [], false, 'abend', 'Ein oder mehrere Lieder – wir packen sie in die Playlist.'),
      frage('zugang', 'Einladung', 'ja_nein', 'Braucht jemand Unterstützung beim Zugang?', [], false, 'dabei', 'Der Zugang zur Location ist nicht barrierefrei.'),
      frage('nachricht', 'Einladung', 'text', 'Möchtet ihr uns noch etwas mitteilen?', [], false, 'immer', '', 'Einladung Bemerkung'),
    ],
    einheiten: [
      { id: 'E901', code: 'demo1', name: 'Max & Begleitung', umfang: 'Nachmittag + Abend', personen: [['P901', 'Max', 'Mustermann'], ['P902', 'Begleitung Max', '']] },
      { id: 'E902', code: 'demo2', name: 'Erika', umfang: 'Nur Abend', personen: [['P903', 'Erika', 'Beispiel']] },
      { id: 'E903', code: 'demo3', name: 'Familie Muster', umfang: 'Nur Nachmittag', personen: [['P904', 'Anna', 'Muster'], ['P905', 'Ben', 'Muster'], ['P906', 'Kind Anna', '']] },
    ],
    antworten: {},
  });
  const laden = () => { try { return JSON.parse(localStorage.getItem(SPEICHER)) || start(); } catch { return start(); } };
  const sichern = d => { try { localStorage.setItem(SPEICHER, JSON.stringify(d)); } catch { /* egal */ } };
  const platzhalter = v => /^(Freund|Freundin|Begleitung|Partner|Partnerin|Kind)\b/i.test(v);
  const ja = v => String(v).toLowerCase() === 'ja';
  const link = (d, e) => d.einstellungen['Webseiten-Adresse'] + '?c=' + e.code;

  window.DEMO_API = async function (req) {
    await new Promise(r => setTimeout(r, 250));
    const d = laden();
    const st = d.einstellungen;
    if (req.aktion.startsWith('admin.') && req.passwort !== st['Admin-Passwort']) throw new Error('Falsches Passwort');
    const einheit = () => {
      const e = d.einheiten.find(x => x.code === req.code);
      if (!e) throw new Error('Diese Einladung wurde nicht gefunden. Bitte prüft den Link.');
      return e;
    };
    switch (req.aktion) {
      case 'gast.laden': {
        const e = einheit(), gesp = d.antworten[e.id];
        return {
          einheit: {
            name: e.name, gesendetAm: gesp?.zeit || null, antworten: gesp?.antworten || {},
            personen: e.personen.map(([id, vorname, nachname]) => ({
              id, vorname, nachname, platzhalter: platzhalter(vorname),
              nachmittagEingeladen: /nachmittag/i.test(e.umfang), abendEingeladen: /abend/i.test(e.umfang),
              antwort: gesp?.personen.find(p => p.id === id) || null,
            })),
          },
          fragen: d.fragen.filter(f => f.aktiv),
          einstellungen: {
            anmeldeschluss: st['Anmeldeschluss'], offen: ja(st['Formular offen']), unsicherErlaubt: ja(st['Unsicher erlauben']),
            begruessung: st['Begrüßungstext'], danke: st['Danketext'],
          },
        };
      }
      case 'gast.senden': {
        if (!ja(st['Formular offen'])) throw new Error('Die Anmeldung ist geschlossen.');
        const e = einheit();
        d.antworten[e.id] = { zeit: new Date().toISOString(), personen: req.personen, antworten: req.antworten };
        sichern(d);
        return { status: 'gespeichert' };
      }
      case 'admin.login': return {};
      case 'admin.fragenSpeichern': d.fragen = req.fragen; sichern(d); return { fragen: d.fragen };
      case 'admin.einstellungenSpeichern':
        Object.entries(req.einstellungen).forEach(([k, v]) => { if (k !== 'Admin-Passwort' || String(v).trim()) st[k] = v; });
        sichern(d); break;
      case 'admin.codesErzeugen': break;
      case 'admin.daten': break;
      default: throw new Error('Unbekannte Aktion');
    }
    // admin.daten (auch Rückgabe nach dem Speichern)
    return {
      fragen: d.fragen, einstellungen: st,
      spaltenPerson: ['Ernährungsweise', 'Glutenfrei?', 'Sonstige Allergien/Besonderheiten?', 'Details Allergien/Besonderheiten', 'Bemerkungen zur Person'],
      spaltenEinladung: ['Einladung Bemerkung'],
      einheiten: d.einheiten.map(e => {
        const a = d.antworten[e.id];
        const personen = e.personen.map(([id, v, n]) => {
          const p = a?.personen.find(x => x.id === id);
          const def = t => new RegExp(t, 'i').test(e.umfang) ? (p?.[t] || 'Offen') : 'Nicht eingeladen';
          return { name: (p?.name || `${v} ${n}`).trim(), umfang: e.umfang, nachmittag: def('nachmittag'), abend: def('abend'),
            ernaehrung: p?.antworten?.ernaehrung || '', gluten: p?.antworten?.gluten || '' };
        });
        const zusagen = personen.filter(p => p.nachmittag === 'Ja' || p.abend === 'Ja').length;
        const status = !a ? 'Offen' : zusagen === personen.length ? 'Zugesagt' : zusagen ? 'Teilweise zugesagt' : 'Abgesagt';
        return { id: e.id, name: e.name, code: e.code, link: link(d, e), status,
          am: a ? new Date(a.zeit).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '', personen };
      }),
    };
  };
})();
