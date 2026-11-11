"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, SelectField, TextField } from "@/components/ui";
import { formatRp } from "@/lib/format";
import { availableStarts, dayStatus, fmtMin, fmtRange, toMin, type DayStatus, type Slot } from "@/lib/wcc-schedule";
import { wccBusy, type WccBusy, type WccPublic } from "@/lib/wcc";
import { MonthGrid, STATUS_LABEL } from "./MonthGrid";
import { Price } from "./Price";

const AREAS = [
  { id: "kota", label: "Kota Bogor", fee: 0 },
  { id: "kab", label: "Kabupaten Bogor atau Depok", fee: 50000 },
  { id: "jabo", label: "Jakarta, Bekasi, atau Tangerang", fee: 100000 },
  { id: "jauh", label: "Lebih jauh (dihitung sesuai jarak)", fee: 0 },
] as const;

const EVENTS = ["Akad", "Resepsi", "Akad dan resepsi", "Lamaran", "Tasyakuran atau lainnya"];
const DOW = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MON = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const wibToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

function longDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return `${DOW[dow]}, ${day} ${MON[m - 1]} ${y}`;
}

export function Booker({ data }: { data: WccPublic }) {
  const { packages, addons, wa } = data;
  const today = useMemo(wibToday, []);
  const [y0, m0] = today.split("-").map(Number);
  const [cur, setCur] = useState({ y: y0, m: m0 - 1 });
  const [pkgId, setPkgId] = useState(() => (packages.find((p) => p.highlight) ?? packages[0])?.id ?? "");
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [date, setDate] = useState("");
  const [start, setStart] = useState<number | null>(null);
  const [area, setArea] = useState<(typeof AREAS)[number]["id"]>("kota");
  const [event, setEvent] = useState(EVENTS[0]);
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [mahesa, setMahesa] = useState(false);
  const [busy, setBusy] = useState<WccBusy[]>([]);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const to = new Date(Date.UTC(y0, m0 - 1, 1) + 118 * 86400_000).toISOString().slice(0, 10);
    void wccBusy(today, to).then(setBusy);
  }, [today, y0, m0]);

  const pkg = packages.find((p) => p.id === pkgId);
  const extraHours = addons.reduce((n, a) => n + (a.unit === "per_jam" ? (picked[a.id] ?? 0) : 0), 0);
  const durationMin = pkg ? (pkg.hours + extraHours) * 60 : 180;

  const byDate = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const b of busy) {
      const s = { start: toMin(b.start_time), end: toMin(b.end_time) };
      m.set(b.date, [...(m.get(b.date) ?? []), s]);
    }
    return m;
  }, [busy]);

  const statusOf = (d: string): DayStatus => dayStatus(byDate.get(d) ?? [], durationMin);
  const starts = date ? availableStarts(byDate.get(date) ?? [], durationMin) : [];
  const validStart = start !== null && starts.includes(start) ? start : null;

  // Setelah paket atau tambahan jam berubah, jam yang sudah dipilih bisa tidak muat lagi.
  useEffect(() => {
    if (start !== null && !starts.includes(start)) setStart(null);
  }, [starts, start]);

  const areaInfo = AREAS.find((a) => a.id === area)!;
  const lines: { label: string; amount: number }[] = [];
  if (pkg) lines.push({ label: `Paket ${pkg.name} (${pkg.hours} jam)`, amount: pkg.price });
  for (const a of addons) {
    const q = picked[a.id] ?? 0;
    if (!q) continue;
    lines.push(a.unit === "per_jam" ? { label: `${a.name} ${q} jam`, amount: a.price * q } : { label: a.name, amount: a.price });
  }
  if (areaInfo.fee) lines.push({ label: `Transport ${areaInfo.label}`, amount: areaInfo.fee });
  const total = lines.reduce((n, l) => n + l.amount, 0);

  const toggle = (id: string, unit: "sekali" | "per_jam") =>
    setPicked((p) => {
      const n = { ...p };
      if (n[id]) delete n[id];
      else n[id] = 1;
      void unit;
      return n;
    });
  const step = (id: string, delta: number) =>
    setPicked((p) => {
      const q = Math.min(8, Math.max(0, (p[id] ?? 0) + delta));
      const n = { ...p };
      if (q) n[id] = q;
      else delete n[id];
      return n;
    });

  const missing: string[] = [];
  if (!pkg) missing.push("paket");
  if (!date) missing.push("tanggal");
  else if (validStart === null) missing.push("jam mulai");
  if (!name.trim()) missing.push("nama");

  const message = () => {
    const out = [
      "Halo Momentum WCC, aku mau booking.",
      "",
      `Nama: ${name.trim()}`,
      `Acara: ${event}`,
      `Tanggal: ${date ? longDate(date) : "-"}`,
      `Jam: ${validStart !== null ? fmtRange({ start: validStart, end: validStart + durationMin }) : "-"} WIB`,
      `Lokasi: ${areaInfo.label}${venue.trim() ? ` (${venue.trim()})` : ""}`,
      "",
      "Pesanan:",
      ...lines.map((l) => `- ${l.label}: ${formatRp(l.amount)}`),
      `Estimasi total: ${formatRp(total)}${area === "jauh" ? " (belum termasuk transport jauh)" : ""}`,
    ];
    if (mahesa) out.push("", "Aku klien Mahesa Weddings (diskon 10% atau gratis 1 add-on).");
    return out.join("\n");
  };

  const href = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(message())}` : "";
  const send = (e: React.MouseEvent) => {
    if (missing.length || !href) {
      e.preventDefault();
      setTried(true);
    }
  };

  if (!packages.length) return <p className="m-0 text-ink-soft">Paket sedang diperbarui. Hubungi kami lewat WhatsApp.</p>;

  const dayBusy = date ? (byDate.get(date) ?? []).slice().sort((a, b) => a.start - b.start) : [];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="min-w-0 space-y-8">
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-3 text-[17px] font-semibold">1. Pilih paket</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {packages.map((p) => (
              <label
                key={p.id}
                className={cx(
                  "flex min-h-11 cursor-pointer flex-col rounded-[14px] border-2 bg-paper p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-[var(--brand)]",
                  pkgId === p.id ? "border-[var(--brand)]" : "border-line",
                )}
              >
                <input type="radio" name="paket" className="sr-only" checked={pkgId === p.id} onChange={() => setPkgId(p.id)} />
                <span className="font-semibold">{p.name}</span>
                <span className="text-[14px] text-ink-soft">{p.hours} jam</span>
                <Price className="mt-1 font-semibold text-brand-deep" price={p.price} old={p.old_price} />
              </label>
            ))}
          </div>
        </fieldset>

        {addons.length > 0 && (
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-3 text-[17px] font-semibold">2. Tambahan (boleh kosong)</legend>
            <ul className="m-0 list-none space-y-2 p-0">
              {addons.map((a) => {
                const q = picked[a.id] ?? 0;
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border border-line bg-paper p-3">
                    {a.unit === "sekali" ? (
                      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <input type="checkbox" className="size-5 shrink-0 accent-[var(--brand)]" checked={q > 0} onChange={() => toggle(a.id, a.unit)} />
                        <span className="min-w-0">
                          <span className="block font-medium">{a.name}</span>
                          {a.note && <span className="block text-[13px] text-ink-soft">{a.note}</span>}
                        </span>
                      </label>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="m-0 font-medium">{a.name}</p>
                        <p className="m-0 text-[13px] text-ink-soft">{a.note || "Per jam"}</p>
                      </div>
                    )}
                    <Price className="shrink-0 text-[14px] font-semibold" price={a.price} old={a.old_price} unit={a.unit === "per_jam" ? "/jam" : ""} />
                    {a.unit === "per_jam" && (
                      <span className="inline-flex shrink-0 items-center gap-1" role="group" aria-label={`Jumlah ${a.name}`}>
                        <button type="button" aria-label={`Kurangi ${a.name}`} disabled={q === 0} onClick={() => step(a.id, -1)} className="size-11 rounded-[10px] border border-line text-lg">
                          −
                        </button>
                        <output className="w-6 text-center font-semibold" aria-label={`${q} jam`}>
                          {q}
                        </output>
                        <button type="button" aria-label={`Tambah ${a.name}`} disabled={q >= 8} onClick={() => step(a.id, 1)} className="size-11 rounded-[10px] border border-line text-lg">
                          +
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}

        <div>
          <h3 className="mb-1 text-[17px] font-semibold [font-family:var(--font-sans)]">3. Pilih tanggal dan jam</h3>
          <p className="m-0 mb-3 text-[14px] text-ink-soft">
            Durasi acaramu {durationMin / 60} jam. Jam operasional 06.00 sampai 23.00 WIB, ada jeda 1 jam setelah tiap acara.
          </p>
          <div className="rounded-[16px] border border-line bg-paper p-3">
            <MonthGrid
              year={cur.y}
              month={cur.m}
              today={today}
              selected={date}
              statusOf={statusOf}
              disabled={(d) => d < today || statusOf(d) === "penuh"}
              onPick={(d) => {
                setDate(d);
                setStart(null);
              }}
              onMonth={(delta) => {
                const t = cur.m + delta;
                setCur({ y: cur.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 });
              }}
            />
          </div>
          {date && (
            <div className="mt-4" aria-live="polite">
              <p className="m-0 font-semibold">{longDate(date)}</p>
              <p className="m-0 mb-2 text-[14px] text-ink-soft">
                {STATUS_LABEL[statusOf(date)]}
                {dayBusy.length > 0 && `. Sudah terisi: ${dayBusy.map(fmtRange).join(", ")}`}
              </p>
              <div role="radiogroup" aria-label="Jam mulai" className="flex flex-wrap gap-2">
                {starts.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={validStart === s}
                    onClick={() => setStart(s)}
                    className={cx("min-h-11 rounded-full border-2 px-4 text-[15px] font-semibold", validStart === s ? "border-[var(--brand)] bg-brand-tint" : "border-line bg-paper")}
                  >
                    {fmtMin(s)}
                  </button>
                ))}
              </div>
              {validStart !== null && (
                <p className="m-0 mt-2 text-[14px]">
                  Acara kamu: <strong>{fmtRange({ start: validStart, end: validStart + durationMin })} WIB</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-[18px] border border-line bg-paper p-4 lg:sticky lg:top-4" aria-label="Ringkasan pesanan">
        <h3 className="text-[19px]">Ringkasan</h3>
        <TextField label="Nama kamu atau pasangan" value={name} onChange={(e) => setName(e.target.value)} error={tried && !name.trim() ? "Isi nama dulu." : undefined} autoComplete="name" />
        <SelectField label="Jenis acara" value={event} onChange={(e) => setEvent(e.target.value)}>
          {EVENTS.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </SelectField>
        <SelectField label="Lokasi acara" value={area} onChange={(e) => setArea(e.target.value as typeof area)}>
          {AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
              {a.fee ? ` (+${formatRp(a.fee)})` : ""}
            </option>
          ))}
        </SelectField>
        <TextField label="Nama gedung atau daerah (opsional)" value={venue} maxLength={80} onChange={(e) => setVenue(e.target.value)} />
        <label className="flex min-h-11 items-center gap-3 text-[15px]">
          <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={mahesa} onChange={(e) => setMahesa(e.target.checked)} />
          Aku klien Mahesa Weddings
        </label>
        <ul className="m-0 list-none space-y-1 border-t border-line p-0 pt-3 text-[15px]">
          {lines.map((l) => (
            <li key={l.label} className="flex justify-between gap-3">
              <span>{l.label}</span>
              <span className="shrink-0 font-medium">{formatRp(l.amount)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-line pt-2 text-[17px] font-semibold">
            <span>Estimasi total</span>
            <span>{formatRp(total)}</span>
          </li>
        </ul>
        {area === "jauh" && <p className="m-0 text-[13px] text-ink-soft">Transport lokasi jauh dihitung admin sesuai jarak.</p>}
        {mahesa && <p className="m-0 text-[13px] text-ink-soft">Diskon 10% atau gratis 1 add-on dikonfirmasi admin saat chat.</p>}
        {tried && missing.length > 0 && (
          <p role="alert" className="m-0 text-[14px] font-medium text-brand-deep">
            Lengkapi dulu: {missing.join(", ")}.
          </p>
        )}
        {!wa && <p className="m-0 text-[13px] text-ink-soft">Nomor WhatsApp belum diatur.</p>}
        <a
          href={href || undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={send}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 font-semibold text-white hover:bg-[var(--brand-deep)]"
        >
          Kirim lewat WhatsApp
        </a>
        <p className="m-0 text-[13px] text-ink-soft">Tanggal baru terkunci setelah admin membalas dan DP 30% diterima.</p>
      </aside>
    </div>
  );
}
