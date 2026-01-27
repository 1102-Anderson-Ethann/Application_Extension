import { supabase } from "./supabaseClient";

type StoredSession = {
  access_token: string;
  refresh_token: string;
};

const STORAGE_KEY = "supabase_session";

export async function loginWithGoogle(): Promise<void> {
  const redirectTo = chrome.identity.getRedirectURL();
  console.log("Redirect URL:", chrome.identity.getRedirectURL());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Supabase did not return an OAuth URL.");

  const finalUrl = await chrome.identity.launchWebAuthFlow({
    url: data.url,
    interactive: true,
  });

  // TypeScript + real life: user can cancel → undefined.
  if (!finalUrl) {
    throw new Error("OAuth was cancelled or failed.");
  }

  const url = new URL(finalUrl);

  // Supabase often returns tokens in the URL hash (#access_token=...)
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");

  if (!access_token || !refresh_token) {
    throw new Error("Missing tokens in OAuth redirect.");
  }

  const session: StoredSession = { access_token, refresh_token };

  await chrome.storage.local.set({ [STORAGE_KEY]: session });

  // Optional but nice: set session immediately so current popup updates without reload
  await supabase.auth.setSession(session);
}

export async function logout(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
  // This only clears in-memory client state since we disabled persistSession.
  await supabase.auth.signOut();
}

export async function loadSessionFromStorage(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const session = result[STORAGE_KEY] as StoredSession | undefined;

  if (!session?.access_token || !session?.refresh_token) return;

  await supabase.auth.setSession(session);
}
