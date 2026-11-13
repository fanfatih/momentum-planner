"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { InvitationView } from "@/components/invitation/InvitationView";
import { ChooseSheet, useThemeRequestLink, useThemeState } from "@/components/invitation/theme-choice";
import { Button, buttonClass, LoadingState } from "@/components/ui";
import { useCurrentWedding } from "@/lib/guard";
import { THEMES } from "@/lib/invitation-themes";
import { useMeta } from "@/lib/store";

function Pratinjau() {
  const { hydrated } = useMeta();
  const wedding = useCurrentWedding();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const picked = THEMES.find((t) => t.id === params.get("tema")) ?? null;
  if (!hydrated || !wedding) return <LoadingState what="pratinjau undangan" />;
  return <Body wedding={wedding} picked={picked} open={open} setOpen={setOpen} />;
}

function Body({
  wedding,
  picked,
  open,
  setOpen,
}: {
  wedding: NonNullable<ReturnType<typeof useCurrentWedding>>;
  picked: (typeof THEMES)[number] | null;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { existing, content, locked, current } = useThemeState(wedding);
  const requestLink = useThemeRequestLink(wedding, current);
  const router = useRouter();

  if (!existing && !picked) {
    return (
      <main className="phone-frame px-5 pt-24 text-center">
        <h1 className="text-[28px]">Belum ada undangan untuk dipratinjau</h1>
        <p className="mt-2 text-[15px] text-ink-soft">Simpan isi undangan dulu, atau pilih tema dari katalog.</p>
        <Link href="/undangan" className={`${buttonClass("primary")} mt-5`}>
          Ke editor undangan
        </Link>
      </main>
    );
  }
  const theme = picked ?? current ?? THEMES[0];
  const isCurrent = current?.id === theme.id;
  const slug = existing?.slug ?? "contoh";
  return (
    <>
      <div className="sticky top-0 z-20 mx-auto flex w-full max-w-[430px] flex-wrap items-center gap-2 border-b border-line bg-cream px-4 py-3">
        <Link href={picked ? "/undangan/tema" : "/undangan"} className={buttonClass("secondary")}>
          {picked ? "Daftar tema" : "Kembali ke editor"}
        </Link>
        {picked && (
          <>
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{theme.name}</span>
            {locked ? (
              isCurrent ? (
                <span className="text-[14px] text-ink-soft">Tema terkunci</span>
              ) : (
                <a href={requestLink(theme)} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
                  Minta tema ini
                </a>
              )
            ) : (
              <Button onClick={() => setOpen(true)}>Pilih tema ini</Button>
            )}
          </>
        )}
      </div>
      <InvitationView content={content} slug={slug} theme={theme.id} guestName="Nama Tamu" preview />
      <ChooseSheet open={open} onClose={() => setOpen(false)} theme={theme} wedding={wedding} existing={existing} onDone={() => router.push("/undangan")} />
    </>
  );
}

export default function PratinjauPage() {
  return (
    <Suspense fallback={<LoadingState what="pratinjau undangan" />}>
      <Pratinjau />
    </Suspense>
  );
}
