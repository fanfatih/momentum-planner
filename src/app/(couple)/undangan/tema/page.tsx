"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeMini } from "@/components/invitation/ThemeMini";
import { ChooseSheet, useThemeRequestLink, useThemeState } from "@/components/invitation/theme-choice";
import { PageHeader } from "@/components/shell";
import { Button, buttonClass, Chip, Notice, Tag } from "@/components/ui";
import { useCurrentWedding } from "@/lib/guard";
import { THEME_TAGS, THEMES, type ThemeInfo } from "@/lib/invitation-themes";
import type { Wedding } from "@/lib/types";

function Catalog({ wedding }: { wedding: Wedding }) {
  const { existing, content, locked, current } = useThemeState(wedding);
  const [tag, setTag] = useState<string>("Semua");
  const [pick, setPick] = useState<ThemeInfo | null>(null);
  const requestLink = useThemeRequestLink(wedding, current);
  const shown = THEMES.filter((t) => tag === "Semua" || t.tags.includes(tag));

  return (
    <>
      <div className="space-y-3 px-5">
        {locked && current ? (
          <Notice>
            Tema {current.name} sudah dikunci. Untuk tema lain, pilih &ldquo;Minta tema ini&rdquo; dan admin akan membantu lewat WhatsApp.
          </Notice>
        ) : (
          <p className="m-0 text-[15px] text-ink-soft">
            Semua tema ditampilkan dengan nama dan tanggal pernikahanmu. Lihat pratinjaunya dulu, lalu pilih satu. Setelah dipilih, tema dikunci.
          </p>
        )}
        <div role="group" aria-label="Saring menurut gaya" className="flex flex-wrap gap-2">
          {["Semua", ...THEME_TAGS].map((t) => (
            <Chip key={t} selected={tag === t} onClick={() => setTag(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <ul className="m-0 mt-5 grid list-none grid-cols-2 gap-x-3 gap-y-6 p-0 px-5">
        {shown.map((t) => {
          const isCurrent = current?.id === t.id;
          return (
            <li key={t.id} className="min-w-0" data-theme-id={t.id}>
              <ThemeMini theme={t.id} content={content} width={158} />
              <div className="mt-2 flex flex-wrap items-center gap-x-2">
                <h2 className="m-0 text-[17px]">{t.name}</h2>
                {isCurrent && <Tag tone="leaf">{locked ? "Terkunci" : "Terpasang"}</Tag>}
              </div>
              <p className="m-0 mt-0.5 text-[13px] text-ink-soft">{t.tags.join(", ")}</p>
              <div className="mt-2 flex flex-col gap-2">
                <Link href={`/pratinjau-undangan?tema=${t.id}`} className={buttonClass("secondary")}>
                  Pratinjau
                </Link>
                {locked ? (
                  !isCurrent && (
                    <a href={requestLink(t)} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost")}>
                      Minta tema ini
                    </a>
                  )
                ) : (
                  <Button onClick={() => setPick(t)}>{isCurrent ? "Kunci tema ini" : "Pilih tema ini"}</Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="m-0 px-5 pt-8 text-center text-[14px] text-ink-soft">Tema baru ditambahkan berkala.</p>

      <ChooseSheet open={!!pick} onClose={() => setPick(null)} theme={pick} wedding={wedding} existing={existing} onDone={() => setPick(null)} />
    </>
  );
}

export default function TemaPage() {
  const wedding = useCurrentWedding();
  if (!wedding) return null;
  return (
    <>
      <PageHeader
        title="Tema undangan"
        action={
          <Link href="/undangan" className={buttonClass("ghost")}>
            Kembali
          </Link>
        }
      />
      {wedding.plan === "premium" ? (
        <Catalog wedding={wedding} />
      ) : (
        <p className="m-0 px-5 text-[15px] text-ink-soft">Katalog tema terbuka untuk paket premium. Buka menu Undangan untuk tanya paketnya.</p>
      )}
    </>
  );
}
