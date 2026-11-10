"use client";

import Link from "next/link";
import { AdminHeader, DataList, useRole, type Col } from "@/components/admin/shared";
import { ORG_NAME } from "@/components/promo";
import { Button, buttonClass, Card, EmptyState, Tag, toast } from "@/components/ui";
import { coupleLabel, displayWa, formatShortDate } from "@/lib/format";
import { LINK_STATE } from "@/lib/labels";
import { setLink, useApp } from "@/lib/store";
import type { OrgKey, Role, Wedding } from "@/lib/types";

const ORGS_FOR: Record<Role, OrgKey[]> = {
  super_admin: ["mahesa", "momentum"],
  admin_mahesa: ["mahesa"],
  admin_momentum: ["momentum"],
  bride: [],
  groom: [],
};

const LEAD: Partial<Record<Role, string>> = {
  admin_mahesa: "Hanya proyek yang tertaut ke Mahesa Weddings yang muncul di sini.",
  admin_momentum: "Hanya proyek dengan paket WCC Momentum yang muncul di sini.",
  super_admin: "Semua proyek, termasuk yang belum tertaut ke Mahesa atau Momentum.",
};

export default function AdminProjectsPage() {
  const role = useRole();
  const weddings = useApp((s) => s.weddings);
  const requests = useApp((s) => s.requests);
  if (!role) return null;

  const orgs = ORGS_FOR[role];
  const pending = weddings.flatMap((w) =>
    orgs.filter((o) => w[o] === "diajukan").map((o) => ({ key: `${w.id}-${o}`, wedding: w, org: o })),
  );
  const active = weddings.filter((w) => role === "super_admin" || orgs.some((o) => w[o] === "aktif"));
  const waiting = (w: Wedding) =>
    requests.filter((r) => r.weddingId === w.id && orgs.includes(r.org) && r.status === "menunggu").length;

  const cols: Col<Wedding>[] = [
    {
      header: "Pasangan",
      cell: (w) => (
        <Link
          href={`/admin/proyek/${w.id}`}
          className="font-semibold text-brand-deep underline underline-offset-2 hover:text-brand"
        >
          {coupleLabel(w.brideName, w.groomName)}
        </Link>
      ),
    },
    { header: "Tanggal akad", cell: (w) => formatShortDate(w.akadDate), className: "whitespace-nowrap" },
    { header: "Kota", cell: (w) => w.city || "-" },
    {
      header: "Tautan",
      cell: (w) => (
        <span className="flex flex-wrap justify-end gap-1.5 xl:justify-start">
          {(["mahesa", "momentum"] as OrgKey[])
            .filter((o) => w[o] !== "none")
            .map((o) => (
              <Tag key={o} tone={LINK_STATE[w[o]].tone}>
                {o === "mahesa" ? "Mahesa" : "Momentum"}: {LINK_STATE[w[o]].label.toLowerCase()}
              </Tag>
            ))}
          {w.mahesa === "none" && w.momentum === "none" && <span className="text-ink-soft">Belum tertaut</span>}
        </span>
      ),
    },
    {
      header: "Perlu tindakan",
      cell: (w) => {
        const n = waiting(w);
        return n ? <Tag tone="sun">{n} permintaan perubahan</Tag> : <span className="text-ink-soft">Tidak ada</span>;
      },
    },
  ];

  return (
    <>
      <AdminHeader title="Proyek" lead={LEAD[role]} />

      {pending.length > 0 && (
        <section aria-labelledby="pending-title" className="pb-8">
          <h2 id="pending-title" className="text-[21px]">
            Pengajuan paket masuk
          </h2>
          <p className="mt-1 text-[15px] text-ink-soft">
            Tautkan setelah kalian deal. Begitu ditautkan, kartu promo di aplikasi pasangan hilang dan bagianmu aktif.
          </p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {pending.map(({ key, wedding: w, org }) => (
              <li key={key}>
                <Card className="p-4">
                  <Tag tone="sun">Mengajukan ke {ORG_NAME[org]}</Tag>
                  <p className="mt-2 font-serif text-[19px] font-semibold">{coupleLabel(w.brideName, w.groomName)}</p>
                  <p className="text-sm text-ink-soft">
                    Akad {formatShortDate(w.akadDate)}
                    {w.city ? `, ${w.city}` : ""}, WhatsApp {displayWa(w.contactWa)}
                  </p>
                  {w.sample && (
                    <div className="mt-2">
                      <Tag>Data contoh</Tag>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setLink(w.id, org, "aktif");
                        toast("Proyek ditautkan.");
                      }}
                    >
                      Tautkan proyek
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setLink(w.id, org, "none");
                        toast("Pengajuan ditolak.");
                      }}
                    >
                      Tolak pengajuan
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="pb-3 text-[21px]">{role === "super_admin" ? "Semua proyek" : "Proyek tertaut"}</h2>
      {active.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Belum ada proyek tertaut"
          body="Proyek muncul di sini setelah pasangan mengajukan paket dari aplikasi dan pengajuannya kamu tautkan."
        />
      ) : (
        <DataList
          caption="Daftar proyek pernikahan"
          rows={active}
          cols={cols}
          actions={(w) => (
            <Link href={`/admin/proyek/${w.id}`} className={buttonClass("secondary")}>
              Buka proyek
            </Link>
          )}
        />
      )}
    </>
  );
}
