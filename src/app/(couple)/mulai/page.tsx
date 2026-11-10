"use client";

import Link from "next/link";
import { useState } from "react";
import { Monogram } from "@/components/Logo";
import { Button, buttonClass, cx, ProgressBar, TextField, toast } from "@/components/ui";
import { waLink } from "@/lib/format";
import { useCurrentWedding } from "@/lib/guard";
import { TRACK_LABEL } from "@/lib/seed";
import { updateWedding } from "@/lib/store";
import type { Track } from "@/lib/types";

const TRACKS: { value: Track; body: string }[] = [
  { value: "muslim", body: "Ceklis dokumen dan pendaftaran nikah di KUA." },
  { value: "nonmuslim", body: "Ceklis pencatatan perkawinan di Disdukcapil." },
];

const STEP_TITLE = ["Siapa yang menikah?", "Pilih jalur pencatatan", "Kapan dan di mana?"];

export default function MulaiPage() {
  const wedding = useCurrentWedding();
  const [step, setStep] = useState(0);
  const [bride, setBride] = useState(wedding?.brideName ?? "");
  const [groom, setGroom] = useState(wedding?.groomName ?? "");
  const [wa, setWa] = useState(wedding?.contactWa ?? "");
  const [track, setTrack] = useState<Track | null>(wedding?.track ?? null);
  const [date, setDate] = useState(wedding?.akadDate ?? "");
  const [city, setCity] = useState(wedding?.city ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!wedding) return null;

  const next = () => {
    if (step === 0) {
      const e: Record<string, string> = {};
      if (!bride.trim()) e.bride = "Isi nama pengantin wanita.";
      if (!groom.trim()) e.groom = "Isi nama pengantin pria.";
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (step === 1 && !track) {
      setErrors({ track: "Pilih salah satu jalur dulu." });
      return;
    }
    if (step === 2) {
      updateWedding(wedding.id, {
        brideName: bride.trim(),
        groomName: groom.trim(),
        contactWa: wa.trim(),
        track,
        akadDate: date || null,
        city: city.trim(),
      });
    }
    setErrors({});
    setStep(step + 1);
  };

  if (step === 3) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const invite = `Yuk gabung di Momentum Planner. Buka ${origin}, pilih "Gabung ke proyek pasangan", lalu masukkan kode ${wedding.code}.`;
    return (
      <div className="px-5 pt-10 text-center">
        <Monogram size={52} className="mx-auto" radius={12} />
        <h1 className="mt-5 text-[28px]">Proyek kalian sudah siap</h1>
        <p className="mx-auto mt-2 max-w-[30ch] text-[15px] text-ink-soft">
          Bagikan kode ini supaya pasanganmu bisa membuka proyek yang sama dari akunnya.
        </p>
        <div className="arch mx-auto mt-7 w-56 border border-line bg-paper px-4 pb-6 pt-14">
          <p className="text-sm text-ink-soft">Kode pasangan</p>
          <p className="mt-1 font-serif text-[30px] font-semibold tracking-wide text-brand-deep">{wedding.code}</p>
        </div>
        <div className="mt-7 space-y-3">
          <a href={waLink("", invite)} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", true)}>
            Kirim kode lewat WhatsApp
          </a>
          <Button
            variant="secondary"
            block
            icon="copy"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(wedding.code);
                toast("Kode disalin.");
              } catch {
                toast("Kode tidak bisa disalin otomatis. Catat manual, ya.");
              }
            }}
          >
            Salin kode
          </Button>
          <Link href="/beranda" className={buttonClass("ghost", true)}>
            Lanjut ke beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8">
      <p className="text-sm font-semibold text-ink-soft">Langkah {step + 1} dari 3</p>
      <div className="mt-2">
        <ProgressBar value={((step + 1) / 3) * 100} label="Kemajuan pengisian" />
      </div>
      <h1 className="mt-6 text-[28px]">{STEP_TITLE[step]}</h1>

      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        {step === 0 && (
          <>
            <TextField
              label="Nama pengantin wanita"
              autoComplete="off"
              value={bride}
              error={errors.bride}
              onChange={(e) => setBride(e.target.value)}
            />
            <TextField
              label="Nama pengantin pria"
              autoComplete="off"
              value={groom}
              error={errors.groom}
              onChange={(e) => setGroom(e.target.value)}
            />
            <TextField
              label="Nomor WhatsApp (opsional)"
              hint="Dipakai admin Mahesa atau Momentum untuk menghubungi kalian setelah deal."
              inputMode="tel"
              placeholder="08xxxxxxxxxx"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
            />
          </>
        )}

        {step === 1 && (
          <fieldset>
            <legend className="text-[15px] text-ink-soft">
              Jalur menentukan isi ceklis dokumen. Bisa diganti nanti dari profil.
            </legend>
            <div className="mt-4 space-y-3">
              {TRACKS.map((t) => (
                <label
                  key={t.value}
                  className={cx(
                    "flex min-h-16 items-start gap-3 rounded-[14px] border p-4 transition-colors duration-150",
                    track === t.value ? "border-brand bg-brand-tint" : "border-ink/55 bg-paper hover:bg-cream-deep",
                  )}
                >
                  <input
                    type="radio"
                    name="track"
                    className="mt-1 size-5 accent-[var(--brand)]"
                    checked={track === t.value}
                    onChange={() => setTrack(t.value)}
                  />
                  <span>
                    <span className="block font-semibold text-ink">{TRACK_LABEL[t.value]}</span>
                    <span className="block text-sm text-ink-soft">{t.body}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.track && (
              <p role="alert" className="mt-3 text-[13px] font-semibold text-brand-deep">
                {errors.track}
              </p>
            )}
          </fieldset>
        )}

        {step === 2 && (
          <>
            <TextField
              label="Tanggal akad (opsional)"
              hint="Boleh dikosongkan dulu. Hitung mundur muncul setelah tanggal diisi."
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <TextField
              label="Kota acara (opsional)"
              placeholder="Contoh: Kota Bogor"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </>
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              Kembali
            </Button>
          )}
          <Button type="submit" className="flex-1">
            {step === 2 ? "Simpan dan buat proyek" : "Lanjut"}
          </Button>
        </div>
      </form>
    </div>
  );
}
