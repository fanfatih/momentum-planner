"use client";

import { useState } from "react";
import { buttonClass, Button, TextField } from "@/components/ui";
import { MAX_PHOTOS } from "@/lib/invitation";
import { compressImage, MUSIC_LIMIT, MUSIC_LIMIT_LABEL, uploadMedia } from "@/lib/media";

const pickClass = `${buttonClass("secondary")} w-full cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--brand)]`;

export function PhotoFields({ weddingId, photos, onChange }: { weddingId: string; photos: string[]; onChange: (next: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const room = MAX_PHOTOS - photos.length;

  const add = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError("");
    setBusy(true);
    const added: string[] = [];
    try {
      for (const f of Array.from(files).slice(0, room)) {
        const blob = await compressImage(f);
        added.push(await uploadMedia(weddingId, "foto", blob, "jpg"));
      }
      if (files.length > room) setError(`Maksimal ${MAX_PHOTOS} foto. Sisanya tidak ditambahkan.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Foto belum terunggah.");
    }
    if (added.length) onChange([...photos, ...added]);
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <p className="m-0 text-[14px] text-ink-soft">
        Foto prewedding atau foto berdua, maksimal {MAX_PHOTOS}. Foto dikecilkan otomatis. Ubah dan hapus baru berlaku setelah menekan Simpan isi undangan.
      </p>
      {photos.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
          {photos.map((src, i) => (
            <li key={src.slice(-24) + i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Foto galeri ${i + 1}`} className="aspect-[3/4] w-full rounded-[10px] border border-line object-cover" />
              <button
                type="button"
                aria-label={`Hapus foto ${i + 1}`}
                onClick={() => onChange(photos.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 grid size-11 place-items-center rounded-full bg-paper/90 text-[18px] font-semibold text-ink shadow-sm"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {room > 0 && (
        <label className={pickClass}>
          {busy ? "Mengunggah foto" : photos.length ? "Tambah foto" : "Pilih foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            aria-label="Pilih foto galeri"
            className="sr-only"
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="m-0 text-[13px] font-medium text-brand-deep">
          {error}
        </p>
      )}
    </div>
  );
}

export function MusicFields({
  weddingId,
  url,
  title,
  onChange,
}: {
  weddingId: string;
  url: string;
  title: string;
  onChange: (next: { musicUrl: string; musicTitle: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    const ext = /\.m4a$/i.test(file.name) ? "m4a" : "mp3";
    if (!/^audio\/(mpeg|mp3|mp4|x-m4a|m4a)$/.test(file.type) && !/\.(mp3|m4a)$/i.test(file.name)) {
      setError("Pakai file MP3 atau M4A.");
      return;
    }
    if (file.size > MUSIC_LIMIT) {
      setError(`File terlalu besar. Maksimal ${MUSIC_LIMIT_LABEL}.`);
      return;
    }
    setBusy(true);
    try {
      const blob = file.type ? file : new Blob([file], { type: ext === "m4a" ? "audio/mp4" : "audio/mpeg" });
      const musicUrl = await uploadMedia(weddingId, "musik", blob, ext);
      onChange({ musicUrl, musicTitle: title || file.name.replace(/\.[^.]+$/, "").slice(0, 60) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Musik belum terunggah.");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <p className="m-0 text-[14px] text-ink-soft">
        Musik mulai saat tamu menekan Buka undangan, dan tamu bisa menjedanya. Pastikan kamu berhak memakai lagunya. Lagu berhak cipta sebaiknya diganti musik bebas royalti.
      </p>
      {url ? (
        <div className="space-y-3 rounded-[12px] border border-line bg-paper p-3">
          <TextField label="Judul lagu (opsional)" value={title} maxLength={60} onChange={(e) => onChange({ musicUrl: url, musicTitle: e.target.value })} />
          <audio controls preload="none" src={url} aria-label="Dengarkan musik latar" className="w-full" />
          <Button variant="ghost" icon="trash" onClick={() => onChange({ musicUrl: "", musicTitle: "" })}>
            Hapus musik
          </Button>
        </div>
      ) : (
        <label className={pickClass}>
          {busy ? "Mengunggah musik" : "Pilih file musik"}
          <input
            type="file"
            accept="audio/mpeg,audio/mp4,.mp3,.m4a"
            disabled={busy}
            aria-label="Pilih file musik"
            className="sr-only"
            onChange={(e) => {
              void add(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {!url && <p className="m-0 text-[13px] text-ink-soft">MP3 atau M4A, maksimal {MUSIC_LIMIT_LABEL}.</p>}
      {error && (
        <p role="alert" className="m-0 text-[13px] font-medium text-brand-deep">
          {error}
        </p>
      )}
    </div>
  );
}
