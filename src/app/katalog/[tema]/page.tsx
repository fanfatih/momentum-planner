"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { InvitationView } from "@/components/invitation/InvitationView";
import { buttonClass } from "@/components/ui";
import { interestLink, invPlansPublic, type InvPlansPublic } from "@/lib/inv-plans";
import { THEMES } from "@/lib/invitation-themes";
import { sampleInvitation } from "@/lib/sample-invitation";

const sample = sampleInvitation();

export default function KatalogPratinjauPage() {
  const params = useParams<{ tema: string }>();
  const theme = THEMES.find((t) => t.id === params.tema);
  const [data, setData] = useState<InvPlansPublic | null>(null);
  useEffect(() => {
    void invPlansPublic().then(setData);
  }, []);

  if (!theme) {
    return (
      <main className="phone-frame px-5 pt-24 text-center">
        <h1 className="text-[28px]">Tema tidak ditemukan</h1>
        <Link href="/katalog" className={`${buttonClass("primary")} mt-5`}>
          Ke katalog
        </Link>
      </main>
    );
  }
  const href = data ? interestLink(data.wa, theme.name, data.plans.find((p) => p.id === theme.tier)) : "";
  return (
    <>
      <div className="sticky top-0 z-20 mx-auto flex w-full max-w-[430px] items-center gap-2 border-b border-line bg-cream px-4 py-3">
        <Link href="/katalog" className={buttonClass("secondary")}>
          Katalog
        </Link>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{theme.name}</span>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
            Tertarik
            <span className="sr-only"> (buka WhatsApp)</span>
          </a>
        )}
      </div>
      <InvitationView content={sample} slug="contoh" theme={theme.id} guestName="Nama Tamu" preview previewNote="Ini contoh isi. Undanganmu akan memakai nama, foto, dan acaramu sendiri." />
    </>
  );
}
