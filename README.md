# 🎬 MoveMe - Film Bewertungs-App

Eine moderne Web-App zum Bewerten und Taggen von Filmen, entwickelt mit Next.js und Supabase.

## ✨ Features

- 🎥 Filme zur Datenbank hinzufügen
- ⭐ Filme bewerten (1-5 Sterne)
- 🏷️ Filme mit Tags kategorisieren
- 📊 Durchschnittsbewertungen anzeigen
- 💾 Persistente Speicherung mit Supabase
- 📱 Responsive Design mit Tailwind CSS

## 🚀 Setup

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Klicke auf "Start your project"
3. Registriere dich mit deiner E-Mail (keine Kreditkarte nötig!)
4. Erstelle ein neues Projekt
5. Warte bis das Projekt bereit ist

### 2. Datenbank einrichten

1. Gehe zu deinem Supabase Dashboard
2. Klicke auf "SQL Editor" in der Seitenleiste
3. Kopiere den Inhalt von `supabase/schema.sql` 
4. Füge ihn in den SQL Editor ein und führe ihn aus

### 3. Umgebungsvariablen konfigurieren

1. Kopiere die Supabase URL und den anon key aus deinem Dashboard
2. Bearbeite die `.env.local` Datei:

```env
NEXT_PUBLIC_SUPABASE_URL=deine-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

### 4. Abhängigkeiten installieren und starten

```bash
npm install
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000)

## 🔧 Verwendete Technologien

- **Frontend**: Next.js 15 mit App Router
- **Backend**: Next.js API Routes
- **Datenbank**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Sprache**: TypeScript
- **Hosting**: Vercel (kostenlos)

## 📦 Deployment auf Vercel

1. Pushe dein Projekt zu GitHub
2. Gehe zu [vercel.com](https://vercel.com)
3. Importiere dein GitHub Repository
4. Füge die Umgebungsvariablen hinzu
5. Deploy!

## 🎯 Nächste Features

- 🔐 Benutzer-Authentication
- 🏷️ Tag-Management System
- 🔍 Erweiterte Suchfunktionen
- 📷 Poster-Upload
- 📈 Statistiken und Diagramme
- 💬 Kommentare und Reviews

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.
