"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";
import { compressImage, uploadMedia } from "@/lib/media";

/** Unggah satu gambar ke folder wcc/ (atau data URL di mode demo). */
export function ImageField({ label, value, onChange, aspect = "aspect-[4/5]" }: { label: string; value: string; onChange: (url: string) => void; aspect?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const blob = await compressImage(file);
      onChange(await uploadMedia("wcc", "foto", blob, "jpg"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gambar belum terunggah.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <p className="m-0 text-[15px] font-semibold text-ink">{label}</p>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={`Pratinjau ${label.toLowerCase()}`} className={`${aspect} max-h-56 rounded-[10px] border border-line object-cover`} />
      )}
      <label className={`${buttonClass("secondary")} cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--brand)]`}>
        {busy ? "Mengunggah" : value ? "Ganti gambar" : "Pilih gambar"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={`Pilih gambar untuk ${label.toLowerCase()}`}
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p role="alert" className="m-0 text-[13px] font-medium text-brand-deep">
          {error}
        </p>
      )}
    </div>
  );
}
