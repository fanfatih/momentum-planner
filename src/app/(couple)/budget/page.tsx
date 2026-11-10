"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader, SectionTitle } from "@/components/shell";
import { Button, Card, EmptyState, MoneyField, ProgressBar, Reveal, Sheet, Tag, TextField, toast } from "@/components/ui";
import { formatRp } from "@/lib/format";
import { useCurrentWedding } from "@/lib/guard";
import { BUDGET_SUGGESTIONS } from "@/lib/seed";
import { removeBudget, saveBudget, useApp } from "@/lib/store";
import type { BudgetItem } from "@/lib/types";

function BudgetForm({ weddingId, item, onClose }: { weddingId: string; item: BudgetItem | null; onClose: () => void }) {
  const [category, setCategory] = useState(item?.category ?? "");
  const [planned, setPlanned] = useState(item?.planned ?? 0);
  const [actual, setActual] = useState(item?.actual ?? 0);
  const [paid, setPaid] = useState(item?.paid ?? 0);
  const [error, setError] = useState("");
  const overpaid = actual > 0 && paid > actual;

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!category.trim()) {
          setError("Isi nama pos budgetnya.");
          return;
        }
        saveBudget({ id: item?.id, weddingId, category: category.trim(), planned, actual, paid });
        toast(item ? "Pos budget diperbarui." : "Pos budget ditambahkan.");
        onClose();
      }}
    >
      <TextField
        label="Pos budget"
        placeholder="Contoh: Catering"
        list="budget-suggestions"
        value={category}
        error={error}
        onChange={(e) => {
          setCategory(e.target.value);
          setError("");
        }}
      />
      <datalist id="budget-suggestions">
        {BUDGET_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <MoneyField label="Rencana" hint="Perkiraan sebelum ada penawaran vendor." value={planned} onChange={setPlanned} />
      <MoneyField label="Aktual" hint="Harga yang disepakati dengan vendor." value={actual} onChange={setActual} />
      <MoneyField
        label="Sudah dibayar (DP atau cicilan)"
        hint={overpaid ? "Jumlah dibayar lebih besar dari biaya aktual. Cek lagi angkanya." : undefined}
        value={paid}
        onChange={setPaid}
      />
      <Button type="submit" block>
        {item ? "Simpan perubahan" : "Tambah pos budget"}
      </Button>
      {item && (
        <Button
          variant="danger"
          block
          icon="trash"
          onClick={() => {
            removeBudget(item.id);
            toast("Pos budget dihapus.");
            onClose();
          }}
        >
          Hapus pos ini
        </Button>
      )}
    </form>
  );
}

export default function BudgetPage() {
  const wedding = useCurrentWedding();
  const all = useApp((s) => s.budget);
  const [openId, setOpenId] = useState<string | "new" | null>(null);

  const items = useMemo(() => all.filter((b) => b.weddingId === wedding?.id), [all, wedding?.id]);
  if (!wedding) return null;

  const planned = items.reduce((n, b) => n + b.planned, 0);
  const actual = items.reduce((n, b) => n + b.actual, 0);
  const paid = items.reduce((n, b) => n + b.paid, 0);
  const remaining = items.reduce((n, b) => n + Math.max(b.actual - b.paid, 0), 0);
  const editing = openId && openId !== "new" ? (items.find((b) => b.id === openId) ?? null) : null;

  return (
    <>
      <PageHeader title="Budget" />

      {items.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="Belum ada pos budget"
          body="Mulai dari pos terbesar seperti venue dan catering, lalu isi rencana, aktual, dan DP."
          action={
            <Button icon="plus" onClick={() => setOpenId("new")}>
              Tambah pos budget
            </Button>
          }
        />
      ) : (
        <>
          <section aria-label="Ringkasan budget" className="px-5">
            <p className="text-[15px] text-ink-soft">Sisa yang harus dibayar</p>
            <p className="font-serif text-[40px] font-semibold leading-tight text-brand-deep tabular-nums">
              {formatRp(remaining)}
            </p>
            <div className="mt-3">
              <ProgressBar value={actual ? (paid / actual) * 100 : 0} label="Porsi biaya aktual yang sudah dibayar" />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {actual
                ? `${formatRp(paid)} dibayar dari biaya aktual ${formatRp(actual)}`
                : "Belum ada biaya aktual. Isi setelah deal dengan vendor."}
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-line py-3 text-center">
              {[
                ["Rencana", planned],
                ["Aktual", actual],
                ["Dibayar", paid],
              ].map(([label, value]) => (
                <div key={label as string} className="min-w-0">
                  <dt className="text-[13px] text-ink-soft">{label}</dt>
                  <dd className="truncate text-sm font-semibold tabular-nums text-ink">{formatRp(value as number)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <SectionTitle aside={`${items.length} pos`}>Rincian per pos</SectionTitle>
          <ul className="space-y-3 px-5">
            {items.map((b, i) => {
              const rest = Math.max(b.actual - b.paid, 0);
              const over = b.planned > 0 && b.actual > b.planned ? b.actual - b.planned : 0;
              const settled = b.actual > 0 && b.paid >= b.actual;
              return (
                <Reveal as="li" key={b.id} i={i}>
                  <Card className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenId(b.id)}
                      className="block w-full p-4 text-left transition-colors duration-150 hover:bg-cream-deep active:bg-line"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0 font-semibold text-ink">{b.category}</span>
                        <Icon name="chevronRight" size={16} className="mt-1 shrink-0 text-ink-soft" />
                      </span>
                      <span className="mt-1 block text-sm text-ink-soft tabular-nums">
                        Rencana {formatRp(b.planned)}
                        {b.actual ? `, aktual ${formatRp(b.actual)}` : ", aktual belum diisi"}
                      </span>
                      {(b.actual > 0 || b.paid > 0) && (
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {settled ? (
                            <Tag tone="leaf">Lunas</Tag>
                          ) : b.actual ? (
                            <Tag tone="sun">Sisa {formatRp(rest)}</Tag>
                          ) : null}
                          {b.paid > 0 && !settled && <Tag>Dibayar {formatRp(b.paid)}</Tag>}
                          {over > 0 && <Tag tone="brand">Lebih {formatRp(over)} dari rencana</Tag>}
                        </span>
                      )}
                    </button>
                  </Card>
                </Reveal>
              );
            })}
          </ul>
          <div className="px-5 pt-4">
            <Button variant="secondary" block icon="plus" onClick={() => setOpenId("new")}>
              Tambah pos budget
            </Button>
          </div>
        </>
      )}

      <Sheet open={openId !== null} onClose={() => setOpenId(null)} title={editing ? "Ubah pos budget" : "Tambah pos budget"}>
        <BudgetForm key={openId ?? "none"} weddingId={wedding.id} item={editing} onClose={() => setOpenId(null)} />
      </Sheet>
    </>
  );
}
