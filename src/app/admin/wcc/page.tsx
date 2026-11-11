"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHeader, Denied, useRole } from "@/components/admin/shared";
import { LoadingState, Segmented } from "@/components/ui";
import { AddonsPanel, PackagesPanel, PortfolioPanel, TeamPanel, TextPanel } from "@/components/wcc/admin-content";
import { SchedulePanel } from "@/components/wcc/admin-schedule";
import { wccLoadAll, type WccAdminData } from "@/lib/wcc";

type Tab = "jadwal" | "paket" | "addon" | "porto" | "tim" | "teks";

const TABS: { value: Tab; label: string }[] = [
  { value: "jadwal", label: "Jadwal" },
  { value: "paket", label: "Paket" },
  { value: "addon", label: "Add-on" },
  { value: "porto", label: "Porto" },
  { value: "tim", label: "Tim" },
  { value: "teks", label: "Teks" },
];

export default function WccAdminPage() {
  const role = useRole();
  const [tab, setTab] = useState<Tab>("jadwal");
  const [data, setData] = useState<WccAdminData | null>(null);

  const reload = useCallback(() => {
    void wccLoadAll().then(setData);
  }, []);
  useEffect(() => {
    if (role === "super_admin" || role === "admin_momentum") reload();
  }, [role, reload]);

  if (!role) return null;
  if (role !== "super_admin" && role !== "admin_momentum") return <Denied need="oleh Admin Momentum atau Super Admin" />;

  return (
    <>
      <AdminHeader title="WCC" lead="Jadwal, paket, add-on, portofolio, tim, dan teks untuk landing page wcc.momentumluna.my.id." />
      <div className="pb-5">
        <Segmented label="Bagian" value={tab} onChange={setTab} options={TABS} />
      </div>
      {!data ? (
        <LoadingState what="data WCC" />
      ) : (
        <>
          {tab === "jadwal" && <SchedulePanel data={data} reload={reload} />}
          {tab === "paket" && <PackagesPanel data={data} reload={reload} />}
          {tab === "addon" && <AddonsPanel data={data} reload={reload} />}
          {tab === "porto" && <PortfolioPanel data={data} reload={reload} />}
          {tab === "tim" && <TeamPanel data={data} reload={reload} />}
          {tab === "teks" && <TextPanel key={JSON.stringify(data.settings).length} data={data} reload={reload} />}
        </>
      )}
    </>
  );
}
