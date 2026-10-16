// Hängt an alle eigenen Skripte/Stylesheets in web/*.html eine neue Versionsnummer (?v=…),
// damit Browser nach dem Veröffentlichen nicht die alte, zwischengespeicherte Fassung benutzen.
const fs = require('fs');
const path = require('path');

const ordner = path.join(__dirname, '..', 'web');
const version = Date.now().toString(36);
for (const datei of fs.readdirSync(ordner).filter(d => d.endsWith('.html'))) {
  const pfad = path.join(ordner, datei);
  const alt = fs.readFileSync(pfad, 'utf8');
  const neu = alt.replace(/((?:src|href)="(?!https?:|data:)[^"?]+\.(?:js|css))(?:\?v=[^"]*)?"/g, `$1?v=${version}"`);
  if (neu !== alt) fs.writeFileSync(pfad, neu);
}
console.log('Version', version);
