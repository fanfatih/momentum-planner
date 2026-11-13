"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeMini } from "@/components/invitation/ThemeMini";
import { Price } from "@/components/wcc/Price";
import { THEMES } from "@/lib/invitation-themes";
import { interestLink, invPlansPublic, type InvPlansPublic } from "@/lib/inv-plans";
import { sampleInvitation } from "@/lib/sample-invitation";

const sample = sampleInvitation();
const pill = "inline-flex min-h-11 items-center justify-center rounded-full px-5 font-semibold";

export function Catalog() {
  const [data, setData] = useState<InvPlansPublic | null>(null);
  useEffect(() => {
    void invPlansPublic().then(setData);
  }, []);
  const plan = (id: string) => data?.plans.find((p) => p.id === id);
  const standar = plan("standar");
  const eksklusif = plan("eksklusif");
  const link = (themeName: string | null, p = standar) => (data ? interestLink(data.wa, themeName, p) : "");

  return (
    <div className="min-h-dvh bg-cream text-ink">
      <header className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="m-0 font-[family-name:var(--font-serif)] text-[19px] font-semibold">
          Momentum <span className="text-[var(--brand)]">Undangan</span>
        </p>
        <Link href="/masuk" className={`${pill} border-2 border-[var(--ink)]`}>
          Masuk
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[1080px] px-4 pb-16 sm:px-6">
        <section className="py-10 sm:py-14">
          <h1 className="m-0 max-w-[16ch] text-[clamp(36px,6.5vw,60px)] leading-[1.04]">Undangan digital yang siap dibagikan hari ini.</h1>
          <p className="mb-0 mt-5 max-w-[50ch] text-[18px] text-ink-soft">
            Lihat dulu tampilannya, pilih satu tema, lalu isi sendiri. Kirim ke tamu lewat WhatsApp dan kumpulkan RSVP di satu tempat.
          </p>
        </section>

        <section aria-labelledby="h-paket" className="py-6">
          <h2 id="h-paket" className="m-0 text-[clamp(26px,4vw,36px)]">
            Pilih paket
          </h2>
          {!data ? (
            <p className="text-ink-soft">Memuat harga…</p>
          ) : data.plans.length === 0 ? (
            <p className="text-ink-soft">Harga sedang diperbarui. Hubungi kami lewat WhatsApp.</p>
          ) : (
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
              {data.plans.map((p) => (
                <article key={p.id} className="flex flex-col rounded-[20px] border-2 border-line bg-paper p-5">
                  <h3 className="m-0 text-[24px]">{p.name}</h3>
                  <p className="m-0 mt-1 text-ink-soft">{p.blurb}</p>
                  <p className="m-0 my-3 font-[family-name:var(--font-serif)] text-[30px] font-semibold leading-tight">
                    <Price price={p.price} old={p.old_price} />
                  </p>
                  <ul className="m-0 flex-1 list-none space-y-1.5 p-0 text-[15px]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span aria-hidden="true" className="text-[#5f7f48]">
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="h-standar" className="py-10">
          <h2 id="h-standar" className="m-0 text-[clamp(26px,4vw,36px)]">
            Tema Standar
          </h2>
          <p className="mb-6 mt-2 text-ink-soft">Ketuk Pratinjau untuk membuka undangan lengkap dengan contoh isi.</p>
          <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 sm:grid-cols-3 md:grid-cols-4">
            {THEMES.filter((t) => t.tier === "standar").map((t) => (
              <li key={t.id} className="min-w-0" data-theme-id={t.id}>
                <ThemeMini theme={t.id} content={sample} width={190} />
                <h3 className="m-0 mt-3 text-[18px]">{t.name}</h3>
                <p className="m-0 text-[13px] text-ink-soft">{t.tags.join(", ")}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <Link href={`/katalog/${t.id}`} className={`${pill} border-2 border-[var(--ink)]`}>
                    Pratinjau {t.name}
                  </Link>
                  {link(t.name) ? (
                    <a href={link(t.name)} target="_blank" rel="noopener noreferrer" className={`${pill} bg-[var(--brand)] text-white`}>
                      Tertarik
                      <span className="sr-only"> dengan tema {t.name} (buka WhatsApp)</span>
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="h-eks" className="rounded-[24px] bg-[#e3edd9] p-6 sm:p-10">
          <h2 id="h-eks" className="m-0 text-[clamp(26px,4vw,36px)]">
            Tema Eksklusif
          </h2>
          {THEMES.some((t) => t.tier === "eksklusif") ? null : (
            <p className="mb-5 mt-2 max-w-[56ch] text-[#2c4520]">
              Tema eksklusif pertama sedang disiapkan. {eksklusif ? `Harga paketnya mulai ${eksklusif.price.toLocaleString("id-ID")} rupiah.` : ""} Kabari kami kalau ingin jadi yang pertama tahu.
            </p>
          )}
          {data && interestLink(data.wa, null, eksklusif, "Kabari aku kalau tema eksklusif sudah rilis.") && (
            <a href={interestLink(data.wa, null, eksklusif, "Kabari aku kalau tema eksklusif sudah rilis.")} target="_blank" rel="noopener noreferrer" className={`${pill} bg-[var(--ink)] text-white`}>
              Kabari saya lewat WhatsApp
            </a>
          )}
        </section>
      </main>

      <footer className="border-t border-line bg-cream-deep">
        <p className="mx-auto m-0 max-w-[1080px] px-4 py-6 text-[14px] text-ink-soft sm:px-6">Momentum by Luna. Pembayaran awal dikonfirmasi lewat WhatsApp.</p>
      </footer>
    </div>
  );
}
