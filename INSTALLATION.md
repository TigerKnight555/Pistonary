# 🐳 Docker Installation für Pistonary auf Ubuntu Server

Diese Anleitung zeigt dir, wie du Pistonary auf einem Ubuntu Server mit Docker installierst und betreibst.

## 📋 Voraussetzungen

- Ubuntu Server (getestet mit Ubuntu 20.04+)
- Root- oder sudo-Zugriff
- Internetverbindung

## 🚀 Installation

### Schritt 1: Docker installieren

Falls Docker noch nicht installiert ist:

```bash
# System aktualisieren
sudo apt update
sudo apt upgrade -y

# Docker-Repository einrichten
sudo apt install -y ca-certificates curl gnupg lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker ohne sudo nutzbar machen (optional)
sudo usermod -aG docker $USER
# Nach diesem Befehl neu einloggen oder `newgrp docker` ausführen
```

Docker-Installation prüfen:
```bash
docker --version
docker compose version
```

### Schritt 2: Projekt auf den Server laden

#### Option A: Mit Git (empfohlen)

```bash
# Git installieren (falls nicht vorhanden)
sudo apt install -y git

# Repository klonen
cd ~
git clone https://github.com/TigerKnight555/Pistonary.git
cd Pistonary
```

#### Option B: Manuell hochladen

```bash
# Auf deinem lokalen Rechner: Projekt als ZIP komprimieren und hochladen
scp pistonary.zip username@server-ip:~/

# Auf dem Server: Entpacken
cd ~
unzip pistonary.zip
cd Pistonary
```

### Schritt 3: Datenverzeichnis erstellen

```bash
# Erstelle ein Verzeichnis für die SQLite-Datenbank
mkdir -p data

# Setze die richtigen Berechtigungen
chmod 755 data
```

### Schritt 4: Docker-Image bauen und Container starten

**Wichtig:** Prüfe zuerst, ob Port 3001 frei ist:
```bash
sudo lsof -i :3001
# Wenn nichts angezeigt wird, ist der Port frei ✅
# Wenn etwas angezeigt wird, siehe "Konfiguration" → Port ändern
```

Container starten:
```bash
# Mit Docker Compose (empfohlen)
docker compose up -d

# Falls der Build fehlschlägt, versuche es mit --no-cache:
# docker compose build --no-cache
# docker compose up -d

# ODER: Manuell mit Docker
docker build -t pistonary .
docker run -d \
  --name pistonary \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  pistonary
```

### Schritt 5: Installation überprüfen

```bash
# Container-Status prüfen
docker compose ps
# oder
docker ps

# Logs anschauen
docker compose logs -f
# oder
docker logs -f pistonary
```

Die Anwendung sollte jetzt unter `http://deine-server-ip:3001` erreichbar sein!

## 🔧 Konfiguration

### ⚠️ Wichtig: Andere Docker-Container auf dem Server

Pistonary läuft **komplett isoliert** in seinem eigenen Container und Netzwerk. Deine bestehenden Docker-Container sind **absolut sicher** und werden nicht beeinflusst!

**Möglicher Konflikt:** Port 3001 könnte schon belegt sein.

**Lösung - Port prüfen:**
```bash
# Prüfe, ob Port 3001 schon verwendet wird
sudo netstat -tulpn | grep 3001
# oder
sudo lsof -i :3001
```

**Falls Port belegt - Anderen Port verwenden:**

Bearbeite die `docker-compose.yml`:
```bash
nano docker-compose.yml
```

Ändere die Zeile unter `ports:`:
```yaml
ports:
  - "8080:3001"  # Nutze 8080 statt 3001 (oder jeden anderen freien Port)
```

Die **linke Zahl** ist der Port auf deinem Server (änderbar).  
Die **rechte Zahl** ist der Port im Container (nicht ändern!).

### Umgebungsvariablen anpassen

Bearbeite die `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Wichtige Umgebungsvariablen:
- `PORT`: Port auf dem der Server läuft (Standard: 3001)
- `JWT_SECRET`: Geheimer Schlüssel für JWT-Tokens (setze einen eigenen!)
- `NODE_ENV`: Umgebung (production für Live-Betrieb)

### Datenbank-Speicherort ändern

In der `docker-compose.yml` unter `volumes`:

```yaml
volumes:
  # Standard: Im Projektordner
  - ./data:/app/data
  
  # Oder: An einem anderen Ort
  - /pfad/zu/deinem/speicherort:/app/data
