"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { PageHeader, SectionTitle } from "@/components/shell";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  MoneyField,
  ProgressBar,
  Reveal,
  Segmented,
  Sheet,
  Tag,
  TextField,
  toast,
} from "@/components/ui";
import { formatRp, formatShortDate } from "@/lib/format";
import { useCurrentWedding } from "@/lib/guard";
import { BUDGET_SUGGESTIONS } from "@/lib/seed";
import { addPayment, removeBudget, removePayment, saveBudget, useApp } from "@/lib/store";
import type { BudgetItem, BudgetPayment, Payer, Wedding } from "@/lib/types";

const payerName = (w: Wedding, p: Payer) => (p === "bride" ? w.brideName.trim() || "Pengantin wanita" : w.groomName.trim() || "Pengantin pria");

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const byNewest = (a: BudgetPayment, b: BudgetPayment) => b.paidOn.localeCompare(a.paidOn);

function PaymentForm({ wedding, item, onDone }: { wedding: Wedding; item: BudgetItem; onDone: () => void }) {
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayIso());
  const [payer, setPayer] = useState<Payer>("bride");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const over = item.actual > 0 && item.paid + amount > item.actual;

  return (
    <form
      className="mt-3 space-y-3 rounded-[12px] border border-line bg-cream p-3"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (amount <= 0) {
          setError("Isi jumlah pembayaran.");
          return;
        }
        addPayment({ weddingId: wedding.id, budgetId: item.id, amount, paidOn: date || todayIso(), payer, note: note.trim() });
        toast("Pembayaran dicatat.");
        onDone();
      }}
    >
      <Segmented
        label="Dibayar oleh"
        value={payer}
        onChange={setPayer}
        options={[
          { value: "bride", label: payerName(wedding, "bride") },
          { value: "groom", label: payerName(wedding, "groom") },
        ]}
      />
      <MoneyField
        label="Jumlah dibayar"
        error={error}
        hint={over ? "Total dibayar jadi lebih besar dari biaya aktual. Cek lagi angkanya." : undefined}
        value={amount}
        onChange={(n) => {
          setAmount(n);
          setError("");
        }}
      />
      <TextField label="Tanggal bayar" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <TextField label="Catatan (opsional)" placeholder="Contoh: DP 30%" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit">Simpan</Button>
        <Button variant="secondary" onClick={onDone}>
          Batal
        </Button>
      </div>
    </form>
  );
}

function PaymentHistory({ wedding, item }: { wedding: Wedding; item: BudgetItem }) {
  const all = useApp((s) => s.payments);
  const [adding, setAdding] = useState(false);
  const list = useMemo(() => all.filter((p) => p.budgetId === item.id).sort(byNewest), [all, item.id]);
  const recorded = list.reduce((n, p) => n + p.amount, 0);
  const unrecorded = Math.max(item.paid - recorded, 0);

  return (
    <section aria-label="Riwayat pembayaran" className="border-t border-line pt-4">
      <h3 className="text-[17px] text-ink">Riwayat pembayaran</h3>
      {list.length === 0 && unrecorded === 0 && (
        <p className="mt-1 text-sm text-ink-soft">Belum ada pembayaran. Catat DP atau cicilan supaya kelihatan siapa yang sudah membayar.</p>
      )}
      <ul className="mt-2 divide-y divide-line">
        {list.map((p) => (
          <li key={p.id} className="flex items-start gap-2 py-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold tabular-nums text-ink">{formatRp(p.amount)}</p>
              <p className="text-sm text-ink-soft">
                {formatShortDate(p.paidOn)} · dibayar {payerName(wedding, p.payer)}
                {p.note ? ` · ${p.note}` : ""}
              </p>
            </div>
            <IconButton
              icon="trash"
              label={`Hapus pembayaran ${formatRp(p.amount)} tanggal ${formatShortDate(p.paidOn)}`}
              className="-mr-2 -mt-1"
              onClick={() => {
                removePayment(p.id);
                toast("Pembayaran dihapus.");
              }}
            />
          </li>
        ))}
      </ul>
      {unrecorded > 0 && (
        <p className="mt-1 text-sm text-ink-soft tabular-nums">
          Dibayar sebelum riwayat dicatat: {formatRp(unrecorded)} (belum ada keterangan siapa yang membayar).
        </p>
      )}
      {adding ? (
        <PaymentForm wedding={wedding} item={item} onDone={() => setAdding(false)} />
      ) : (
        <Button variant="secondary" block icon="plus" className="mt-3" onClick={() => setAdding(true)}>
          Catat pembayaran
        </Button>
      )}
    </section>
  );
}

