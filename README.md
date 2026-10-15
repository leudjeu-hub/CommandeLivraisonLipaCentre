# Commande & Livraison – Librairie Papeterie du Centre (Yaoundé)

Prototyp einer Bestellseite für die **Librairie Papeterie du Centre** in Yaoundé, Kamerun.
Kundinnen und Kunden stellen Bücher und Schreibwaren in einen Warenkorb, geben ihre
Lieferadresse an und erhalten eine **Bestellzusammenfassung zum Herunterladen oder Kopieren**,
die sie dann per Telefon/WhatsApp an die Buchhandlung schicken.

> **Status: Präsentationsversion.** Produkte und Preise sind Beispiele. Es werden keine
> Bestellungen übertragen und keine Zahlungen abgewickelt.

## Funktionen

- **Katalog** mit Suche und Filtern (Scolaire, Bureau, Livres), Preise in FCFA
- **Warenkorb** mit Mengenänderung; wird im Browser gespeichert (`localStorage`)
- **Bestellformular** für die Lieferung in Yaoundé: Name, Telefon, Quartier, Adresse/Orientierungspunkt,
  Wunsch-Zeitfenster, Zahlart bei Lieferung (Bargeld, Orange Money, MTN MoMo)
- **Angebotsanfrage** für Schullisten und Bücher „sur devis“ (Titel, Klasse, Ausgabe)
- **Zusammenfassung** als `.txt` herunterladen oder in die Zwischenablage kopieren
- Responsive Layout für Smartphone, Tablet und Desktop
- Oberfläche auf Französisch

## Projektstruktur

```
.
├── Librairie Papeterie du Centre · Yaoundé.html   # die komplette Seite (HTML, CSS, JS in einer Datei)
├── README.md                                       # diese Datei
└── DEV.md                                          # persönliche Lernnotizen (Tools & Themen)
```

## Lokal starten

Kein Build, keine Abhängigkeiten. Die HTML-Datei einfach im Browser öffnen:

```bash
open "Librairie Papeterie du Centre · Yaoundé.html"
```

Oder über einen kleinen lokalen Server (empfohlen, damit „Kopieren“ zuverlässig funktioniert):

```bash
python3 -m http.server 8000
# dann http://localhost:8000 im Browser öffnen
```

## Produkte anpassen

Die Produkte stehen im `<script>`-Block der HTML-Datei im Array `products`:

```js
{ id: 1, name: 'Cahier A4 · 200 pages', cat: 'Scolaire',
  desc: 'Quadrillé, pour les cours et les exercices.',
  price: 1500, color: '#31574b', label: 'CAHIER\n200 PAGES' }
```

- `price: null` → Artikel wird als „Sur devis“ (Angebotsanfrage) angezeigt
- `cat` muss einer der Filter sein: `Scolaire`, `Bureau`, `Livres`
- `id` muss eindeutig sein

## Bis zum echten Betrieb (To-do)

- [ ] Adresse, Geschäftstelefon und WhatsApp-Nummer eintragen
- [ ] Echte Produkte, Preise und Lagerbestand einpflegen
- [ ] Bestellungen tatsächlich übermitteln (z. B. WhatsApp-Link, E-Mail oder Backend)
- [ ] Liefergebiete und Lieferkosten festlegen
- [ ] Impressum, Verkaufsbedingungen und Datenschutzerklärung prüfen lassen
- [ ] Datei in `index.html` umbenennen und veröffentlichen (z. B. GitHub Pages)

## Lizenz

Noch nicht festgelegt.
