import { useState, useEffect } from "react";

// Einfache Hashfunktion für Strings (z.B. DJB2)
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Als hex-String zurückgeben (z.B. 32 Zeichen)
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export default function AuthForm() {


  const [name, setName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // user_id sofort nach Namenseingabe setzen und im LocalStorage speichern
  useEffect(() => {
    const cleanName = name.trim().toLowerCase();
    if (cleanName) {
      const key = `guest_user_id_${cleanName}`;
      let storedId = localStorage.getItem(key);
      if (!storedId) {
        storedId = hashString(cleanName);
        localStorage.setItem(key, storedId);
      }
      setUserId(storedId);
    } else {
      setUserId(null);
    }
  }, [name]);


  // Login-Button ist jetzt optional, aber bleibt für UX
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Kein weiterer Code nötig, da userId schon gesetzt wird
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-bold">Gast-Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-2 w-full max-w-xs">
        <input
          type="text"
          placeholder="Name eingeben..."
          value={name}
          onChange={e => setName(e.target.value.replace(/[^a-z0-9]/g, "").toLowerCase())}
          className="border rounded p-2"
          required
          style={{ textTransform: "lowercase" }}
          autoComplete="off"
          pattern="[a-z0-9]*"
          inputMode="lowercase"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600"
        >
          Login
        </button>
      </form>
      {userId && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-gray-600">Deine User-ID für "{name.trim().toLowerCase()}":</p>
          <code className="bg-gray-100 p-2 rounded">{userId}</code>
          <p className="text-xs text-gray-400 mt-2">Gleicher Name ergibt immer die gleiche ID – überall.</p>
        </div>
      )}
    </div>
  );
}
