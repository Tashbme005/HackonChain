import { getSupabase, isSupabaseConfigured } from "./client";
import type { UserRole } from "./database.types";

export type AuthProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletAddress: string | null;
  location: string | null;
  isDemo: boolean;
  entityId?: string;
  createdAt: string;
};

const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string }> = {
  donor: { email: "demo.donor@openimpact.app", password: "demo-demo" },
  recipient: { email: "demo.recipient@openimpact.app", password: "demo-demo" },
  organisation: { email: "demo.org@openimpact.app", password: "demo-demo" },
};

export { DEMO_CREDENTIALS };

type ProfileRow = {
  id: string;
  role: UserRole;
  name: string;
  wallet_address: string | null;
  location: string | null;
  is_demo: boolean;
  created_at: string;
};

async function loadProfile(userId: string, email: string): Promise<AuthProfile | null> {
  const sb = getSupabase();
  const { data: profile, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) return null;
  const row = profile as ProfileRow;

  let entityId: string | undefined;
  if (row.role === "recipient") {
    const { data } = await sb
      .from("recipients")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    entityId = (data as { id: string } | null)?.id;
  } else if (row.role === "organisation") {
    const { data } = await sb
      .from("organisations")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    entityId = (data as { id: string } | null)?.id;
  }

  return {
    id: row.id,
    email,
    name: row.name,
    role: row.role,
    walletAddress: row.wallet_address,
    location: row.location,
    isDemo: row.is_demo,
    entityId,
    createdAt: row.created_at,
  };
}

export async function getSessionProfile(): Promise<AuthProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  const session = data.session;
  if (!session?.user) return null;
  return loadProfile(session.user.id, session.user.email ?? "");
}

export function onAuthChange(cb: (profile: AuthProfile | null) => void) {
  if (!isSupabaseConfigured()) return () => {};
  const sb = getSupabase();
  const { data } = sb.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      cb(null);
      return;
    }
    const profile = await loadProfile(session.user.id, session.user.email ?? "");
    cb(profile);
  });
  return () => data.subscription.unsubscribe();
}

export async function signUpWithSupabase(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  inviteCode?: string;
  orgId?: string;
}): Promise<{ ok: true; profile: AuthProfile } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const sb = getSupabase();
  const email = input.email.trim().toLowerCase();

  const { data, error } = await sb.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { role: input.role, name: input.name.trim() },
    },
  });

  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "Sign-up failed — no user returned." };

  const { error: rpcError } = await sb.rpc("complete_signup", {
    p_role: input.role,
    p_name: input.name.trim(),
    p_invite_code: input.inviteCode ?? null,
    p_org_id: input.orgId ?? null,
  });

  if (rpcError) {
    return { ok: false, error: rpcError.message };
  }

  const profile = await loadProfile(data.user.id, email);
  if (!profile) {
    return { ok: false, error: "Account created but profile could not be loaded." };
  }
  return { ok: true, profile };
}

export async function signInWithSupabase(
  email: string,
  password: string,
): Promise<{ ok: true; profile: AuthProfile } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "Sign-in failed." };

  const profile = await loadProfile(data.user.id, data.user.email ?? email);
  if (!profile) {
    return {
      ok: false,
      error: "Signed in, but no profile row exists yet. Complete signup first.",
    };
  }
  return { ok: true, profile };
}

export async function signInDemoWithSupabase(
  role: UserRole,
): Promise<{ ok: true; profile: AuthProfile } | { ok: false; error: string }> {
  const creds = DEMO_CREDENTIALS[role];
  return signInWithSupabase(creds.email, creds.password);
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured()) return;
  await getSupabase().auth.signOut();
}
