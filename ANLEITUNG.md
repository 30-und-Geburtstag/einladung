# Einladung Aysel & Robin – Einrichtung

## Was es gibt

- **Anmeldeseite für Gäste** – öffnet sich über den persönlichen Link bzw. QR-Code (`…/?c=CODE`).
  Zeigt nur die eigenen Personen und nur die Zeiten, zu denen sie eingeladen sind.
- **Verwaltung** – `…/admin.html`, mit Passwort. Übersicht, Einladungen (Begleittext kopieren,
  persönliche Karte mit QR herunterladen), Fragen bearbeiten, Einstellungen.
- **Google-Skript** (`apps-script/Code.gs`) – speichert alles direkt in eurem Google Sheet.

## Einmalig einrichten (ca. 10 Minuten)

1. Das Google Sheet mit der Gästeliste öffnen.
2. Menü **Erweiterungen → Apps Script**.
3. Im Editor den vorhandenen Text komplett löschen, den Inhalt von `apps-script/Code.gs` einfügen, speichern (Diskettensymbol).
4. Oben in der Auswahl die Funktion **einrichten** wählen → **Ausführen**.
   Google fragt nach Berechtigungen: Konto wählen → „Erweitert“ → „Zu … wechseln (unsicher)“ → Zulassen.
   (Die Warnung erscheint bei jedem selbst geschriebenen Skript.)
5. Im Sheet gibt es jetzt neue Blätter: **App-Fragen, App-Einstellungen, App-Antworten Personen,
   App-Antworten Einladungen, App-Protokoll**, und in „Versand & Einladungen“ die Spalten
   **Einladungs-Code** und **Persönlicher Link**.
6. Im Apps-Script-Editor: **Bereitstellen → Neue Bereitstellung** → Zahnrad → **Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
   → Bereitstellen → die **Web-App-URL** (endet auf `/exec`) kopieren und Claude schicken.
7. Das Admin-Passwort steht im Blatt **App-Einstellungen**.

## Wenn das Skript später geändert wird

Code im Apps-Script-Editor ersetzen → **Bereitstellen → Bereitstellungen verwalten** → Stift →
Version „Neue Version“ → Bereitstellen. Die URL bleibt gleich.

## Wichtig

- Blattnamen „Gästeliste – Personen“ und „Versand & Einladungen“ und die Spaltenüberschriften nicht umbenennen.
- Neue Gäste: wie bisher in beiden Blättern eintragen, dann in der Verwaltung unter
  Einstellungen einmal **Speichern** drücken – dann bekommen neue Einladungen Code und Link.
- Alle Antworten stehen zusätzlich mit Zeitstempel im Blatt **App-Protokoll** (nichts geht verloren).

## Für Claude: lokal testen

- Vorschau: `npx http-server web -p 5180` → `http://localhost:5180/?c=demo1` bzw. `/admin.html` (Passwort `demo`).
  Solange `web/config.js` keine API-URL enthält, läuft alles mit Beispieldaten.
- Skript-Tests: `npm test`
- Online stellen (GitHub Pages, Branch gh-pages = Inhalt von web/): `npm run veroeffentlichen`
- Live: https://bandrixoriginal.github.io/einladung/ (Verwaltung: …/admin.html)
