"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Button, Segmented, SelectField, TextAreaField, TextField, toast } from "@/components/ui";
import { daysUntil, mapsLink } from "@/lib/format";
import { loadWishes, submitRsvp, type WishEntry } from "@/lib/store";
import type { InvitationEvent } from "@/lib/types";
import { CalendarGold, PinGold } from "./art";
import { GalleryPhoto } from "./motion";

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
};

export const eventDate = (iso: string) => fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const shortDate = (iso: string) => fmt(iso, { day: "numeric", month: "long", year: "numeric" });
export const weekdayName = (iso: string) => fmt(iso, { weekday: "long" });
export const monthNumber = (iso: string) => fmt(iso, { month: "2-digit" });
export const yearNumber = (iso: string) => fmt(iso, { year: "numeric" });
export const dayNumber = (iso: string) => fmt(iso, { day: "2-digit" });
export const monthYear = (iso: string) => fmt(iso, { month: "long", year: "numeric" });
export const firstName = (s: string) => s.trim().split(/\s+/)[0] || s;

/** Nama depan dipakai di sampul. Nama panjang dikecilkan supaya muat dalam satu baris. */
export const scriptSize = (name: string, big: number) => {
  const n = name.length;
  return n <= 6 ? big : n <= 9 ? Math.round(big * 0.82) : Math.round(big * 0.66);
};

export const mapsFor = (ev: InvitationEvent) => ev.mapsQuery.trim() || [ev.place, ev.address].filter(Boolean).join(" ");

function MapsLink({ ev }: { ev: InvitationEvent }) {
  const query = mapsFor(ev);
  if (!query) return null;
  return (
    <a href={mapsLink(query)} target="_blank" rel="noopener noreferrer" className="inv-maps">
      <Icon name="pin" size={18} />
      Buka peta
    </a>
  );
}

/** Tanggal di kiri, tempat di kanan, dipisah garis tipis. Dipakai tema Blush dan Bunga Liar. */
export function EventIcons({ ev, withMaps = true }: { ev: InvitationEvent; withMaps?: boolean }) {
  return (
    <>
      <div className="inv-event-grid">
        <div className="inv-event-col">
          <CalendarGold />
          {ev.date && <p className="t-caps m-0">{eventDate(ev.date)}</p>}
          {ev.time && <p className="m-0 text-[14px]">Pukul {ev.time}</p>}
        </div>
        <span className="inv-vr" aria-hidden="true" />
        <div className="inv-event-col">
          <PinGold />
          {ev.place && <p className="t-caps m-0">{ev.place}</p>}
          {ev.address && <p className="m-0 whitespace-pre-line text-[14px]">{ev.address}</p>}
        </div>
      </div>
      {withMaps && <MapsLink ev={ev} />}
    </>
  );
}

/** Bulan, hari, dan jam disusun seperti kartu cetak. Dipakai tema Marun. */
export function EventDateStack({ ev, compact = false }: { ev: InvitationEvent; compact?: boolean }) {
  return (
    <>
      {ev.date && (
        <>
          <p className="t-caps m-0">{monthYear(ev.date)}</p>
          <div className="mr-date mt-3">
            <span className="side">{weekdayName(ev.date)}</span>
            <span className="day">{dayNumber(ev.date)}</span>
            <span className="side">{ev.time || "Waktu menyusul"}</span>
          </div>
        </>
      )}
      {ev.place && <p className="mx-auto mt-4 mb-0 max-w-[26ch] font-semibold text-ink">{ev.place}</p>}
      {ev.address && <p className="mx-auto mt-1 mb-0 max-w-[30ch] whitespace-pre-line text-[14px] text-ink-soft">{ev.address}</p>}
      {!compact && <MapsLink ev={ev} />}
    </>
  );
}

export function Wishes({ slug, refreshKey, preview }: { slug: string; refreshKey: number; preview: boolean }) {
  const [list, setList] = useState<WishEntry[] | null>(null);
  useEffect(() => {
    let live = true;
    if (preview) {
      setList([]);
      return;
    }
    loadWishes(slug).then((r) => live && setList(r));
    return () => {
      live = false;
    };
  }, [slug, refreshKey, preview]);

  if (list === null) return <p className="text-center text-[15px] text-ink-soft">Memuat ucapan.</p>;
  if (!list.length) {
    return <p className="text-center text-[15px] text-ink-soft">Belum ada ucapan. Jadilah yang pertama menulis.</p>;
  }
  return (
    <ul className="m-0 list-none space-y-3 p-0 text-left">
      {list.map((w) => (
        <li key={w.name + w.createdAt} className="border-l-2 border-line bg-cream-deep/50 px-4 py-3">
          <p className="m-0 font-semibold text-ink">{w.name}</p>
          <p className="m-0 mt-1 whitespace-pre-line text-[15px] text-ink">{w.message}</p>
        </li>
      ))}
    </ul>
  );
}

