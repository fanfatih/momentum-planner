"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Button, Reveal, Segmented, SelectField, TextAreaField, TextField, toast } from "@/components/ui";
import { daysUntil, mapsLink } from "@/lib/format";
import { loadWishes, submitRsvp, type WishEntry } from "@/lib/store";
import type { InvitationContent, InvitationEvent } from "@/lib/types";

const eventDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
};

const shortDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
};

function EventCard({ title, ev }: { title: string; ev: InvitationEvent }) {
  const query = ev.mapsQuery.trim() || [ev.place, ev.address].filter(Boolean).join(" ");
  return (
    <div className="rounded-[14px] border border-line bg-paper px-5 py-6 text-center">
      <h3 className="font-serif text-[24px] italic text-brand-deep">{title}</h3>
      {ev.date && <p className="mt-3 font-semibold text-ink">{eventDate(ev.date)}</p>}
      {ev.time && <p className="text-[15px] text-ink">Pukul {ev.time}</p>}
      {ev.place && <p className="mt-3 font-semibold text-ink">{ev.place}</p>}
      {ev.address && <p className="mx-auto mt-1 max-w-[30ch] whitespace-pre-line text-[15px] text-ink-soft">{ev.address}</p>}
      {query && (
        <a
          href={mapsLink(query)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-ink/55 px-4 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-cream-deep active:bg-line"
        >
          <Icon name="pin" size={18} />
          Buka peta
        </a>
      )}
    </div>
  );
}

function Wishes({ slug, refreshKey, preview }: { slug: string; refreshKey: number; preview: boolean }) {
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
    <ul className="space-y-3">
      {list.map((w) => (
        <li key={w.name + w.createdAt} className="rounded-[12px] border border-line bg-paper px-4 py-3">
          <p className="font-semibold text-ink">{w.name}</p>
          <p className="mt-1 whitespace-pre-line text-[15px] text-ink">{w.message}</p>
        </li>
      ))}
    </ul>
  );
}

function RsvpForm({ slug, defaultName, preview, onSent }: { slug: string; defaultName: string; preview: boolean; onSent: () => void }) {
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
      <div role="status" className="rounded-[14px] border border-line bg-paper px-5 py-6 text-center">
        <p className="font-serif text-[22px] text-ink">Terima kasih, {sentAs}</p>
        <p className="mt-1 text-[15px] text-ink-soft">Konfirmasimu sudah diterima.</p>
        <Button variant="ghost" className="mt-2" onClick={() => setSentAs(null)}>
          Ubah jawaban
        </Button>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
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
      <TextAreaField
        label="Ucapan dan doa (opsional)"
        value={message}
        maxLength={300}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && (
        <p role="alert" className="text-[13px] font-medium text-brand-deep">
          {error}
        </p>
      )}
      <Button type="submit" block disabled={busy || preview}>
        {preview ? "Pratinjau: pengiriman dimatikan" : busy ? "Mengirim" : "Kirim konfirmasi"}
      </Button>
    </form>
  );
}

function Countdown({ iso }: { iso: string }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => setDays(daysUntil(iso)), [iso]);
  if (days === null || days < 0) return null;
  return (
    <p className="mt-5 text-center text-[15px] text-ink-soft">
      {days === 0 ? "Hari ini" : `${days} hari lagi menuju hari bahagia`}
    </p>
  );
}

