import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase-Client initialisieren (direkt mit URL und Anon-Key)
const supabase = createClient(
  "https://wntarfmnxzsmtpsqvspw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudGFyZm1ueHpzbXRwc3F2c3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTQ1MTMsImV4cCI6MjA2ODQzMDUxM30.Llj1QeN40RHfazeFZlElKLXdjEj6OaR13a3sZcZ5Dmw"
);

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

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
      else setUser(data.user);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else setUser(data.user);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-bold">
        {user ? "Angemeldet" : mode === "login" ? "Login" : "Registrieren"}
      </h2>
      {user ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-600">E-Mail: {user.email}</p>
          <code className="bg-gray-100 p-2 rounded text-xs">
            user_id: {user.id}
          </code>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white rounded p-2 hover:bg-red-600 mt-2"
          >
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-xs">
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
      )}
    </div>
  );
}