export function RsvpForm({
  slug,
  defaultName,
  preview,
  onSent,
}: {
  slug: string;
  defaultName: string;
  preview: boolean;
  onSent: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [attendance, setAttendance] = useState<"hadir" | "tidak_hadir">("hadir");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentAs, setSentAs] = useState<string | null>(null);

  if (sentAs) {
    return (
      <div role="status" className="py-2 text-center">
        <p className="m-0 text-[22px] font-semibold text-ink">Terima kasih, {sentAs}</p>
        <p className="m-0 mt-1 text-[15px] text-ink-soft">Konfirmasimu sudah diterima.</p>
        <Button variant="ghost" className="mt-2" onClick={() => setSentAs(null)}>
          Ubah jawaban
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4 text-left"
      onSubmit={async (e) => {
        e.preventDefault();
        if (preview) return;
        if (!name.trim()) {
          setNameError("Isi namamu dulu.");
          return;
        }
        setBusy(true);
        setError("");
        const err = await submitRsvp(slug, { name: name.trim(), attendance, guests, message: message.trim() });
        setBusy(false);
        if (err) {
          setError(err);
          return;
        }
        setSentAs(name.trim());
        setMessage("");
        onSent();
        toast("Konfirmasi terkirim.");
      }}
    >
      <TextField
        label="Nama"
        value={name}
        error={nameError}
        maxLength={60}
        autoComplete="name"
        onChange={(e) => {
          setName(e.target.value);
          setNameError("");
        }}
      />
      <Segmented
        label="Kehadiran"
        value={attendance}
        onChange={setAttendance}
        options={[
          { value: "hadir", label: "Hadir" },
          { value: "tidak_hadir", label: "Tidak hadir" },
        ]}
      />
      {attendance === "hadir" && (
        <SelectField label="Jumlah tamu yang hadir" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} orang
            </option>
          ))}
        </SelectField>
      )}
      <TextAreaField label="Ucapan dan doa (opsional)" value={message} maxLength={300} onChange={(e) => setMessage(e.target.value)} />
      {error && (
        <p role="alert" className="m-0 text-[13px] font-medium text-brand-deep">
          {error}
        </p>
      )}
      <p className="m-0 text-[13px] text-ink-soft">Nama dan ucapanmu bisa dilihat oleh pengantin dan tamu lain di daftar ucapan.</p>
      <Button type="submit" block disabled={busy || preview}>
        {preview ? "Pratinjau: pengiriman dimatikan" : busy ? "Mengirim" : "Kirim konfirmasi"}
      </Button>
    </form>
  );
}

export function Countdown({ iso }: { iso: string }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => setDays(daysUntil(iso)), [iso]);
  if (days === null || days < 0) return null;
  return <p className="m-0 mt-5 text-center text-[15px] text-ink-soft">{days === 0 ? "Hari ini" : `${days} hari lagi menuju hari bahagia`}</p>;
}

export function GiftCard({ bank, number, holder }: { bank: string; number: string; holder: string }) {
  return (
    <li className="inv-gift list-none">
      <p className="m-0 text-[15px] font-semibold text-ink">{bank || "Rekening"}</p>
      <p className="m-0 mt-1 text-[24px] font-semibold tabular-nums text-ink">{number}</p>
      {holder && <p className="m-0 text-[15px] text-ink-soft">a.n. {holder}</p>}
      <Button
        variant="secondary"
        icon="copy"
        className="mt-3"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(number.replace(/\s/g, ""));
            toast("Nomor rekening disalin.");
          } catch {
            toast("Nomor tidak bisa disalin otomatis, salin manual ya.");
          }
        }}
      >
        Salin nomor
      </Button>
    </li>
  );
}

export function Section({ id, label, title, children, orn, className = "" }: { id?: string; label: string; title: string; children: ReactNode; orn?: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const body = (
    <>
      <h2 className="inv-h">{title}</h2>
      {orn}
      {children}
    </>
  );
  const cls = `inv-sec scroll-mt-4 ${className}`;
  if (reduce) {
    return (
      <section id={id} aria-label={label} className={cls}>
        {body}
      </section>
    );
  }
  return (
    <motion.section
      id={id}
      aria-label={label}
      className={cls}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {body}
    </motion.section>
  );
}

/** Maksimal enam foto. Jumlah ganjil: foto pertama melebar supaya grid tetap rapi. */
export function Gallery({ photos }: { photos: string[] }) {
  if (!photos.length) return null;
  const wide = photos.length % 2 === 1 && photos.length > 1;
  return (
    <ul className="inv-gallery m-0 list-none p-0" data-count={photos.length}>
      {photos.map((src, i) => (
        <li key={src.slice(-24) + i} className={wide && i === 0 ? "inv-photo-wide" : undefined}>
          <GalleryPhoto src={src} alt={`Foto ${i + 1} dari galeri pernikahan`} delay={(i % 2) * 0.12} className="inv-photo" />
        </li>
      ))}
    </ul>
  );
}
