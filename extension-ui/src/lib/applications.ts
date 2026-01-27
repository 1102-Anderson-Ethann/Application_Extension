import { supabase } from "./supabaseClient";

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type ApplicationRow = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  url: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

export async function listApplications() {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ApplicationRow[];
}

export async function createApplication(input: {
  company: string;
  role: string;
  url?: string;
  status?: ApplicationStatus;
}) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in");

  const { error } = await supabase.from("applications").insert({
    user_id: userId,
    company: input.company.trim(),
    role: input.role.trim(),
    url: input.url?.trim() || null,
    status: input.status ?? "pending",
  });

  if (error) throw error;
}
