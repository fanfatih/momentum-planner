"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProfileSheet } from "@/components/couple/ProfileSheet";
import { Icon } from "@/components/icons";
import { Wordmark } from "@/components/Logo";
import { ChangeRequestSheet, ORG_NAME, PromoCardView, useOrgWa, usePromo } from "@/components/promo";
import { CheckToggle, SectionTitle } from "@/components/shell";
import { Button, buttonClass, Card, cx, IconButton, ProgressBar, Reveal, Tag } from "@/components/ui";
import { coupleLabel, daysUntil, formatDate, formatRp, formatShortDate, waLink } from "@/lib/format";
import { useCurrentWedding } from "@/lib/guard";
import { EDIT_STATUS, REQUEST_STATUS } from "@/lib/labels";
import { buildChecklist, patchRow, useApp } from "@/lib/store";
import type { OrgKey, Wedding } from "@/lib/types";

function Countdown({ wedding, onSetDate }: { wedding: Wedding; onSetDate: () => void }) {
  const days = daysUntil(wedding.akadDate);
  return (
    <section aria-label="Hitung mundur" className="px-5">
      <div className="arch-top bg-sun px-6 pb-6 pt-16 text-center text-ink">
        {days === null ? (
          <>
            <p className="font-serif text-[26px] font-semibold leading-tight">Tanggal akad belum diisi</p>
            <p className="mx-auto mt-2 max-w-[26ch] text-[15px]">Isi tanggalnya supaya hitung mundur mulai berjalan.</p>
            <Button className="mt-4" icon="calendar" onClick={onSetDate}>
              Isi tanggal akad
            </Button>
          </>
        ) : days > 0 ? (
          <>
            <motion.p
              key={days}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className="font-serif text-[92px] font-semibold leading-none tabular-nums"
            >
              {days}
            </motion.p>
            <p className="mt-1 text-lg font-semibold">hari menuju akad</p>
          </>
        ) : days === 0 ? (
          <p className="font-serif text-[40px] font-semibold leading-tight">Hari ini akad nikah</p>
        ) : (
          <>
            <p className="font-serif text-[92px] font-semibold leading-none tabular-nums">{-days}</p>
            <p className="mt-1 text-lg font-semibold">hari sejak akad</p>
          </>
        )}
      </div>
      <p className="rounded-b-[14px] bg-ink px-4 py-2.5 text-center text-sm font-medium text-cream">
        {wedding.akadDate ? formatDate(wedding.akadDate) : "Tanggal menyusul"}
        {wedding.city ? `, ${wedding.city}` : ""}
      </p>
    </section>
  );
}

function OrgPending({ org, wedding }: { org: OrgKey; wedding: Wedding }) {
  const wa = useOrgWa(org);
  const text = `Halo ${ORG_NAME[org]}, kami ${coupleLabel(wedding.brideName, wedding.groomName)} (kode ${wedding.code}) ingin melanjutkan pengajuan paket.`;
  return (
    <Card className="mx-5 p-4">
      <Tag tone="sun">Menunggu admin</Tag>
      <h3 className="mt-2 text-[19px]">Pengajuan ke {ORG_NAME[org]} sudah dicatat</h3>
      <p className="mt-1 text-[15px] text-ink-soft">
        Setelah kalian deal, admin menautkan proyek ini dan bagiannya muncul di sini.
      </p>
      <a href={waLink(wa, text)} target="_blank" rel="noopener noreferrer" className={cx(buttonClass("secondary"), "mt-3")}>
        <Icon name="chat" size={18} />
        Lanjut obrolan di WhatsApp
      </a>
    </Card>
  );
}

