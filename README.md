# Gesundheitstagebuch

Ein **local-first Symptomtagebuch** zur beweissicheren Selbstdokumentation von
Darmfunktionsstörungen – gedacht als Grundlage für Arztgespräche und für ein
Schwerbehinderten-Feststellungsverfahren (GdB). Die erfassten Felder bilden die
Bewertungskriterien nach VersMedG Teil B 10.2.2 / 10.2.4 ab.

> **Hinweis:** Dies ist ein Selbstdokumentationswerkzeug und **kein Medizinprodukt**. Es stellt
> keine Diagnosen und gibt keine Behandlungs- oder Ernährungsempfehlungen.

## Datenschutz

Alle Daten werden **ausschließlich lokal im Browser** (IndexedDB) gespeichert. Es gibt keinen
Server und keine Datenübertragung. Sicherung erfolgt über manuellen JSON-Export. Eine optionale
PIN-Sperre schützt vor beiläufigem Fremdzugriff.

## Funktionen

- **Schnellerfassung** eines Stuhlgangs in unter 15 Sekunden (Bristol-Skala, Vorwarnzeit,
  Inkontinenz, optional Schmerzen/Blut/Ort/Notiz)
- **Mahlzeiten** und **Tagesabschluss** (Gewicht, Appetit, Befinden, Einschränkungen, Medikamente)
- **Verlauf** mit Bearbeiten/Löschen und Nachtragen für vergangene Tage
- **Auswertung**: Stühle/Tag, Bristol-Verteilung, Heatmap (Stunde × Tag), Histogramm „Minuten nach
  Mahlzeit“, Inkontinenz-Zeitstrahl, Gewichtsverlauf
- **Arztbericht** als druckbares PDF (Kennzahlen, Grafiken, chronologische Rohdatentabelle) sowie
  CSV-Export
- **PWA**: installierbar, offlinefähig
- **Backup**: JSON Export/Import

## Entwicklung

```bash
npm install
npm run dev       # Entwicklungsserver
npm run build     # Typecheck + Produktionsbuild nach dist/
npm run preview   # Build lokal ansehen
```

Stack: React + TypeScript + Vite · Tailwind CSS · Dexie.js (IndexedDB) · Recharts · vite-plugin-pwa.

## Deployment

Push auf `main` löst den GitHub-Actions-Workflow aus, der die App baut und auf GitHub Pages
veröffentlicht: <https://bernhardmayr.github.io/gesundheitstagebuch/>

Der `base`-Pfad in `vite.config.ts` ist auf `/gesundheitstagebuch/` gesetzt und muss zum
Repository-Namen passen.
