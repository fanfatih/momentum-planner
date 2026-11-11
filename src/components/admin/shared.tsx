"use client";

import type { ReactNode } from "react";
import type { IconName } from "@/components/icons";
import { Card, EmptyState } from "@/components/ui";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

export const ADMIN_NAV: { href: string; label: string; icon: IconName; roles: Role[] }[] = [
  { href: "/admin", label: "Proyek", icon: "folder", roles: ["admin_mahesa", "admin_momentum", "super_admin"] },
  { href: "/admin/katalog", label: "Katalog", icon: "store", roles: ["admin_mahesa", "super_admin"] },
  { href: "/admin/wcc", label: "WCC", icon: "video", roles: ["admin_momentum", "super_admin"] },
  { href: "/admin/promo", label: "Kartu promo", icon: "megaphone", roles: ["super_admin"] },
  { href: "/admin/ceklis", label: "Ceklis default", icon: "checklist", roles: ["super_admin"] },
  { href: "/admin/akun", label: "Akun dan kontak", icon: "people", roles: ["super_admin"] },
];

export function useRole(): Role | null {
  return useApp((s) => s.session?.role ?? null);
}

export function AdminHeader({ title, lead, action }: { title: string; lead?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 pb-5">
      <div className="min-w-0">
        <h1 className="text-[28px] text-ink lg:text-[32px]">{title}</h1>
        {lead && <p className="mt-1 max-w-[60ch] text-[15px] text-ink-soft">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

/** Layar untuk role yang tidak punya akses ke menu ini. */
export function Denied({ need }: { need: string }) {
  return (
    <EmptyState
      level={1}
      icon="lock"
      title="Menu ini bukan untuk role kamu"
      body={`Halaman ini hanya bisa dibuka ${need}. Masuk dengan akun yang sesuai untuk mengelolanya.`}
    />
  );
}

export interface Col<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

/** Tiga keadaan dari definisi kolom yang sama: kartu satu kolom di HP, dua kolom di tablet, tabel saat muat (xl). */
export function DataList<T extends { id: string }>({
  rows,
  cols,
  actions,
  caption,
}: {
  rows: T[];
  cols: Col<T>[];
  actions?: (row: T) => ReactNode;
  caption: string;
}) {
  return (
    <>
      <Card className="hidden overflow-x-auto xl:block">
        <table className="w-full text-left text-[15px]">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-cream-deep text-[13px] text-ink-soft">
            <tr>
              {cols.map((c) => (
                <th key={c.header} scope="col" className="whitespace-nowrap px-4 py-2.5 font-semibold">
                  {c.header}
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                {cols.map((c) => (
                  <td key={c.header} className={`px-4 py-3 ${c.className ?? ""}`}>
                    {c.cell(r)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1 whitespace-nowrap">{actions(r)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ul className="grid gap-3 md:grid-cols-2 xl:hidden" aria-label={caption}>
        {rows.map((r) => (
          <li key={r.id}>
            <Card className="flex h-full flex-col p-4">
              <div className="font-semibold text-ink">{cols[0].cell(r)}</div>
              <dl className="mt-2 space-y-1.5 text-sm">
                {cols.slice(1).map((c) => (
                  <div key={c.header} className="flex justify-between gap-3">
                    <dt className="shrink-0 text-ink-soft">{c.header}</dt>
                    <dd className="min-w-0 text-right text-ink">{c.cell(r)}</dd>
                  </div>
                ))}
              </dl>
              {actions && <div className="mt-auto flex flex-wrap gap-2 pt-3">{actions(r)}</div>}
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
