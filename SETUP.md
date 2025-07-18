# Supabase Setup Anleitung

## 🔥 Schritt-für-Schritt Anleitung

### 1. Supabase Account erstellen
1. Gehe zu https://supabase.com
2. Klicke auf "Start your project"
3. Registriere dich mit deiner E-Mail (keine Zahlungsinfos nötig!)

### 2. Neues Projekt erstellen
1. Klicke auf "New project"
2. Wähle eine Organisation (oder erstelle eine neue)
3. Gib einen Projekt-Namen ein (z.B. "moveme")
4. Erstelle ein sicheres Passwort
5. Wähle eine Region (Europe West für Deutschland)
6. Klicke auf "Create new project"

### 3. Warten auf Setup
- Das Projekt wird automatisch erstellt (1-2 Minuten)
- Du siehst eine Ladeanimation

### 4. Datenbank Schema einrichten
1. Gehe zu "SQL Editor" in der Seitenleiste
2. Kopiere den gesamten Inhalt aus `supabase/schema.sql`
3. Füge ihn in den SQL Editor ein
4. Klicke auf "Run" (▶️ Button)

### 5. Projekt-Keys kopieren
1. Gehe zu "Settings" → "API"
2. Kopiere diese beiden Werte:
   - `Project URL`
   - `anon public` Key

### 6. Umgebungsvariablen setzen
Bearbeite die `.env.local` Datei:

```env
NEXT_PUBLIC_SUPABASE_URL=https://deinprojekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key-hier
```

### 7. App testen
```bash
npm run dev
```

Die App sollte jetzt unter http://localhost:3000 laufen!

## 🎯 Erste Schritte

1. **Film hinzufügen**: Nutze das Formular links
2. **Bewerten**: Klicke auf die Sterne
3. **Schauen**: Alle Filme erscheinen rechts

## 🔍 Troubleshooting

### "Cannot connect to database"
- Überprüfe die URLs in `.env.local`
- Stelle sicher, dass das Supabase-Projekt aktiv ist

### "Table does not exist"
- Führe das SQL-Schema erneut aus
- Überprüfe die Tabellen im Supabase Dashboard

### Entwicklungsserver startet nicht
```bash
npm install
npm run dev
```

## 🎉 Fertig!

Deine App ist jetzt einsatzbereit und die Daten werden persistent in Supabase gespeichert!