export default function BerandaPage() {
  const wedding = useCurrentWedding();
  const role = useApp((s) => s.session?.role);
  const templates = useApp((s) => s.templates);
  const entries = useApp((s) => s.checklist);
  const budget = useApp((s) => s.budget);
  const guests = useApp((s) => s.guests);
  const weddingVendors = useApp((s) => s.weddingVendors);
  const allRequests = useApp((s) => s.requests);
  const promo = usePromo("beranda", wedding);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changeFor, setChangeFor] = useState<{ org: OrgKey; section: string } | null>(null);

  const rows = useMemo(
    () => (wedding ? buildChecklist(templates, entries, wedding.id, wedding.track).filter((r) => !r.hidden) : []),
    [templates, entries, wedding],
  );

  if (!wedding) return null;

  const done = rows.filter((r) => r.done).length;
  const nextRows = [
    ...rows.filter((r) => !r.done && r.kind === "administrasi").slice(0, 1),
    ...rows.filter((r) => !r.done && r.kind === "acara").slice(0, 2),
  ];

  const myBudget = budget.filter((b) => b.weddingId === wedding.id);
  const paid = myBudget.reduce((n, b) => n + b.paid, 0);
  const actual = myBudget.reduce((n, b) => n + b.actual, 0);
  const planned = myBudget.reduce((n, b) => n + b.planned, 0);
  const myGuests = guests.filter((g) => g.weddingId === wedding.id);
  const people = myGuests.reduce((n, g) => n + g.count, 0);
  const myVendors = weddingVendors.filter((v) => v.weddingId === wedding.id);
  const deals = myVendors.filter((v) => v.status === "deal").length;
  const requests = allRequests.filter((r) => r.weddingId === wedding.id);
  const myName = role === "groom" ? wedding.groomName : wedding.brideName;

  const summary = [
    {
      href: "/budget",
      label: "Budget",
      value: myBudget.length
        ? `${formatRp(paid)} dibayar dari ${formatRp(actual || planned)}`
        : "Belum ada pos budget",
    },
    {
      href: "/tamu",
      label: "Tamu",
      value: myGuests.length ? `${people} orang dalam ${myGuests.length} undangan` : "Belum ada tamu",
    },
    {
      href: "/vendor",
      label: "Vendor",
      value: myVendors.length ? `${deals} deal dari ${myVendors.length} pilihan` : "Belum ada vendor disimpan",
    },
  ];

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <Wordmark className="h-[18px] w-auto text-brand" />
        <IconButton icon="edit" label="Buka profil proyek" className="-mr-2" onClick={() => setProfileOpen(true)} />
      </header>

      <div className="px-5 pb-5 pt-3">
        <p className="text-[15px] text-ink-soft">Halo{myName ? `, ${myName}` : ""}</p>
        <h1 className="text-[30px] text-ink">{coupleLabel(wedding.brideName, wedding.groomName)}</h1>
      </div>

      <Countdown wedding={wedding} onSetDate={() => setProfileOpen(true)} />

      {promo && (
        <Reveal i={1} className="px-5 pt-5">
          <PromoCardView promo={promo} wedding={wedding} />
        </Reveal>
      )}

      <Reveal i={2}>
        <SectionTitle aside={rows.length ? `${done} dari ${rows.length} selesai` : undefined}>Berikutnya di ceklis</SectionTitle>
        <div className="px-5">
          <ProgressBar value={rows.length ? (done / rows.length) * 100 : 0} label="Kemajuan ceklis" />
        </div>
        {nextRows.length ? (
          <ul className="mt-2 px-2">
            {nextRows.map((r) => (
              <li key={r.key} className="flex items-start gap-1">
                <CheckToggle
                  checked={r.done}
                  label={`Tandai selesai: ${r.title}`}
                  onChange={(v) => patchRow(wedding.id, r, { done: v })}
                />
                <div className="min-w-0 flex-1 py-2.5">
                  <p className="text-[15px] text-ink">{r.title}</p>
                  <p className="text-[13px] text-ink-soft">{r.kind === "administrasi" ? "Administrasi" : r.group}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 pt-3 text-[15px] text-ink-soft">
            {rows.length ? "Semua item ceklis sudah selesai." : "Ceklis masih kosong. Tambah item dari tab Ceklis."}
          </p>
        )}
        <div className="px-5 pt-1">
          <Link href="/ceklis" className={buttonClass("ghost")}>
            Buka semua ceklis
          </Link>
        </div>
      </Reveal>

      <Reveal i={3}>
        <SectionTitle>Ringkasan</SectionTitle>
        <Card className="mx-5 divide-y divide-line overflow-hidden">
          {summary.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-cream-deep active:bg-line"
            >
              <span className="min-w-0">
                <span className="block text-[13px] text-ink-soft">{s.label}</span>
                <span className="block font-semibold text-ink">{s.value}</span>
              </span>
              <Icon name="chevronRight" size={18} className="shrink-0 text-ink-soft" />
            </Link>
          ))}
        </Card>
      </Reveal>

      {wedding.mahesa === "diajukan" && (
        <div className="pt-6">
          <OrgPending org="mahesa" wedding={wedding} />
        </div>
      )}

      {wedding.mahesa === "aktif" && (
        <Reveal i={4}>
          <SectionTitle
            aside={
              <Tag tone="leaf">
                <Icon name="lock" size={12} />
                Dikelola Mahesa
              </Tag>
            }
          >
            Rundown hari H
          </SectionTitle>
          <Card className="mx-5 p-4">
            {wedding.rundown.length ? (
              <ol className="space-y-2.5">
                {wedding.rundown.map((r) => (
                  <li key={r.id} className="flex gap-3">
                    <span className="w-12 shrink-0 font-serif font-semibold tabular-nums text-brand-deep">{r.time}</span>
                    <span className="min-w-0">
                      <span className="block text-[15px] text-ink">{r.title}</span>
                      {r.note && <span className="block text-[13px] text-ink-soft">{r.note}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[15px] text-ink-soft">
                Admin Mahesa belum mengisi rundown. Susunan acara muncul di sini begitu diisi.
              </p>
            )}
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setChangeFor({ org: "mahesa", section: "Rundown" })}
            >
              Ajukan perubahan rundown
            </Button>
          </Card>
        </Reveal>
      )}

      {wedding.momentum === "diajukan" && (
        <div className="pt-6">
          <OrgPending org="momentum" wedding={wedding} />
        </div>
      )}

      {wedding.momentum === "aktif" && (
        <Reveal i={5}>
          <SectionTitle
            aside={
              <Tag tone="leaf">
                <Icon name="lock" size={12} />
                Dikelola Momentum
              </Tag>
            }
          >
            Paket WCC
          </SectionTitle>
          <Card className="mx-5 p-4">
            <dl className="space-y-2 text-[15px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Jadwal shooting</dt>
                <dd className="text-right font-semibold">{formatDate(wedding.wcc.shootDate, "Belum dijadwalkan")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Status editing</dt>
                <dd className="text-right font-semibold">{EDIT_STATUS[wedding.wcc.status]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Hasil video</dt>
                <dd className="text-right font-semibold">
                  {wedding.wcc.resultLink ? (
                    <a
                      href={wedding.wcc.resultLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-deep underline underline-offset-2 hover:text-brand"
                    >
                      Buka hasil
                    </a>
                  ) : (
                    "Belum ada"
                  )}
                </dd>
              </div>
            </dl>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setChangeFor({ org: "momentum", section: "Jadwal WCC" })}
            >
              Ajukan perubahan jadwal
            </Button>
          </Card>
        </Reveal>
      )}

      {requests.length > 0 && (
        <>
          <SectionTitle>Permintaan perubahan</SectionTitle>
          <Card className="mx-5 divide-y divide-line">
            {requests.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Tag>
                  <span className="text-[13px] text-ink-soft">
                    {r.section}, {formatShortDate(r.createdAt.slice(0, 10))}
                  </span>
                </div>
                <p className="mt-1 text-[15px] text-ink">{r.note}</p>
              </div>
            ))}
          </Card>
        </>
      )}

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} wedding={wedding} />
      {changeFor && (
        <ChangeRequestSheet
          open
          onClose={() => setChangeFor(null)}
          wedding={wedding}
          org={changeFor.org}
          section={changeFor.section}
        />
      )}
    </>
  );
}
