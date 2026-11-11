"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InstallButton } from "@/components/install";
import { Button, SelectField, Sheet, TextField, toast } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/labels";
import { TRACK_LABEL } from "@/lib/seed";
import { logout, updateWedding, useApp } from "@/lib/store";
import type { Track, Wedding } from "@/lib/types";

function ProfileForm({ wedding, onClose }: { wedding: Wedding; onClose: () => void }) {
  const router = useRouter();
  const role = useApp((s) => s.session?.role);
  const [bride, setBride] = useState(wedding.brideName);
  const [groom, setGroom] = useState(wedding.groomName);
  const [date, setDate] = useState(wedding.akadDate ?? "");
  const [city, setCity] = useState(wedding.city);
  const [wa, setWa] = useState(wedding.contactWa);
  const [track, setTrack] = useState<Track>(wedding.track ?? "muslim");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!bride.trim()) err.bride = "Isi nama pengantin wanita.";
    if (!groom.trim()) err.groom = "Isi nama pengantin pria.";
    setErrors(err);
    if (Object.keys(err).length) return;
    updateWedding(wedding.id, {
      brideName: bride.trim(),
      groomName: groom.trim(),
      akadDate: date || null,
      city: city.trim(),
      contactWa: wa.trim(),
      track,
    });
    toast("Profil proyek disimpan.");
    onClose();
  };

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      {role && <p className="text-sm text-ink-soft">Kamu masuk sebagai {ROLE_LABEL[role].toLowerCase()}.</p>}
      <TextField label="Nama pengantin wanita" value={bride} error={errors.bride} onChange={(e) => setBride(e.target.value)} />
      <TextField label="Nama pengantin pria" value={groom} error={errors.groom} onChange={(e) => setGroom(e.target.value)} />
      <TextField label="Tanggal akad" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <TextField label="Kota acara" value={city} onChange={(e) => setCity(e.target.value)} />
      <TextField label="Nomor WhatsApp" inputMode="tel" placeholder="08xxxxxxxxxx" value={wa} onChange={(e) => setWa(e.target.value)} />
      <SelectField
        label="Jalur pencatatan"
        hint="Mengganti jalur mengubah isi ceklis administrasi."
        value={track}
        onChange={(e) => setTrack(e.target.value as Track)}
      >
        <option value="muslim">{TRACK_LABEL.muslim}</option>
        <option value="nonmuslim">{TRACK_LABEL.nonmuslim}</option>
      </SelectField>

      <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-paper px-3 py-2">
        <div>
          <p className="text-[13px] text-ink-soft">Kode pasangan</p>
          <p className="font-serif text-xl font-semibold text-brand-deep">{wedding.code}</p>
        </div>
        <Button
          variant="secondary"
          icon="copy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(wedding.code);
              toast("Kode disalin.");
            } catch {
              toast("Kode tidak bisa disalin otomatis.");
            }
          }}
        >
          Salin
        </Button>
      </div>

      <Button type="submit" block>
        Simpan profil
      </Button>
      <InstallButton />
      <Button
        variant="ghost"
        block
        icon="logout"
        onClick={() => {
          logout();
          router.replace("/masuk");
        }}
      >
        Keluar dari akun
      </Button>
    </form>
  );
}

export function ProfileSheet({ open, onClose, wedding }: { open: boolean; onClose: () => void; wedding: Wedding }) {
  return (
    <Sheet open={open} onClose={onClose} title="Profil proyek">
      <ProfileForm wedding={wedding} onClose={onClose} />
    </Sheet>
  );
}
