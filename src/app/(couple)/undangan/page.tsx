"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { ORG_NAME, useOrgWa } from "@/components/promo";
import { PageHeader } from "@/components/shell";
import { Button, buttonClass, Card, cx, Notice, Reveal, Sheet, Tag, TextAreaField, TextField, toast } from "@/components/ui";
import { coupleLabel, isDummyWa, waLink } from "@/lib/format";
import { useCurrentWedding } from "@/lib/guard";
import { contentFromWedding, SLUG_PATTERN, suggestSlug } from "@/lib/invitation";
import { removeRsvp, saveInvitation, useApp } from "@/lib/store";
import type { Invitation, InvitationContent, InvitationEvent, Wedding } from "@/lib/types";
import { IconButton } from "@/components/ui";

const FEATURES = [
  "Halaman undangan dengan alamat sendiri, peta, dan amplop digital",
  "Link personal per tamu, nama tamu tampil di undangan",
  "RSVP dan ucapan dari tamu",
  "Bagikan lewat WhatsApp dari nomor kalian sendiri",
  "Tema Klasik, tema lain menyusul",
];

function InquirySheet({ open, onClose, wedding }: { open: boolean; onClose: () => void; wedding: Wedding }) {
  const wa = useOrgWa("momentum");
  const text = `Halo ${ORG_NAME.momentum}, kami ${coupleLabel(wedding.brideName, wedding.groomName)} ingin tanya paket Undangan Digital Premium. Dikirim dari Momentum Planner, kode proyek ${wedding.code}.`;
  return (
    <Sheet open={open} onClose={onClose} title="Tanya paket undangan premium">
      <p className="text-[15px] text-ink-soft">
        WhatsApp admin terbuka dengan pesan yang sudah terisi. Pembayaran awal dikonfirmasi lewat WhatsApp, lalu admin
        mengaktifkan paket premium di proyekmu.
      </p>
      <blockquote className="mt-4 rounded-[10px] border border-line bg-paper p-3 text-sm text-ink">{text}</blockquote>
      {isDummyWa(wa) && (
        <div className="mt-4">
          <Notice>Nomor WhatsApp {ORG_NAME.momentum} masih nomor contoh. Super Admin bisa menggantinya di menu Akun.</Notice>
        </div>
      )}
      <a
        href={waLink(wa, text)}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(buttonClass("primary", true), "mt-5")}
        onClick={onClose}
      >
        Kirim lewat WhatsApp
      </a>
    </Sheet>
  );
}

function Locked({ wedding }: { wedding: Wedding }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal i={1} className="px-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="sun">Fitur premium</Tag>
        </div>
        <h2 className="mt-3 text-[21px]">Undangan digital untuk pernikahanmu</h2>
        <p className="mt-1 text-[15px] text-ink-soft">
          Satu link undangan yang bisa dibagikan lewat WhatsApp, lengkap dengan peta lokasi dan RSVP.
        </p>
        <ul className="mt-4 space-y-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex gap-2.5 text-[15px] text-ink">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-leaf-deep" />
              {f}
            </li>
          ))}
        </ul>
        <Button className="mt-5" onClick={() => setOpen(true)}>
          Tanya paket premium
        </Button>
      </Card>
      <InquirySheet open={open} onClose={() => setOpen(false)} wedding={wedding} />
    </Reveal>
  );
}

function EventFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: InvitationEvent;
  onChange: (v: InvitationEvent) => void;
}) {
  const set = (patch: Partial<InvitationEvent>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3">
      <h3 className="text-[17px]">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Tanggal" type="date" value={value.date} onChange={(e) => set({ date: e.target.value })} />
        <TextField label="Jam" placeholder="08.00 WIB" value={value.time} onChange={(e) => set({ time: e.target.value })} />
      </div>
      <TextField label="Nama tempat" placeholder="Contoh: Gedung Serbaguna" value={value.place} onChange={(e) => set({ place: e.target.value })} />
      <TextAreaField label="Alamat" value={value.address} onChange={(e) => set({ address: e.target.value })} />
      <TextField
        label="Pencarian untuk tombol peta"
        hint="Nama tempat dan kota, persis seperti kalau dicari di Google Maps."
        value={value.mapsQuery}
        onChange={(e) => set({ mapsQuery: e.target.value })}
      />
    </div>
  );
}

