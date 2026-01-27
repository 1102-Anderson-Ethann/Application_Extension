import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { loadSessionFromStorage, loginWithGoogle, logout } from "../lib/auth";
import { 
    createApplication, 
    //listApplications, 
    listApplicationsByStatus, 
    updateApplicationStatus,
    deleteApplication,
    updateApplication,
    type ApplicationRow,
    type ApplicationStatus,
} from "../lib/applications";

export default function Popup() {
  const [email, setEmail] = useState<string | null>(null);

  //State
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [url, setUrl] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>("Pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editingSaving, setEditingSaving] = useState(false);
  const [search, setSearch] = useState("");


  //Data State
  const [apps, setApps] = useState<ApplicationRow[]>([]);

  //UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //styling
  const styles = {
    input: {
        width: "100%",
        padding: "8px",
        borderRadius: 8,
        border: "1px solid #ddd",
        fontSize: 14,
    } as React.CSSProperties,
    button: {
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        fontSize: 13, 
        
    }as React.CSSProperties,
    buttonActive: {
        background: "#65676b",
        color: "#fff",
        borderColor: "#000000",
    } as React.CSSProperties,
  };

  async function refreshUser() {
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? null);
  }

  async function refreshApplication(status = selectedStatus){
    const rows = await listApplicationsByStatus(status);
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
            await refreshApplication("Pending");
        }
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  //Helpers

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

        await createApplication({ company, role, url, status: "Pending"});

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

  function startEditing(app: ApplicationRow){
    setEditingId(app.id);
    setEditCompany(app.company);
    setEditRole(app.role);
    setEditUrl(app.url ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditCompany("");
    setEditRole("");
    setEditUrl("");
  }

  async function saveEdit() {
    if(!editingId) return;

    try{
        setEditingSaving(true);
        setError(null);

        await updateApplication(editingId, {company: editCompany, role: editRole, url: editUrl.trim() ? editUrl.trim() : null});

        cancelEditing();
        await refreshApplication(selectedStatus);
    }catch(e: any){
        setError(e?.message ?? "Failed to save chnages");
    }finally{
        setEditingSaving(false);
    }
  }

  async function handleAutoFillFromTab() {
    try{
        setError(null);

        const [tab] = await chrome.tabs.query({active:true, currentWindow: true});
        if(!tab) throw new Error("No active tab found");

        //URL
        const tabURL = tab.url ?? "";
        if(tabURL) setUrl(tabURL);

        //guess company 
        if(tabURL) {
            const hostname = new URL(tabURL).hostname.replace(/^www\./, "");
            const parts = hostname.split(".");

            const companyGuess = parts.length >= 2 ? parts[parts.length - 2] : hostname;
            if(companyGuess) setCompany(capitalize(companyGuess));
        }

        //Guess role
        const title = tab.title ?? "";
        if(title){
            const roleGuess = title.split(" | ")[0].split(" - ")[0].trim();
            if(roleGuess) setRole(roleGuess);
        }
    }catch(e: any){
        setError(e?.message ??  "Failed to autofill")
    }
    
  }

  function capitalize(s: string){
    if(!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }


  //UI 

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
        <button 
            onClick={handleLogin} 
            className="btn"
            >
          Sign in with Google
        </button>
      )}

      {!loading && email && (
        <>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Signed in as</div>
            <div style={{ fontWeight: 600 }}>{email}</div>
            <button onClick={handleLogout} className="btn">
              Sign out
            </button>
          </div>

          <hr style={{ margin: "12px 0" }} />

          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gap: 8 }}>
              <input
                style={styles.input}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (required)"
              />
              <input
                style={styles.input}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Role (required)"
              />
              <input
                style={styles.input}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Job URL (optional)"
              />

              <button 
                className="btn"
                type="button"
                onClick={handleAutoFillFromTab}
                >
                    Autofill with current page
                </button>

              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Adding..." : "Add application"}
              </button>
            </div>
          </form>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {(["Pending", "Accepted", "Rejected"] as const).map((s) => (
                <button
                key={s}
                onClick={async () => {
                    setSelectedStatus(s);
                    try {
                    setError(null);
                    await refreshApplication(s);
                    } catch (e: any) {
                    setError(e?.message ?? "Failed to load applications");
                    }
                }}
                className="btn"
                >
                {s}
                </button>
            ))}
            </div>


          <hr style={{ margin: "12px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>{selectedStatus}</h3>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{apps.length}</div>
          </div>
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Applications"
                style={styles.input}
            />

           
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {apps.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                No applications yet. Add your first one 👆
            </div>
            
            ) : (
        
              apps.filter((a) => {
                const q = search.trim().toLowerCase();
                if(!q) return true;

                const text = `${a.company} ${a.role} ${a.url ?? ""}`.toLowerCase();
                return text.includes(q);
              }).map((a) => (
            
                <div
                  key={a.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                {editingId === a.id ? (
                    <div style={{ display: "grid", gap: 6}}>
                        <input 
                            style={styles.input}
                            value={editCompany} 
                            onChange={(e) => setEditCompany(e.target.value)} 
                            placeholder="Company"
                        />
                        <input
                            style={styles.input}
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            placeholder="Role"
                        />
                        <input
                            style={styles.input}
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="Job URL (optional)"
                        />

                        <div style={{ display: "flex", gap: 8, marginTop: 6}}>
                            <button className="btn" type="button" onClick={cancelEditing} disabled={editingSaving}>
                                Cancel
                            </button>
                            <button className="btn" type="button" onClick={saveEdit} disabled={editingSaving}>
                                {editingSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                ) : ( 
                <>
                  <div style={{ fontWeight: 600 }}>{a.company}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{a.role}</div>
                  {a.url ? (
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      <a href={a.url} target="_blank" rel="noreferrer">
                        job link
                      </a>
                    </div>
                  ) : null}

                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    {a.status !== "Pending" && (
                        <button
                        className="btn"
                        type = "button"
                        onClick={async () => {
                            try {
                            setError(null);
                            await updateApplicationStatus(a.id, "Pending");
                            await refreshApplication(selectedStatus);
                            } catch (e: any) {
                            setError(e?.message ?? "Failed to update status");
                            }
                        }}
                        >
                        Pending
                        </button>
                    )}

                    {a.status !== "Accepted" && (
                        <button
                        className="btn"
                        type = "button"
                        onClick={async () => {
                            try {
                            setError(null);
                            await updateApplicationStatus(a.id, "Accepted");
                            await refreshApplication(selectedStatus);
                            } catch (e: any) {
                            setError(e?.message ?? "Failed to update status");
                            }
                        }}
                        >
                        Accepted
                        </button>
                    )}

                    {a.status !== "Rejected" && (
                        <button
                        className="btn"
                        type= "button"
                        onClick={async () => {
                            try {
                            setError(null);
                            await updateApplicationStatus(a.id, "Rejected");
                            await refreshApplication(selectedStatus);
                            } catch (e: any) {
                            setError(e?.message ?? "Failed to update status");
                            }
                        }}
                        >
                        Rejected
                        </button>
                    )}

                    <button className="btn" type="button" onClick={() => startEditing(a)}>
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={async () => {
                            const ok = window.confirm(`Delete this application?\n\n${a.company} — ${a.role}\n\nThis cannot be undone.`);

                            if(!ok) return;

                            try{
                                setError(null);
                                await deleteApplication(a.id);

                                await refreshApplication(selectedStatus);
                            }catch(e: any){
                                setError(e?.message ?? "Failed to delete application");
                            }
                        }}
                        className="btn"
                    >
                        Delete
                    </button>
                    </div>

                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                    status: {a.status}
                  </div>
                    </>
                )}

                </div>

                
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
