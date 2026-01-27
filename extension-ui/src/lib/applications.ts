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

export async function listApplicationsByStatus(
  status: ApplicationStatus
): Promise<ApplicationRow[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ApplicationRow[];
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

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteApplication(id: string): Promise<void> {
    
    if(!id) throw new Error("Missing application id");

    const { error } = await supabase.from("applications").delete().eq("id", id);

    if(error) throw error;
    
}

export async function updateApplication(id: string, updates: { company: string; role: string; url: string | null}): Promise<void> {
    if(!id) throw new Error("Missing app. id");

    const company = updates.company.trim();
    const role = updates.role.trim();

    if(!company) throw new Error("Company required");
    if(!role) throw new Error("Role is required");

    const { error } = await supabase.from("applications").update({ company, role, url: updates.url?.trim() ? updates.url.trim() : null}).eq("id", id);

    if(error) throw error;
}