function BudgetForm({
  weddingId,
  item,
  onClose,
  onSaved,
}: {
  weddingId: string;
  item: BudgetItem | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [category, setCategory] = useState(item?.category ?? "");
  const [planned, setPlanned] = useState(item?.planned ?? 0);
  const [actual, setActual] = useState(item?.actual ?? 0);
  const [error, setError] = useState("");
  const overpaid = !!item && actual > 0 && item.paid > actual;

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
        const id = saveBudget({ id: item?.id, weddingId, category: category.trim(), planned, actual });
        if (item) {
          toast("Pos budget diperbarui.");
          onClose();
        } else {
          toast("Pos budget ditambahkan. Catat DP-nya di bawah kalau sudah membayar.");
          onSaved(id);
        }
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
      <MoneyField
        label="Aktual"
        hint={overpaid ? "Jumlah dibayar lebih besar dari biaya aktual. Cek lagi angkanya." : "Harga yang disepakati dengan vendor."}
        value={actual}
        onChange={setActual}
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
  const allPayments = useApp((s) => s.payments);
  const [openId, setOpenId] = useState<string | "new" | null>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);

  const items = useMemo(() => all.filter((b) => b.weddingId === wedding?.id), [all, wedding?.id]);
  const payments = useMemo(
    () => allPayments.filter((p) => p.weddingId === wedding?.id).sort(byNewest),
    [allPayments, wedding?.id],
  );
  if (!wedding) return null;

  const byPayer = (who: Payer) => payments.filter((p) => p.payer === who).reduce((n, p) => n + p.amount, 0);
  const brideTotal = byPayer("bride");
  const groomTotal = byPayer("groom");

  const planned = items.reduce((n, b) => n + b.planned, 0);
  const actual = items.reduce((n, b) => n + b.actual, 0);
  const paid = items.reduce((n, b) => n + b.paid, 0);
  const remaining = items.reduce((n, b) => n + Math.max(b.actual - b.paid, 0), 0);
  const unrecorded = Math.max(paid - brideTotal - groomTotal, 0);
  const editing = openId && openId !== "new" ? (items.find((b) => b.id === openId) ?? null) : null;
  const shownPayments = showAllPayments ? payments : payments.slice(0, 5);
  const categoryOf = (id: string) => items.find((b) => b.id === id)?.category ?? "Pos dihapus";

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
            {paid > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-ink">Siapa yang sudah membayar</p>
                <div
                  role="img"
                  aria-label={`${payerName(wedding, "bride")} ${formatRp(brideTotal)}, ${payerName(wedding, "groom")} ${formatRp(groomTotal)}`}
                  className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-cream-deep"
                >
                  <span className="bg-brand" style={{ width: `${(brideTotal / paid) * 100}%` }} />
                  <span className="bg-leaf-deep" style={{ width: `${(groomTotal / paid) * 100}%` }} />
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-ink-soft">
                      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-brand" />
                      <span className="truncate">{payerName(wedding, "bride")}</span>
                    </dt>
                    <dd className="font-semibold tabular-nums text-ink">{formatRp(brideTotal)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-ink-soft">
                      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-leaf-deep" />
                      <span className="truncate">{payerName(wedding, "groom")}</span>
                    </dt>
                    <dd className="font-semibold tabular-nums text-ink">{formatRp(groomTotal)}</dd>
                  </div>
                </dl>
                {unrecorded > 0 && (
                  <p className="mt-1 text-[13px] text-ink-soft tabular-nums">
                    {formatRp(unrecorded)} dibayar sebelum riwayat dicatat, belum ada keterangan siapa yang membayar.
                  </p>
                )}
              </div>
            )}
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

          {payments.length > 0 && (
            <>
              <SectionTitle aside={`${payments.length} pembayaran`}>Riwayat pembayaran</SectionTitle>
              <ul className="mx-5 divide-y divide-line rounded-[14px] border border-line bg-paper">
                {shownPayments.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(p.budgetId)}
                      className="block w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-cream-deep active:bg-line"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate font-semibold text-ink">{categoryOf(p.budgetId)}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-ink">{formatRp(p.amount)}</span>
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-soft">
                        {formatShortDate(p.paidOn)} · dibayar {payerName(wedding, p.payer)}
                        {p.note ? ` · ${p.note}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {payments.length > 5 && (
                <div className="px-5 pt-3">
                  <Chip selected={showAllPayments} onClick={() => setShowAllPayments(!showAllPayments)}>
                    {showAllPayments ? "Tampilkan lebih sedikit" : `Lihat semua ${payments.length} pembayaran`}
                  </Chip>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Sheet open={openId !== null} onClose={() => setOpenId(null)} title={editing ? "Ubah pos budget" : "Tambah pos budget"}>
        <div className="space-y-6">
          <BudgetForm
            key={openId ?? "none"}
            weddingId={wedding.id}
            item={editing}
            onClose={() => setOpenId(null)}
            onSaved={(id) => setOpenId(id)}
          />
          {editing && <PaymentHistory key={editing.id} wedding={wedding} item={editing} />}
        </div>
      </Sheet>
    </>
  );
}
