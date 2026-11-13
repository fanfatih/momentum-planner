"use client";

import { useEffect, useState } from "react";
import { AdminHeader, Denied, useRole } from "@/components/admin/shared";
import { Button, Card, LoadingState, TextAreaField, TextField, toast } from "@/components/ui";
import { invPlanSave, invPlansLoad, type InvPlan } from "@/lib/inv-plans";

function PlanForm({ plan }: { plan: InvPlan }) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.price));
  const [oldPrice, setOldPrice] = useState(plan.old_price ? String(plan.old_price) : "");
  const [blurb, setBlurb] = useState(plan.blurb);
  const [features, setFeatures] = useState(plan.features.join("\n"));
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const pr = Number(price);
    const op = oldPrice === "" ? null : Number(oldPrice);
    const er: Record<string, string> = {};
    if (!name.trim()) er.name = "Isi nama paket.";
    if (price === "" || !Number.isFinite(pr) || pr < 0) er.price = "Isi harga dalam rupiah.";
    if (op !== null && (!Number.isFinite(op) || op <= pr)) er.old = "Harga coret harus lebih besar dari harga jual.";
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const m = await invPlanSave({ id: plan.id, name: name.trim(), price: pr, old_price: op, blurb: blurb.trim(), features: features.split("\n").map((x) => x.trim()).filter(Boolean) });
    setBusy(false);
    toast(m ?? `Paket ${name.trim()} disimpan.`);
  };

  return (
    <Card className="p-4">
      <form onSubmit={save} noValidate className="space-y-4" aria-label={`Paket ${plan.name}`}>
        <h2 className="text-[19px]">Paket {plan.id === "standar" ? "standar" : "eksklusif"}</h2>
        <TextField label="Nama paket" value={name} error={err.name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Harga jual (Rp)" type="number" inputMode="numeric" min={0} value={price} error={err.price} onChange={(e) => setPrice(e.target.value)} />
          <TextField label="Harga coret (Rp)" hint="Kosongkan bila tanpa promo." type="number" inputMode="numeric" min={0} value={oldPrice} error={err.old} onChange={(e) => setOldPrice(e.target.value)} />
        </div>
        <TextAreaField label="Penjelasan singkat" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
        <TextAreaField label="Isi paket" hint="Satu baris satu poin." rows={6} value={features} onChange={(e) => setFeatures(e.target.value)} />
        <Button type="submit" block disabled={busy}>
          {busy ? "Menyimpan" : `Simpan paket ${plan.name}`}
        </Button>
      </form>
    </Card>
  );
}

export default function PaketUndanganPage() {
  const role = useRole();
  const [plans, setPlans] = useState<InvPlan[] | null>(null);
  useEffect(() => {
    if (role === "super_admin" || role === "admin_momentum") void invPlansLoad().then(setPlans);
  }, [role]);

  if (!role) return null;
  if (role !== "super_admin" && role !== "admin_momentum") return <Denied need="oleh Admin Momentum atau Super Admin" />;
  return (
    <>
      <AdminHeader title="Paket undangan" lead="Harga dan coretan yang tampil di katalog undangan digital." />
      {!plans ? (
        <LoadingState what="paket undangan" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {plans.map((p) => (
            <PlanForm key={p.id} plan={p} />
          ))}
        </div>
      )}
    </>
  );
}
