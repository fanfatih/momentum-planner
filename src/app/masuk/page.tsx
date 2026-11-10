"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Monogram, Wordmark } from "@/components/Logo";
import { DemoRibbon, StorageNotice } from "@/components/shell";
import { Button, Reveal, Segmented, TextField, toast } from "@/components/ui";
import { homeFor } from "@/lib/guard";
import { joinWedding, login, resetDemo, startNewCouple, useMeta } from "@/lib/store";
import type { CoupleSide, Role } from "@/lib/types";

const TEAM: { role: Role; label: string; note: string }[] = [
  { role: "admin_mahesa", label: "Admin Mahesa", note: "Proyek yang tertaut ke Mahesa Weddings" },
  { role: "admin_momentum", label: "Admin Momentum", note: "Proyek dengan paket WCC" },
  { role: "super_admin", label: "Super Admin", note: "Semua proyek, katalog, iklan, dan akun" },
];

export default function MasukPage() {
  const router = useRouter();
  const { hydrated } = useMeta();
  const [side, setSide] = useState<CoupleSide>("bride");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const enter = (role: Role) => {
    login(role);
    router.push(homeFor(role));
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setCodeError("Isi kode dari pasanganmu dulu.");
      return;
    }
    if (!joinWedding(code, side)) {
      setCodeError("Kode ini tidak ditemukan. Cek lagi huruf dan angkanya.");
      return;
    }
    router.push("/beranda");
  };

  return (
    <main className="phone-frame pb-12">
      <DemoRibbon />
      <StorageNotice />

      <Reveal className="px-5 pt-8">
        <div className="arch bg-brand px-6 pb-9 pt-20 text-center text-cream">
          <Monogram size={60} bg="var(--cream)" mark="var(--brand)" radius={14} className="mx-auto" />
          <Wordmark className="mx-auto mt-6 h-7 w-auto" />
          <p className="mt-1 font-serif text-xl italic">Planner</p>
        </div>
        <h1 className="mt-7 text-[30px] text-ink">Siapkan pernikahan tanpa ada yang terlewat</h1>
        <p className="mt-2 text-[15px] text-ink-soft">
          Ceklis dokumen KUA dan Catatan Sipil, budget, vendor, venue, dan daftar tamu dalam satu aplikasi.
        </p>
      </Reveal>

      <Reveal i={1} className="px-5 pt-6">
        <Button variant="secondary" block disabled aria-describedby="google-note">
          Masuk dengan Google
        </Button>
        <p id="google-note" className="mt-2 text-[13px] text-ink-soft">
          Belum aktif. Login Google menyala setelah database Supabase tersambung.
        </p>
      </Reveal>

      <Reveal i={2} className="px-5 pt-8">
        <h2 className="text-[21px]">Lihat proyek contoh</h2>
        <p className="mt-1 text-[15px] text-ink-soft">Dua akun pengantin membuka proyek yang sama.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button disabled={!hydrated} onClick={() => enter("bride")}>
            Pengantin wanita
          </Button>
          <Button disabled={!hydrated} onClick={() => enter("groom")}>
            Pengantin pria
          </Button>
        </div>
      </Reveal>

      <Reveal i={3} className="px-5 pt-8">
        <h2 className="text-[21px]">Pasangan baru</h2>
        <p className="mt-1 text-[15px] text-ink-soft">Mulai dari proyek kosong, atau gabung ke proyek pasanganmu.</p>
        <div className="mt-3 space-y-3">
          <Segmented
            label="Saya pengantin"
            value={side}
            onChange={setSide}
            options={[
              { value: "bride", label: "Saya pengantin wanita" },
              { value: "groom", label: "Saya pengantin pria" },
            ]}
          />
          <Button
            variant="secondary"
            block
            disabled={!hydrated}
            onClick={() => {
              startNewCouple(side);
              router.push("/mulai");
            }}
          >
            Buat proyek baru
          </Button>
        </div>
        <form onSubmit={join} className="mt-5 space-y-3" noValidate>
          <TextField
            label="Kode dari pasangan"
            placeholder="MOM-XXXX"
            autoCapitalize="characters"
            autoComplete="off"
            value={code}
            error={codeError}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeError("");
            }}
          />
          <Button type="submit" variant="secondary" block disabled={!hydrated}>
            Gabung ke proyek pasangan
          </Button>
        </form>
      </Reveal>

      <Reveal i={4} className="px-5 pt-8">
        <h2 className="text-[21px]">Tim Mahesa dan Momentum</h2>
        <ul className="mt-3 divide-y divide-line rounded-[14px] border border-line bg-paper">
          {TEAM.map((t) => (
            <li key={t.role}>
              <button
                type="button"
                disabled={!hydrated}
                onClick={() => enter(t.role)}
                className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-cream-deep active:bg-line disabled:opacity-45"
              >
                <span>
                  <span className="block font-semibold text-ink">{t.label}</span>
                  <span className="block text-[13px] text-ink-soft">{t.note}</span>
                </span>
                <Icon name="chevronRight" size={18} className="shrink-0 text-ink-soft" />
              </button>
            </li>
          ))}
        </ul>
      </Reveal>

      <div className="px-5 pt-8">
        <Button
          variant="ghost"
          block
          onClick={() => {
            resetDemo();
            toast("Data demo dikembalikan ke kondisi awal.");
          }}
        >
          Kembalikan data demo ke awal
        </Button>
      </div>
    </main>
  );
}