```

### Port ändern

In der `docker-compose.yml` unter `ports`:

```yaml
ports:
  - "8080:3001"  # Außen:Innen (hier wäre die App unter Port 8080 erreichbar)
```

Nach Änderungen Container neu starten:
```bash
docker compose down
docker compose up -d
```

## 🌐 Reverse Proxy mit Nginx (optional, aber empfohlen)

Für HTTPS und eine schöne Domain-Adresse:

### Nginx installieren

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Nginx-Konfiguration erstellen

```bash
sudo nano /etc/nginx/sites-available/pistonary
```

Inhalt:

```nginx
server {
    listen 80;
    server_name deine-domain.de;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Konfiguration aktivieren

```bash
sudo ln -s /etc/nginx/sites-available/pistonary /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL-Zertifikat einrichten (HTTPS)

```bash
sudo certbot --nginx -d deine-domain.de
```

Folge den Anweisungen. Certbot richtet automatisch HTTPS ein und erneuert Zertifikate.

## 🔄 Verwaltung

### Container-Befehle

```bash
# Container starten
docker compose up -d

# Container stoppen
docker compose down

# Container neu starten
docker compose restart

# Logs live anzeigen
docker compose logs -f

# Container-Status
docker compose ps

# In den Container "reingehen"
docker compose exec pistonary sh
```

### Updates installieren

```bash
# Code aktualisieren (bei Git)
git pull

# Container neu bauen und starten
docker compose down
docker compose up -d --build
```

### Datenbank sichern

```bash
# Backup erstellen
cp data/pistonary.sqlite data/pistonary.sqlite.backup-$(date +%Y%m%d)

# Oder mit Docker-Volume
docker compose exec pistonary cp /app/data/pistonary.sqlite /app/data/pistonary.sqlite.backup
```

### Datenbank wiederherstellen

```bash
# Container stoppen
docker compose down

# Backup zurückspielen
cp data/pistonary.sqlite.backup-20250130 data/pistonary.sqlite

# Container starten
docker compose up -d
```

## 🔥 Firewall konfigurieren (UFW)

```bash
# UFW aktivieren (falls noch nicht aktiv)
sudo ufw enable

# Port für Pistonary öffnen (nur wenn KEIN Nginx verwendet wird)
sudo ufw allow 3001/tcp

# Für Nginx (HTTP und HTTPS)
sudo ufw allow 'Nginx Full'

# SSH nicht vergessen!
sudo ufw allow ssh

# Status prüfen
sudo ufw status
```

## 🐛 Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker compose logs

# Container-Details anzeigen
docker compose ps -a
```

### Port bereits belegt

```bash
# Prüfen, welcher Prozess Port 3001 nutzt
sudo lsof -i :3001

# Anderen Port in docker-compose.yml verwenden
```

### Datenbank-Fehler

```bash
# Container stoppen
docker compose down

# Berechtigungen prüfen
ls -la data/

# Wenn nötig, Berechtigungen setzen
chmod 755 data
chmod 644 data/pistonary.sqlite

# Container neu starten
docker compose up -d
```

### "Cannot connect to Docker daemon"

```bash
# Docker-Service starten
sudo systemctl start docker

# Bei Boot automatisch starten
sudo systemctl enable docker
```

## 📊 Ressourcen-Überwachung

```bash
# Container-Ressourcen live anzeigen
docker stats pistonary

# Speicherplatz prüfen
du -sh data/
df -h
```

## 🎯 Produktions-Tipps

1. **Setze ein starkes JWT_SECRET** in der `docker-compose.yml`
2. **Nutze HTTPS** mit Nginx und Let's Encrypt
3. **Erstelle regelmäßige Backups** der Datenbank
4. **Überwache die Logs** auf Fehler
5. **Halte Docker und Ubuntu aktuell**
6. **Setze eine Firewall** (UFW) ein
7. **Nutze einen Monitoring-Service** (z.B. Uptime Kuma, Netdata)

## 📝 Systemd-Service (Alternative zu Docker Compose)

Falls du den Container als Systemd-Service verwalten möchtest:

```bash
sudo nano /etc/systemd/system/pistonary.service
```

Inhalt:

```ini
[Unit]
Description=Pistonary Docker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/username/Pistonary
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Service aktivieren:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pistonary
sudo systemctl start pistonary
```

## 🎉 Fertig!

Pistonary läuft jetzt in einem Docker-Container auf deinem Ubuntu Server!

Zugriff:
- **Direkt:** `http://deine-server-ip:3001`
- **Mit Nginx:** `http://deine-domain.de` oder `https://deine-domain.de`

Viel Spaß mit Pistonary! 🚗💨
