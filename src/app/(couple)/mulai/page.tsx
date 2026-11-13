"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Monogram } from "@/components/Logo";
import { Button, buttonClass, cx, ProgressBar, TextField, toast } from "@/components/ui";
import { waLink } from "@/lib/format";
import { modeOf, useCurrentWedding } from "@/lib/guard";
import { TRACK_LABEL } from "@/lib/seed";
import { updateWedding } from "@/lib/store";
import type { AppMode, Track } from "@/lib/types";

const TRACKS: { value: Track; body: string }[] = [
  { value: "muslim", body: "Ceklis dokumen dan pendaftaran nikah di KUA." },
  { value: "nonmuslim", body: "Ceklis pencatatan perkawinan di Disdukcapil." },
];

const MODES: { value: AppMode; title: string; body: string }[] = [
  { value: "planner", title: "Planner lengkap", body: "Ceklis dokumen, budget, vendor, daftar tamu, dan undangan digital." },
  { value: "undangan", title: "Undangan digital saja", body: "Pilih tema, isi undangan, kirim ke tamu lewat WhatsApp, dan kumpulkan RSVP." },
];

type StepKey = "mode" | "names" | "track" | "when";
const STEP_TITLE: Record<StepKey, string> = {
  mode: "Mau pakai yang mana?",
  names: "Siapa yang menikah?",
  track: "Pilih jalur pencatatan",
  when: "Kapan dan di mana?",
};

export default function MulaiPage() {
  const wedding = useCurrentWedding();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [needMode] = useState(() => !!wedding && !modeOf(wedding));
  const [needNames] = useState(() => !!wedding && !(wedding.brideName && wedding.groomName));
  const [mode, setMode] = useState<AppMode | null>(wedding ? modeOf(wedding) : null);
  const [bride, setBride] = useState(wedding?.brideName ?? "");
  const [groom, setGroom] = useState(wedding?.groomName ?? "");
  const [wa, setWa] = useState(wedding?.contactWa ?? "");
  const [track, setTrack] = useState<Track | null>(wedding?.track ?? null);
  const [date, setDate] = useState(wedding?.akadDate ?? "");
  const [city, setCity] = useState(wedding?.city ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = useMemo<StepKey[]>(() => {
    const out: StepKey[] = [];
    if (needMode) out.push("mode");
    if (needNames) out.push("names");
    if (mode === "planner" && !wedding?.track) out.push("track");
    if (needNames) out.push("when");
    return out;
  }, [needMode, needNames, mode, wedding?.track]);

  if (!wedding) return null;
  const key = steps[step];

  const finish = () => {
    updateWedding(wedding.id, {
      mode,
      ...(needNames
        ? { brideName: bride.trim(), groomName: groom.trim(), contactWa: wa.trim(), akadDate: date || null, city: city.trim() }
        : {}),
      ...(mode === "planner" ? { track } : {}),
    });
    setDone(true);
  };

  const next = () => {
    if (key === "mode" && !mode) {
      setErrors({ mode: "Pilih salah satu dulu." });
      return;
    }
    if (key === "names") {
      const e: Record<string, string> = {};
      if (!bride.trim()) e.bride = "Isi nama pengantin wanita.";
      if (!groom.trim()) e.groom = "Isi nama pengantin pria.";
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    if (key === "track" && !track) {
      setErrors({ track: "Pilih salah satu jalur dulu." });
      return;
    }
    setErrors({});
    if (step === steps.length - 1) finish();
    else setStep(step + 1);
  };

  if (done) {
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
          <Link href={mode === "undangan" ? "/undangan" : "/beranda"} className={buttonClass("ghost", true)}>
            {mode === "undangan" ? "Lanjut ke undangan" : "Lanjut ke beranda"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8">
      <p className="text-sm font-semibold text-ink-soft">
        Langkah {step + 1} dari {steps.length}
      </p>
      <div className="mt-2">
        <ProgressBar value={((step + 1) / steps.length) * 100} label="Kemajuan pengisian" />
      </div>
      <h1 className="mt-6 text-[28px]">{STEP_TITLE[key]}</h1>

      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        {key === "mode" && (
          <fieldset>
            <legend className="text-[15px] text-ink-soft">Bisa diganti nanti. Data yang sudah kamu isi tidak hilang.</legend>
            <div className="mt-4 space-y-3">
              {MODES.map((m) => (
                <label
                  key={m.value}
                  className={cx(
                    "flex min-h-16 items-start gap-3 rounded-[14px] border p-4 transition-colors duration-150",
                    mode === m.value ? "border-brand bg-brand-tint" : "border-ink/55 bg-paper hover:bg-cream-deep",
                  )}
                >
                  <input type="radio" name="mode" className="mt-1 size-5 accent-[var(--brand)]" checked={mode === m.value} onChange={() => setMode(m.value)} />
                  <span>
                    <span className="block font-semibold text-ink">{m.title}</span>
                    <span className="block text-sm text-ink-soft">{m.body}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.mode && (
              <p role="alert" className="mt-3 text-[13px] font-semibold text-brand-deep">
                {errors.mode}
              </p>
            )}
          </fieldset>
        )}

        {key === "names" && (
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

        {key === "track" && (
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

        {key === "when" && (
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
            {step === steps.length - 1 ? "Simpan dan buat proyek" : "Lanjut"}
          </Button>
        </div>
      </form>
    </div>
  );
}
