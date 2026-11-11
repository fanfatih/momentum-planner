"use client";

import Link from "next/link";
import { InvitationView } from "@/components/invitation/InvitationView";
import { buttonClass, LoadingState } from "@/components/ui";
import { useCurrentWedding } from "@/lib/guard";
import { useApp, useMeta } from "@/lib/store";

export default function PratinjauPage() {
  const { hydrated } = useMeta();
  const wedding = useCurrentWedding();
  const invitations = useApp((s) => s.invitations);
  const inv = wedding ? invitations.find((i) => i.weddingId === wedding.id) : undefined;

  if (!hydrated) return <LoadingState what="pratinjau undangan" />;
  if (!wedding || !inv) {
    return (
      <main className="phone-frame px-5 pt-24 text-center">
        <h1 className="text-[28px]">Belum ada undangan untuk dipratinjau</h1>
        <p className="mt-2 text-[15px] text-ink-soft">Simpan isi undangan dulu, lalu buka pratinjau lagi.</p>
        <Link href="/undangan" className={`${buttonClass("primary")} mt-5`}>
          Ke editor undangan
        </Link>
      </main>
    );
  }
  return (
    <>
      <div className="phone-frame px-5 pt-3">
        <Link href="/undangan" className={buttonClass("secondary")}>
          Kembali ke editor
        </Link>
      </div>
      <InvitationView content={inv.content} slug={inv.slug} theme={inv.theme} guestName="Nama Tamu" preview />
    </>
  );
}