function ShareLink({ slug }: { slug: string }) {
  const link = () => `${window.location.origin}/u/${slug}`;
  return (
    <>
      <Button
        variant="secondary"
        icon="copy"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link());
            toast("Link undangan disalin.");
          } catch {
            toast("Link tidak bisa disalin otomatis.");
          }
        }}
      >
        Salin link
      </Button>
      <a href={`/u/${slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
        Buka undangan
      </a>
    </>
  );
}

function RsvpSummary({ weddingId }: { weddingId: string }) {
  const all = useApp((s) => s.rsvps);
  const list = all.filter((r) => r.weddingId === weddingId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hadir = list.filter((r) => r.attendance === "hadir");
  const people = hadir.reduce((n, r) => n + r.guests, 0);
  return (
    <section aria-label="Respons tamu" className="space-y-3 px-5 pt-8">
      <h2 className="text-[19px]">Respons tamu</h2>
      {list.length === 0 ? (
        <p className="text-[15px] text-ink-soft">Belum ada tamu yang mengisi konfirmasi.</p>
      ) : (
        <>
          <p className="text-[15px] text-ink">
            {hadir.length} konfirmasi hadir ({people} orang), {list.length - hadir.length} tidak hadir.
          </p>
          <ul className="divide-y divide-line rounded-[14px] border border-line bg-paper">
            {list.map((r) => (
              <li key={r.id} className="flex items-start gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {r.name} <span className="font-normal text-ink-soft">{r.attendance === "hadir" ? `hadir, ${r.guests} orang` : "tidak hadir"}</span>
                  </p>
                  {r.message && <p className="mt-0.5 whitespace-pre-line text-[15px] text-ink-soft">{r.message}</p>}
                </div>
                <IconButton icon="trash" label={`Hapus respons ${r.name}`} className="-mr-2 -mt-1" onClick={() => removeRsvp(r.id)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Editor({ wedding, existing }: { wedding: Wedding; existing: Invitation | null }) {
  const [slug, setSlug] = useState(existing?.slug ?? suggestSlug(wedding));
  const [c, setC] = useState<InvitationContent>(existing?.content ?? contentFromWedding(wedding));
  const [slugError, setSlugError] = useState("");
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(existing?.published ?? false);
  const set = (patch: Partial<InvitationContent>) => setC((prev) => ({ ...prev, ...patch }));

  const setGift = (i: number, patch: Partial<InvitationContent["gifts"][number]>) =>
    set({ gifts: c.gifts.map((g, j) => (j === i ? { ...g, ...patch } : g)) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();
    if (clean.length < 3 || clean.length > 40 || !SLUG_PATTERN.test(clean)) {
      setSlugError("Pakai 3 sampai 40 huruf kecil, angka, atau tanda hubung. Contoh: aulia-raka.");
      return;
    }
    setBusy(true);
    const result = await saveInvitation({
      weddingId: wedding.id,
      slug: clean,
      theme: existing?.theme ?? "klasik",
      published,
      content: { ...c, gifts: c.gifts.filter((g) => g.number.trim()) },
    });
    setBusy(false);
    if (result === "taken") {
      setSlugError("Alamat ini sudah dipakai pasangan lain. Coba tambahkan nama kota atau tahun.");
      return;
    }
    if (result === "ok") {
      setSlug(clean);
      toast("Isi undangan disimpan.");
    }
  };

  return (
    <form onSubmit={save} noValidate className="space-y-7 px-5">
      <section aria-label="Status undangan" className="space-y-3">
        <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-[15px]">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <span>
            <span className="block font-semibold text-ink">Aktifkan undangan</span>
            <span className="block text-ink-soft">Kalau aktif, siapa pun yang punya link bisa membukanya. Simpan setelah mengubah.</span>
          </span>
        </label>
        {existing && (
          <div className="flex flex-wrap gap-2">
            <Link href="/pratinjau-undangan" className={buttonClass("secondary")}>
              Pratinjau
            </Link>
            {existing.published && <ShareLink slug={existing.slug} />}
          </div>
        )}
      </section>

      <section className="space-y-3" aria-label="Alamat undangan">
        <h2 className="text-[19px]">Alamat undangan</h2>
        <TextField
          label="Nama di alamat"
          value={slug}
          error={slugError}
          hint={slugError ? undefined : `Alamat undangan: /u/${slug.trim() || "nama-kalian"}`}
          autoCapitalize="none"
          autoComplete="off"
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugError("");
          }}
        />
      </section>

      <section className="space-y-3" aria-label="Mempelai">
        <h2 className="text-[19px]">Mempelai</h2>
        <TextField label="Nama lengkap mempelai wanita" value={c.brideFull} onChange={(e) => set({ brideFull: e.target.value })} />
        <TextField
          label="Orang tua mempelai wanita"
          placeholder="Putri dari Bapak ... dan Ibu ..."
          value={c.brideParents}
          onChange={(e) => set({ brideParents: e.target.value })}
        />
        <TextField label="Nama lengkap mempelai pria" value={c.groomFull} onChange={(e) => set({ groomFull: e.target.value })} />
        <TextField
          label="Orang tua mempelai pria"
          placeholder="Putra dari Bapak ... dan Ibu ..."
          value={c.groomParents}
          onChange={(e) => set({ groomParents: e.target.value })}
        />
        <TextAreaField
          label="Kata pembuka (opsional)"
          placeholder="Ayat, doa, atau kalimat sendiri"
          value={c.opening}
          onChange={(e) => set({ opening: e.target.value })}
        />
      </section>

      <section aria-label="Acara" className="space-y-6">
        <h2 className="text-[19px]">Acara</h2>
        <EventFields title="Akad nikah" value={c.akad} onChange={(akad) => set({ akad })} />
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
          <input
            type="checkbox"
            className="size-5 shrink-0 accent-[var(--brand)]"
            checked={c.hasResepsi}
            onChange={(e) => set({ hasResepsi: e.target.checked })}
          />
          Ada resepsi terpisah dari akad
        </label>
        {c.hasResepsi && <EventFields title="Resepsi" value={c.resepsi} onChange={(resepsi) => set({ resepsi })} />}
      </section>

      <section aria-label="Amplop digital" className="space-y-3">
        <h2 className="text-[19px]">Amplop digital (opsional)</h2>
        {c.gifts.map((g, i) => (
          <div key={i} className="space-y-3 rounded-[12px] border border-line bg-paper p-3">
            <TextField label="Bank atau e-wallet" placeholder="BCA" value={g.bank} onChange={(e) => setGift(i, { bank: e.target.value })} />
            <TextField label="Nomor rekening" inputMode="numeric" value={g.number} onChange={(e) => setGift(i, { number: e.target.value })} />
            <TextField label="Atas nama" value={g.holder} onChange={(e) => setGift(i, { holder: e.target.value })} />
            <Button variant="ghost" icon="trash" onClick={() => set({ gifts: c.gifts.filter((_, j) => j !== i) })}>
              Hapus rekening ini
            </Button>
          </div>
        ))}
        {c.gifts.length < 2 && (
          <Button variant="secondary" block icon="plus" onClick={() => set({ gifts: [...c.gifts, { bank: "", number: "", holder: "" }] })}>
            Tambah rekening
          </Button>
        )}
      </section>

      <section aria-label="Penutup" className="space-y-3">
        <TextAreaField label="Kalimat penutup" value={c.closing} onChange={(e) => set({ closing: e.target.value })} />
      </section>

      <Button type="submit" block disabled={busy}>
        {busy ? "Menyimpan" : "Simpan isi undangan"}
      </Button>
    </form>
  );
}

export default function UndanganPage() {
  const wedding = useCurrentWedding();
  const invitations = useApp((s) => s.invitations);
  if (!wedding) return null;
  const existing = invitations.find((i) => i.weddingId === wedding.id) ?? null;

  return (
    <>
      <PageHeader
        title="Undangan digital"
        lead={wedding.plan === "premium" ? "Isi undanganmu" : undefined}
        action={
          <Link href="/beranda" className={buttonClass("ghost")}>
            Beranda
          </Link>
        }
      />
      {wedding.plan === "premium" ? (
        <>
          <Editor key={wedding.id} wedding={wedding} existing={existing} />
          <RsvpSummary weddingId={wedding.id} />
        </>
      ) : (
        <Locked wedding={wedding} />
      )}
    </>
  );
}
