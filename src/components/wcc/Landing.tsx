"use client";

import { useEffect, useState } from "react";
import { formatRp } from "@/lib/format";
import { wccPublic, type WccPublic } from "@/lib/wcc";
import { Booker } from "./Booker";

const sec = "mx-auto w-full max-w-[1080px] px-4 py-14 sm:px-6 sm:py-20";
const eyebrowless = "m-0 text-[clamp(28px,4.5vw,42px)]";

const STEPS = [
  ["Pilih paket dan tanggal", "Lihat jam yang masih kosong, lalu pilih add-on kalau perlu."],
  ["Kirim lewat WhatsApp", "Pesananmu sudah tertulis rapi, tinggal kirim."],
  ["Bayar DP 30%", "Setelah admin membalas, tanggal dan jammu terkunci."],
  ["Kami hadir dan meliput", "Hasil dikirim lewat Google Drive maksimal H+3."],
];

export function Landing() {
  const [data, setData] = useState<WccPublic | null>(null);
  useEffect(() => {
    void wccPublic().then(setData);
  }, []);

  if (!data) return <main className="grid min-h-dvh place-items-center bg-cream text-ink-soft">Memuat halaman…</main>;
  const { settings: s, packages, addons, portfolio, team, wa } = data;
  const waLink = wa ? `https://wa.me/${wa}` : "#booking";

  return (
    <div className="bg-cream text-ink">
      <a href="#booking" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-paper focus:p-3">
        Langsung ke booking
      </a>
      {s.promo_enabled && s.promo_text && (
        <p className="m-0 bg-[#fff2a0] px-4 py-2.5 text-center text-[14px] font-medium text-[#4a3b00]" role="note">
          {s.promo_text}
        </p>
      )}
      <header className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="m-0 font-[family-name:var(--font-serif)] text-[19px] font-semibold">
          Momentum <span className="text-[var(--brand)]">WCC</span>
        </p>
        <nav aria-label="Menu halaman" className="hidden gap-1 sm:flex">
          {[
            ["#paket", "Paket"],
            portfolio.length ? ["#portofolio", "Portofolio"] : null,
            ["#booking", "Booking"],
            team.length ? ["#tim", "Tim"] : null,
            ["#faq", "Tanya jawab"],
          ]
            .filter((x): x is string[] => !!x)
            .map(([h, l]) => (
              <a key={h} href={h} className="inline-flex min-h-11 items-center rounded-full px-3 text-[15px] hover:bg-cream-deep">
                {l}
              </a>
            ))}
        </nav>
        <a href="#booking" className="inline-flex min-h-11 items-center rounded-full bg-[var(--brand)] px-4 text-[15px] font-semibold text-white">
          Cek jadwal
        </a>
      </header>

      <main>
        <section className={`${sec} grid items-center gap-10 !pt-10 md:grid-cols-[1.1fr_0.9fr]`}>
          <div>
            <h1 className="m-0 text-[clamp(38px,7vw,68px)] leading-[1.02]">{s.tagline}</h1>
            <p className="mb-0 mt-5 max-w-[46ch] text-[18px] text-ink-soft">
              Wedding content creator di Bogor. Kami meliput acaramu jadi story real-time, reels, dan highlight yang siap kamu bagikan, mulai {packages[0] ? formatRp(packages[0].price) : "250 ribu"}.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#booking" className="inline-flex min-h-12 items-center rounded-full bg-[var(--brand)] px-6 font-semibold text-white">
                Pilih tanggal acaramu
              </a>
              <a href="#paket" className="inline-flex min-h-12 items-center rounded-full border-2 border-[var(--ink)] px-6 font-semibold">
                Lihat paket
              </a>
            </div>
          </div>
          <div aria-hidden={portfolio.length === 0} className="flex items-end justify-center gap-3">
            {portfolio.length > 0 ? (
              portfolio.slice(0, 3).map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f.id} src={f.thumb_url} alt="" className={`aspect-[9/16] w-[30%] rounded-[16px] border border-line object-cover ${i === 1 ? "-translate-y-6" : ""}`} />
              ))
            ) : (
              <div className="grid aspect-[4/5] w-full place-items-center rounded-[24px] bg-[#7d9c65] p-8 text-center font-[family-name:var(--font-serif)] text-[26px] text-white">
                Setiap momen layak punya ceritanya
              </div>
            )}
          </div>
        </section>

        {portfolio.length > 0 && (
          <section id="portofolio" className={sec} aria-labelledby="h-porto">
            <h2 id="h-porto" className={eyebrowless}>
              Hasil kerja kami
            </h2>
            <p className="mb-6 mt-2 text-ink-soft">Ketuk untuk menonton reels di Instagram.</p>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 md:grid-cols-4">
              {portfolio.map((f) => (
                <li key={f.id}>
                  <a href={f.link_url} target="_blank" rel="noopener noreferrer" className="group block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.thumb_url} alt={f.title ? `Thumbnail reels ${f.title}` : "Thumbnail reels Instagram"} loading="lazy" className="aspect-[9/16] w-full rounded-[14px] border border-line object-cover" />
                    <span className="mt-2 block text-[14px] font-medium underline-offset-4 group-hover:underline">
                      {f.title || "Tonton di Instagram"}
                      <span className="sr-only"> (buka di tab baru)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="paket" className={sec} aria-labelledby="h-paket">
          <h2 id="h-paket" className={eyebrowless}>
            Paket dan harga
          </h2>
          <p className="mb-8 mt-2 text-ink-soft">Semua paket memakai mic dan lighting, hasil dikirim lewat Google Drive.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {packages.map((p) => (
              <article key={p.id} className={`flex flex-col rounded-[20px] border-2 bg-paper p-5 ${p.highlight ? "border-[var(--brand)]" : "border-line"}`}>
                {p.highlight && <p className="m-0 mb-2 w-fit rounded-full bg-brand-tint px-3 py-0.5 text-[13px] font-semibold text-brand-deep">Paling banyak dipilih</p>}
                <h3 className="m-0 text-[24px]">{p.name}</h3>
                <p className="m-0 text-ink-soft">{p.hours} jam liputan</p>
                <p className="m-0 my-3 font-[family-name:var(--font-serif)] text-[32px] font-semibold">{formatRp(p.price)}</p>
                <ul className="m-0 flex-1 list-none space-y-1.5 p-0 text-[15px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden="true" className="text-[#5f7f48]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#booking" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[var(--ink)] font-semibold">
                  Pilih {p.name}
                </a>
              </article>
            ))}
          </div>
          {addons.length > 0 && (
            <div className="mt-10">
              <h3 className="m-0 text-[22px]">Add-on</h3>
              <ul className="m-0 mt-3 grid list-none gap-x-8 p-0 sm:grid-cols-2">
                {addons.map((a) => (
                  <li key={a.id} className="flex justify-between gap-4 border-b border-line py-2.5">
                    <span>
                      {a.name}
                      {a.note && <span className="block text-[13px] text-ink-soft">{a.note}</span>}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatRp(a.price)}
                      {a.unit === "per_jam" ? "/jam" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section id="booking" className={`${sec} scroll-mt-4`} aria-labelledby="h-book">
          <h2 id="h-book" className={eyebrowless}>
            Booking
          </h2>
          <p className="mb-8 mt-2 max-w-[60ch] text-ink-soft">Cek tanggal dan jam yang masih kosong, susun pesananmu, lalu kirim ke WhatsApp kami.</p>
          <Booker data={data} />
        </section>

        <section className={`${sec} !py-10`} aria-labelledby="h-cara">
          <h2 id="h-cara" className={eyebrowless}>
            Alurnya
          </h2>
          <ol className="m-0 mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 md:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="rounded-[16px] bg-[#e3edd9] p-4">
                <span className="font-[family-name:var(--font-serif)] text-[28px] font-semibold text-[#3d5a2b]">{i + 1}</span>
                <p className="m-0 font-semibold">{t}</p>
                <p className="m-0 text-[14px] text-[#2c4520]">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {s.free_enabled && (
          <section className={sec} aria-labelledby="h-free">
            <div className="rounded-[24px] bg-[var(--brand)] p-6 text-white sm:p-10">
              <h2 id="h-free" className="m-0 text-[clamp(28px,4.5vw,42px)] text-white">
                Free WCC bulanan
              </h2>
              <p className="mb-5 mt-2 max-w-[56ch] text-[17px]">{s.free_text}</p>
              <ul className="m-0 list-disc space-y-1.5 pl-5">
                {s.free_rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <a href={s.ig_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-[var(--brand-deep)]">
                Ikuti di Instagram
              </a>
            </div>
          </section>
        )}

        {team.length > 0 && (
          <section id="tim" className={sec} aria-labelledby="h-tim">
            <h2 id="h-tim" className={eyebrowless}>
              Tim kami
            </h2>
            <ul className="m-0 mt-6 grid list-none gap-5 p-0 sm:grid-cols-2 md:grid-cols-3">
              {team.map((m) => (
                <li key={m.id} className="flex gap-4">
                  {m.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo_url} alt={`Foto ${m.name}`} loading="lazy" className="size-24 shrink-0 rounded-[16px] border border-line object-cover" />
                  ) : (
                    <span aria-hidden="true" className="grid size-24 shrink-0 place-items-center rounded-[16px] bg-[#e3edd9] font-[family-name:var(--font-serif)] text-[32px] text-[#3d5a2b]">
                      {m.name[0]}
                    </span>
                  )}
                  <div>
                    <p className="m-0 font-semibold">{m.name}</p>
                    <p className="m-0 text-[14px] text-brand-deep">{m.role}</p>
                    <p className="m-0 mt-1 text-[14px] text-ink-soft">{m.bio}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="faq" className={sec} aria-labelledby="h-faq">
          <h2 id="h-faq" className={eyebrowless}>
            Syarat dan tanya jawab
          </h2>
          <div className="mt-6 grid gap-10 md:grid-cols-2">
            <ul className="m-0 list-disc space-y-2 pl-5">
              {s.terms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div>
              {s.faq.map((f) => (
                <details key={f.q} className="border-b border-line py-1">
                  <summary className="flex min-h-11 items-center font-semibold">{f.q}</summary>
                  <p className="m-0 pb-3 text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-cream-deep">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-6">
          <p className="m-0 font-[family-name:var(--font-serif)] text-[18px] font-semibold">Momentum by Luna</p>
          <p className="m-0 flex gap-2 text-[15px]">
            <a href={s.ig_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">
              Instagram
            </a>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">
              WhatsApp
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
