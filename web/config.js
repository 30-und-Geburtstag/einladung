// Adresse der Google-Apps-Script-Web-App (endet auf /exec).
// Leer lassen = Demo-Modus mit Beispieldaten (nur zum Ausprobieren).
window.EINLADUNG_API = 'https://script.google.com/macros/s/AKfycbwpRGc60a_49PIq6JY2SV5G42u65ajFgAWWrt9wYkKURNOfdsofoyTVfFA3729LAYTs/exec';

// Zum Testen: ?demo an die Adresse hängen (oder Code demo1–demo3) → Beispieldaten statt echter Tabelle
if (/[?&]demo\b/.test(location.search) || /^demo\d$/.test(new URLSearchParams(location.search).get('c') || '')) {
  window.EINLADUNG_API = '';
}
