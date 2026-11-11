import "server-only";
import { REMOTE, SUPABASE_KEY, SUPABASE_URL } from "./mode";
import { emptyInvitationContent } from "./invitation";
import type { InvitationContent } from "./types";

export interface PublicInvitation {
  slug: string;
  theme: string;
  content: InvitationContent;
}

/** Baca undangan yang sudah diaktifkan lewat fungsi publik di database. Null kalau tidak ada atau belum aktif. */
export async function getPublicInvitation(slug: string): Promise<PublicInvitation | null> {
  if (!REMOTE || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_invitation`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: slug }),
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { slug: string; theme: string; content: Partial<InvitationContent> } | null;
    if (!data) return null;
    return { slug: data.slug, theme: data.theme, content: { ...emptyInvitationContent(), ...data.content } };
  } catch {
    return null;
  }
}
