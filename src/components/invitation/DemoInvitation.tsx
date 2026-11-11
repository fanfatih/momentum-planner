"use client";

import { LoadingState } from "@/components/ui";
import { useApp, useMeta } from "@/lib/store";
import { InvitationView } from "./InvitationView";

/** Mode demo: undangan dibaca dari data di perangkat ini, karena belum ada database. */
export function DemoInvitation({ slug, guestName }: { slug: string; guestName: string }) {
  const { hydrated } = useMeta();
  const inv = useApp((s) => s.invitations.find((i) => i.slug === slug && i.published));
  if (!hydrated) return <LoadingState what="undangan" />;
  if (!inv) {
    return (
      <main className="phone-frame px-5 pt-24 text-center">
        <h1 className="text-[28px]">Undangan tidak ditemukan</h1>
        <p className="mt-2 text-[15px] text-ink-soft">Link ini belum aktif atau sudah tidak berlaku.</p>
      </main>
    );
  }
  return <InvitationView content={inv.content} slug={inv.slug} guestName={guestName} />;
}
