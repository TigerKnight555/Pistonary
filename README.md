# 🚗 Pistonary - Deine Fahrzeugverwaltung & Tankbuch-App

Eine moderne Webanwendung, um deine Fahrzeuge, Tankungen, Wartungen und Kosten zu verwalten. Mit Pistonary behältst du den kompletten Überblick über dein Auto - egal ob ein Fahrzeug oder mehrere.

## 📋 Worum geht's?

Pistonary ist deine digitale Garage! Hier kannst du:
- **Deine Autos verwalten** - Mehrere Fahrzeuge anlegen und easy zwischen ihnen wechseln
- **Tankungen tracken** - Jede Tankung erfassen und sehen, was dich dein Auto wirklich kostet
- **Wartungen planen** - Nie wieder eine Inspektion vergessen
- **Kosten im Blick behalten** - Von Sprit über Wartung bis zu Steuern - alles an einem Ort
- **Dein eigenes Design** - Stelle die Farben nach deinem Geschmack ein

## ✨ Was kann Pistonary?

### 🚙 Fahrzeugverwaltung
- Lege so viele Autos an, wie du willst
- Speichere alle wichtigen Infos: Fotos, Hersteller, Modell, PS
- Wische auf dem Handy zwischen deinen Autos hin und her
- Trage Steuern und Versicherung ein

### ⛽ Tankbuch - Endlich wissen, was Sprit wirklich kostet
- Tankungen eintragen: Datum, Liter, Preis, Kilometerstand
- Pistonary rechnet automatisch aus:
  - Wie viel verbraucht dein Auto? (L/100km)
  - Was kostet dich jeder Kilometer?
  - Wie entwickelt sich der Spritpreis?
- Schicke Charts zeigen dir alles auf einen Blick
- Verschiedene Ansichten: Verbrauch, Kosten, Kilometerstand, und mehr
- Filter nach Zeitraum (letzter Monat, Quartal, Jahr, alles)
- Tankungen löschen per Wisch-Geste

### 🔧 Wartungsverwaltung - Vergiss nie wieder was
- 23 verschiedene Wartungsarten (Ölwechsel, Bremsen, Filter, etc.)
- Eigene Intervalle für jedes Auto einstellen
- Erinnerung nach Kilometern oder Zeit
- Sofort sehen: Was ist fällig? Was läuft noch?
- Wartungshistorie mit allen Kosten
- Verschiedene Ölsorten zur Auswahl (0W-20, 5W-30, etc.)

### 💰 Kostenkontrolle - Wo geht das Geld hin?
- **Spritkosten**: Werden aus deinen Tankungen berechnet
- **Wartungskosten**: Alle Reparaturen und Inspektionen
- **Sonstige Ausgaben**: Zubehör, Umbauten, was auch immer
- **Fixkosten**: Steuern und Versicherung pro Jahr
- Wähle deinen Zeitraum und sieh, was dich dein Auto monatlich kostet
- Farbige Übersicht zeigt dir sofort, wo die Kohle hingeht

### 📊 Übersichten & Stats
- Die letzten Tankungen auf einen Blick
- Wartungsstatus zeigt dir, was bald ansteht
- Gesamtkosten aufklappbar mit allen Details
- Charts kannst du anpassen - zeig nur was dich interessiert
- Sieht auf Handy und Desktop gut aus

### 🎨 Mach's zu deinem
- Dark Mode ist Standard (schont die Augen)
- Wähle deine Lieblingsfarben für die App
- Fertige Farbschemata oder ganz individuell
- Wichtige Widgets bleiben farblich gleich (besser lesbar)

## 🛠️ Was steckt drin?

**Frontend**
- React 18 mit TypeScript
- Material-UI für schöne Komponenten
- Recharts für die Diagramme
- Vite für schnelle Entwicklung

**Backend**
- Express API
- SQLite Datenbank
- TypeORM
- JWT-Login

## 🚀 Los geht's

### Development (Lokal entwickeln)

```bash
# Projekt runterladen
git clone https://github.com/TigerKnight555/Pistonary.git
cd Pistonary

# Alles installieren
npm install

# Frontend + Backend gleichzeitig starten
npm run dev:all

# ODER einzeln starten:
# Frontend (in Terminal 1)
npm run dev

# Backend (in Terminal 2)
npm run dev:server
```

### Production (Auf Server deployen)

```bash
# Frontend builden + Backend starten
npm run production

# ODER Schritt für Schritt:
# 1. Frontend builden
npm run build

# 2. Backend starten (served dann auch das gebaute Frontend)
npm run start
```

## 📱 Handy-optimiert

- Funktioniert super auf dem Smartphone
- Wisch-Gesten zum Navigieren und Löschen
- Touch-optimierte Buttons
- Passt sich an jeden Bildschirm an

## 🎯 Für wen ist das?

- **Autobesitzer**: Behalte den Überblick über dein Auto
- **Familien**: Verwalte alle Familienautos an einem Ort
- **Oldtimer-Fans**: Dokumentiere jede Wartung penibel
- **Sparfüchse**: Sieh genau, wo du sparen kannst
- **Kleine Firmen**: Für überschaubare Fuhrparks

## 👤 Über das Projekt & den Entwickler

Hi! Ich bin Software-Entwickler und wollte mal testen, wie weit man mit **Vibe Coding** kommt - also einfach drauf los coden und schauen was passiert. Pistonary ist das Ergebnis dieses Experiments! 🚀

Das komplette Projekt wurde mit **GitHub Copilot Agent** entwickelt, zuerst mit Claude Sonnet 4, später mit 4.5. Klar stecken trotzdem einige Stunden Arbeit drin, aber es war super spannend zu sehen, wie viel man mit KI-Unterstützung in kurzer Zeit aufbauen kann.

### 🤝 Mitmachen & Unterstützen

- **Features & Bugs**: Hast du Ideen für neue Features? Bugs gefunden? Her damit! Eröffne gerne ein Issue oder schick einen Pull Request.
- **Feedback**: Jede Rückmeldung hilft, die App besser zu machen.
- **Unterstützen**: Das Projekt ist komplett kostenlos und Open Source. Wenn du meine Arbeit wertschätzt und mich unterstützen möchtest, freue ich mich riesig über einen Kaffee! ☕
  
  [![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/knvt)

### 🏠 Installation auf dem Homeserver

Pistonary kannst du ganz einfach auf deinem eigenen Server zuhause installieren und nutzen. Ein paar Dinge, die du wissen solltest:

**Netzwerk-Zugriff:**
- Die App läuft lokal auf deinem Server
- Um sie zu nutzen, musst du im gleichen Netzwerk sein wie der Server
- **Tipp für unterwegs**: Richte einen VPN ins Heimnetz ein! Mit **WireGuard** über die FritzBox geht das super einfach und du hast von überall Zugriff auf deine Daten.

**Installation:**
```bash
# Projekt runterladen
git clone https://github.com/TigerKnight555/Pistonary.git
cd Pistonary

# Alles installieren
npm install

# Für Production (Server-Betrieb)
npm run production

# Die App läuft dann auf http://localhost:3001
```
npm run dev
```

**Für Production:**
```bash
# Build erstellen
npm run build

# Dann kannst du z.B. mit PM2 oder einem anderen Process Manager
# das Backend dauerhaft laufen lassen
```

### 📜 Lizenz & Nutzung

Dieses Projekt ist **Open Source** - jeder darf es auf seinem Homeserver installieren und nutzen! 
Entwickelt mit ❤️ und KI-Power von TigerKnight555
