"use client";

import { useMemo, useState } from "react";
import { Button, Card, ConfirmDelete, IconButton, Notice, SelectField, Sheet, Tag, TextField, toast } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { wccRemove, wccSave, type WccAdminData, type WccBooking } from "@/lib/wcc";
import { conflicts, dayStatus, fmtMin, fmtRange, toMin, type Slot } from "@/lib/wcc-schedule";
import { iso, MonthGrid } from "./MonthGrid";

const SOURCE: Record<WccBooking["source"], string> = { wa: "WhatsApp", web: "Landing page", lain: "Lainnya" };

export const slotOf = (b: { start_time: string; end_time: string }): Slot => ({ start: toMin(b.start_time), end: toMin(b.end_time) });
export const todayISO = () => {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
};

function BookingForm({ booking, date, all, onClose, onSaved }: { booking: WccBooking | null; date: string; all: WccBooking[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(booking?.date ?? date);
  const [start, setStart] = useState(booking ? booking.start_time.slice(0, 5) : "07:00");
  const [end, setEnd] = useState(booking ? booking.end_time.slice(0, 5) : "12:00");
  const [label, setLabel] = useState(booking?.label ?? "");
  const [source, setSource] = useState<WccBooking["source"]>(booking?.source ?? "wa");
  const [status, setStatus] = useState<WccBooking["status"]>(booking?.status ?? "pasti");
  const [force, setForce] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const s = toMin(start);
  const e = toMin(end);
  const valid = d && !Number.isNaN(s) && !Number.isNaN(e) && e > s;
  const clash = useMemo(
    () => (valid ? conflicts(all.filter((b) => b.date === d && b.id !== booking?.id).map(slotOf), { start: s, end: e }) : []),
    [all, d, s, e, valid, booking?.id],
  );
  const overlap = clash.some((c) => c.kind === "overlap");
  const gap = !overlap && clash.length > 0;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (!valid) return setError("Isi tanggal, lalu jam selesai harus setelah jam mulai.");
        if (overlap) return setError("Jam ini bertabrakan dengan jadwal lain.");
        if (gap && !force) return setError("Jeda kurang dari 1 jam. Centang konfirmasi di bawah kalau tetap ingin menyimpan.");
        setBusy(true);
        const err = await wccSave("bookings", { id: booking?.id, date: d, start_time: start, end_time: end, label: label.trim(), source, status });
        setBusy(false);
        if (err) return setError(err);
        toast(booking ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
        onSaved();
        onClose();
      }}
    >
      <TextField label="Tanggal" type="date" value={d} onChange={(x) => setD(x.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Jam mulai" type="time" value={start} onChange={(x) => setStart(x.target.value)} />
        <TextField label="Jam selesai" type="time" value={end} onChange={(x) => setEnd(x.target.value)} />
      </div>
      <TextField label="Nama klien atau catatan" hint="Hanya terlihat di panel admin." value={label} maxLength={120} onChange={(x) => setLabel(x.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Asal pesanan" value={source} onChange={(x) => setSource(x.target.value as WccBooking["source"])}>
          {(Object.keys(SOURCE) as WccBooking["source"][]).map((k) => (
            <option key={k} value={k}>
              {SOURCE[k]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" value={status} onChange={(x) => setStatus(x.target.value as WccBooking["status"])}>
          <option value="pasti">Pasti (DP masuk)</option>
          <option value="tentatif">Tentatif</option>
        </SelectField>
      </div>
      {valid && overlap && <Notice tone="brand">Bertabrakan dengan jadwal {clash.filter((c) => c.kind === "overlap").map((c) => fmtRange(c.slot)).join(", ")}.</Notice>}
      {gap && (
        <Notice>
          Jeda dengan jadwal {clash.map((c) => fmtRange(c.slot)).join(", ")} kurang dari 1 jam.
          <label className="mt-2 flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={force} onChange={(x) => setForce(x.target.checked)} />
            Tetap simpan
          </label>
        </Notice>
      )}
      {valid && !clash.length && <p className="m-0 text-[14px] text-ink-soft">Jadwal ini menutup {fmtMin(s)} sampai {fmtMin(e + 60)}, termasuk jeda 1 jam sesudah acara.</p>}
      {error && (
        <p role="alert" className="m-0 text-[13px] font-medium text-brand-deep">
          {error}
        </p>
      )}
      <Button type="submit" block disabled={busy}>
        {booking ? "Simpan perubahan" : "Tambah jadwal"}
      </Button>
    </form>
  );
}

export function SchedulePanel({ data, reload }: { data: WccAdminData; reload: () => void }) {
  const today = todayISO();
  const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState<string>("");
  const [form, setForm] = useState<{ booking: WccBooking | null; date: string } | null>(null);
  const [deleting, setDeleting] = useState<WccBooking | null>(null);

  const minHours = Math.min(...data.packages.filter((p) => p.active).map((p) => p.hours), 3);
  const byDate = useMemo(() => {
    const m = new Map<string, WccBooking[]>();
    for (const b of data.bookings) m.set(b.date, [...(m.get(b.date) ?? []), b]);
    return m;
  }, [data.bookings]);

  const statusOf = (date: string) => dayStatus((byDate.get(date) ?? []).map(slotOf), minHours * 60);
  const move = (delta: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (((m + delta) % 12) + 12) % 12 }));
  const shown = selected ? (byDate.get(selected) ?? []) : data.bookings.filter((b) => b.date >= today).slice(0, 10);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <MonthGrid year={ym.y} month={ym.m} today={today} selected={selected} statusOf={statusOf} onPick={(d) => setSelected(selected === d ? "" : d)} onMonth={move} />
        <p className="m-0 mt-3 text-[13px] text-ink-soft">
          Status dihitung untuk paket terpendek ({minHours} jam), jam operasional 06.00–23.00, dan jeda 1 jam sesudah acara.
        </p>
      </Card>

      <section aria-label="Daftar jadwal" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[19px]">{selected ? formatDate(selected) : "Jadwal mendatang"}</h2>
          <Button icon="plus" onClick={() => setForm({ booking: null, date: selected || today })}>
            Tambah jadwal
          </Button>
        </div>
        {shown.length === 0 ? (
          <p className="m-0 text-[15px] text-ink-soft">{selected ? "Belum ada jadwal di tanggal ini." : "Belum ada jadwal mendatang. Pesanan lewat WhatsApp bisa dicatat dengan Tambah jadwal."}</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {shown.map((b) => (
              <li key={b.id} className="flex items-center gap-2 rounded-[12px] border border-line bg-paper p-3">
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-semibold">
                    {!selected && <span className="mr-2 font-normal text-ink-soft">{formatDate(b.date)}</span>}
                    {fmtRange(slotOf(b))}
                  </p>
                  <p className="m-0 truncate text-[14px] text-ink-soft">{b.label || "Tanpa catatan"}</p>
                  <p className="m-0 mt-1 flex gap-2">
                    <Tag tone={b.status === "pasti" ? "leaf" : "sun"}>{b.status === "pasti" ? "Pasti" : "Tentatif"}</Tag>
                    <Tag>{SOURCE[b.source]}</Tag>
                  </p>
                </div>
                <IconButton icon="edit" label={`Ubah jadwal ${b.label || fmtRange(slotOf(b))}`} onClick={() => setForm({ booking: b, date: b.date })} />
                <IconButton icon="trash" label={`Hapus jadwal ${b.label || fmtRange(slotOf(b))}`} onClick={() => setDeleting(b)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.booking ? "Ubah jadwal" : "Tambah jadwal"}>
        {form && <BookingForm key={form.booking?.id ?? "new"} booking={form.booking} date={form.date} all={data.bookings} onClose={() => setForm(null)} onSaved={reload} />}
      </Sheet>
      <ConfirmDelete
        open={!!deleting}
        what={deleting ? `Jadwal ${formatDate(deleting.date)} ${fmtRange(slotOf(deleting))}` : ""}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const err = await wccRemove("bookings", deleting.id);
          toast(err ?? "Jadwal dihapus.");
          setDeleting(null);
          reload();
        }}
      />
    </div>
  );
}

export { iso };
