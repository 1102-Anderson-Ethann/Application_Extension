import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { loadSessionFromStorage, loginWithGoogle, logout } from "../lib/auth";
import { createApplication, listApplications, type ApplicationRow } from "../lib/applications";

export default function Popup() {
  const [email, setEmail] = useState<string | null>(null);

  //State
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");

  //Data State
  const [apps, setApps] = useState<ApplicationRow[]>([]);

  //UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshUser() {
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? null);
  }

  async function refreshApplication(){
    const rows = await listApplications();
    setApps(rows);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        await loadSessionFromStorage();
        await refreshUser();

        const { data } = await supabase.auth.getUser();
        if(data.user){
            await refreshApplication();
        }
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
      await refreshApplication();
    } catch (e: any) {
      setError(e?.message ?? "Login failed");
    }
  }

  async function handleLogout() {
    try {
      setError(null);
      await logout();
      setEmail(null);
      setApps([]);
    } catch (e: any) {
      setError(e?.message ?? "Logout failed");
    }
  }

  async function handleAdd(e: React.FormEvent) {{
    e.preventDefault();

    try{
        setSaving(true);
        setError(null);

        await createApplication({ company, role, url, status: "pending"});

        setCompany("");
        setRole("");
        setUrl("");

        await refreshApplication();
    } catch (e: any){
        setError(e?.message ?? "Failed to add application");
    }finally{
        setSaving(false);
    }
  } 
    
  }

  return (
    <div style={{ width: 360, padding: 12, fontFamily: "system-ui" }}>
      <h2 style={{ margin: "0 0 8px" }}>Application Tracker</h2>

      {loading && <p>Loading...</p>}

      {error && (
        <p style={{ color: "crimson", marginTop: 8 }}>
          <strong>Error:</strong> {error}
        </p>
      )}

      {!loading && !email && (
        <button onClick={handleLogin} style={{ marginTop: 8 }}>
          Sign in with Google
        </button>
      )}

      {!loading && email && (
        <>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Signed in as</div>
            <div style={{ fontWeight: 600 }}>{email}</div>
            <button onClick={handleLogout} style={{ marginTop: 8 }}>
              Sign out
            </button>
          </div>

          <hr style={{ margin: "12px 0" }} />

          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gap: 8 }}>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (required)"
              />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Role (required)"
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Job URL (optional)"
              />

              <button type="submit" disabled={saving}>
                {saving ? "Adding..." : "Add application"}
              </button>
            </div>
          </form>

          <hr style={{ margin: "12px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Pending</h3>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{apps.length}</div>
          </div>

          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {apps.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                No applications yet. Add your first one 👆
              </div>
            ) : (
              apps.map((a) => (
                <div
                  key={a.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{a.company}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{a.role}</div>
                  {a.url ? (
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      <a href={a.url} target="_blank" rel="noreferrer">
                        job link
                      </a>
                    </div>
                  ) : null}
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                    status: {a.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
