import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { loadSessionFromStorage, loginWithGoogle, logout } from "../lib/auth";

export default function Popup() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshUser() {
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? null);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        await loadSessionFromStorage();
        await refreshUser();
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleLogin() {
    try {
      setError(null);
      await loginWithGoogle();
      await refreshUser();
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    }
  }

  async function handleLogout() {
    try {
      setError(null);
      await logout();
      setEmail(null);
    } catch (e: any) {
      setError(e?.message ?? "Logout failed");
    }
  }

  return (
    <div style={{ width: 320, padding: 12, fontFamily: "system-ui" }}>
      <h2>Application Tracker</h2>

      {loading && <p>Loading...</p>}

      {error && (
        <p style={{ color: "crimson" }}>
          <strong>Error:</strong> {error}
        </p>
      )}

      {!loading && (
        <>
          {email ? (
            <>
              <p>Signed in as:</p>
              <p><strong>{email}</strong></p>
              <button onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <button onClick={handleLogin}>Sign in with Google</button>
          )}
        </>
      )}
    </div>
  );
}