export function InvitationView({
  content: c,
  slug,
  guestName = "",
  preview = false,
}: {
  content: InvitationContent;
  slug: string;
  guestName?: string;
  preview?: boolean;
}) {
  const [wishKey, setWishKey] = useState(0);
  const bride = c.brideFull.trim() || "Mempelai wanita";
  const groom = c.groomFull.trim() || "Mempelai pria";
  const firstName = (s: string) => s.trim().split(/\s+/)[0] || s;
  const hasAkad = !!(c.akad.date || c.akad.place || c.akad.time);
  const hasResepsi = c.hasResepsi && !!(c.resepsi.date || c.resepsi.place || c.resepsi.time);
  const gifts = c.gifts.filter((g) => g.number.trim());

  return (
    <main className="phone-frame pb-14">
      {preview && (
        <p role="note" className="bg-butter px-4 py-2 text-center text-sm font-medium text-ink">
          Pratinjau. Hanya kamu yang melihat tampilan ini, tamu membukanya lewat link undangan.
        </p>
      )}

      <section aria-label="Sampul" className="px-5 pt-8">
        <div className="arch bg-brand px-6 pb-12 pt-24 text-center text-cream">
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">Undangan pernikahan</p>
          <h1 className="mt-5 font-serif text-[40px] italic leading-[1.1]">
            {firstName(bride)}
            <span className="block text-[26px] not-italic">&amp;</span>
            {firstName(groom)}
          </h1>
          {(c.akad.date || c.resepsi.date) && <p className="mt-5 text-[17px]">{shortDate(c.akad.date || c.resepsi.date)}</p>}
        </div>
        {guestName && (
          <div className="mt-6 text-center">
            <p className="text-[15px] text-ink-soft">Kepada Yth.</p>
            <p className="mt-1 break-words font-serif text-[24px] font-semibold text-ink">{guestName}</p>
          </div>
        )}
        <div className="mt-6 text-center">
          <a
            href="#acara"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-brand px-5 text-[15px] font-semibold text-cream transition-colors duration-150 hover:bg-brand-deep"
          >
            Lihat detail acara
            <Icon name="chevronDown" size={18} />
          </a>
        </div>
      </section>

      <Reveal i={1} className="px-5 pt-12 text-center">
        <p className="mx-auto max-w-[34ch] whitespace-pre-line text-[17px] leading-relaxed text-ink">
          {c.opening.trim() || "Dengan penuh syukur, kami mengundang Anda untuk hadir dan berbagi kebahagiaan di hari pernikahan kami."}
        </p>
      </Reveal>

      <section aria-label="Mempelai" className="px-5 pt-12 text-center">
        <h2 className="sr-only">Mempelai</h2>
        <p className="font-serif text-[30px] font-semibold leading-tight text-ink">{bride}</p>
        {c.brideParents && <p className="mx-auto mt-1 max-w-[32ch] text-[15px] text-ink-soft">{c.brideParents}</p>}
        <p aria-hidden="true" className="my-4 font-serif text-[28px] italic text-brand">
          &amp;
        </p>
        <p className="font-serif text-[30px] font-semibold leading-tight text-ink">{groom}</p>
        {c.groomParents && <p className="mx-auto mt-1 max-w-[32ch] text-[15px] text-ink-soft">{c.groomParents}</p>}
      </section>

      {(hasAkad || hasResepsi) && (
        <section id="acara" aria-label="Acara" className="scroll-mt-4 px-5 pt-14">
          <h2 className="text-center font-serif text-[28px]">Acara</h2>
          <div className="mt-5 space-y-4">
            {hasAkad && <EventCard title="Akad nikah" ev={c.akad} />}
            {hasResepsi && <EventCard title="Resepsi" ev={c.resepsi} />}
          </div>
          <Countdown iso={c.akad.date || c.resepsi.date} />
        </section>
      )}

      {gifts.length > 0 && (
        <section aria-label="Amplop digital" className="px-5 pt-14">
          <h2 className="text-center font-serif text-[28px]">Amplop digital</h2>
          <p className="mx-auto mt-2 max-w-[34ch] text-center text-[15px] text-ink-soft">
            Doa restu Anda sudah menjadi hadiah terbaik. Bila ingin berbagi tanda kasih, bisa melalui rekening berikut.
          </p>
          <ul className="mt-5 space-y-3">
            {gifts.map((g, i) => (
              <li key={i} className="rounded-[14px] border border-line bg-paper px-5 py-4 text-center">
                <p className="text-[15px] font-semibold text-ink">{g.bank || "Rekening"}</p>
                <p className="mt-1 font-serif text-[24px] font-semibold tabular-nums text-ink">{g.number}</p>
                {g.holder && <p className="text-[15px] text-ink-soft">a.n. {g.holder}</p>}
                <Button
                  variant="secondary"
                  icon="copy"
                  className="mt-3"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(g.number.replace(/\s/g, ""));
                      toast("Nomor rekening disalin.");
                    } catch {
                      toast("Nomor tidak bisa disalin otomatis, salin manual ya.");
                    }
                  }}
                >
                  Salin nomor
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Konfirmasi kehadiran" className="px-5 pt-14">
        <h2 className="text-center font-serif text-[28px]">Konfirmasi kehadiran</h2>
        <div className="mt-5">
          <RsvpForm slug={slug} defaultName={guestName} preview={preview} onSent={() => setWishKey((k) => k + 1)} />
        </div>
      </section>

      <section aria-label="Ucapan" className="px-5 pt-14">
        <h2 className="text-center font-serif text-[28px]">Ucapan</h2>
        <div className="mt-5">
          <Wishes slug={slug} refreshKey={wishKey} preview={preview} />
        </div>
      </section>

      <section aria-label="Penutup" className="px-5 pt-14 text-center">
        <p className="mx-auto max-w-[34ch] whitespace-pre-line text-[17px] leading-relaxed text-ink">{c.closing}</p>
        <p className="mt-6 font-serif text-[24px] italic text-brand-deep">
          {firstName(bride)} &amp; {firstName(groom)}
        </p>
      </section>

      <footer className="px-5 pt-12 text-center text-[13px] text-ink-soft">Dibuat dengan Momentum Planner</footer>
    </main>
  );
}
