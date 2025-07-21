import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from '@/lib/UserContext';

// Supabase-Client initialisieren (direkt mit URL und Anon-Key)
const supabase = createClient(
  "https://wntarfmnxzsmtpsqvspw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudGFyZm1ueHpzbXRwc3F2c3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTQ1MTMsImV4cCI6MjA2ODQzMDUxM30.Llj1QeN40RHfazeFZlElKLXdjEj6OaR13a3sZcZ5Dmw"
);

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else if (data.user) {
        // Hole Alias aus user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('alias')
          .eq('user_id', data.user.id)
          .single();
        setUser({
          id: data.user.id,
          name: profile?.alias || data.user.email || '',
          created_at: data.user.created_at || ''
        });
      }
    } else {
      // Alias prüfen (case-insensitive)
      const { data: aliasExists } = await supabase
        .from('user_profiles')
        .select('alias')
        .ilike('alias', alias.trim().toLowerCase());
      if (aliasExists && aliasExists.length > 0) {
        setError('Alias ist bereits vergeben.');
        setLoading(false);
        return;
      }
      // Registrierung
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else if (data.user) {
        // Alias speichern
        const { error: aliasError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            alias: alias.trim().toLowerCase()
          });
        if (aliasError) {
          setError('Fehler beim Speichern des Alias.');
        } else {
          setUser({
            id: data.user.id,
            name: alias.trim().toLowerCase(),
            created_at: data.user.created_at || ''
          });
        }
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (user) {
    // Wenn eingeloggt, nichts anzeigen (AppContent übernimmt die Anzeige)
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-bold">
        {mode === "login" ? "Login" : "Registrieren"}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-xs">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Alias (wird öffentlich angezeigt)"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            className="border rounded p-2"
            required
            minLength={3}
            maxLength={32}
            autoComplete="off"
          />
        )}
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded p-2"
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded p-2"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Bitte warten..." : mode === "login" ? "Login" : "Registrieren"}
        </button>
        <button
          type="button"
          className="text-blue-500 underline text-xs mt-1"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login"
            ? "Noch kein Account? Jetzt registrieren"
            : "Schon registriert? Zum Login"}
        </button>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </form>
    </div>
  );
}
