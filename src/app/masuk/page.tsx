"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { InstallButton } from "@/components/install";
import { Monogram, Wordmark } from "@/components/Logo";
import { DemoRibbon, StorageNotice } from "@/components/shell";
import { Button, LoadingState, Notice, Reveal, Segmented, TextField, toast } from "@/components/ui";
import { COUPLE_ROLES, homeFor } from "@/lib/guard";
import { REMOTE } from "@/lib/mode";
import { joinWedding, login, logout, resetDemo, signInWithGoogle, startNewCouple, useApp, useMeta } from "@/lib/store";
import type { CoupleSide, Role } from "@/lib/types";

const TEAM: { role: Role; label: string; note: string }[] = [
  { role: "admin_mahesa", label: "Admin Mahesa", note: "Proyek yang tertaut ke Mahesa Weddings" },
  { role: "admin_momentum", label: "Admin Momentum", note: "Proyek dengan paket WCC" },
  { role: "super_admin", label: "Super Admin", note: "Semua proyek, katalog, iklan, dan akun" },
];

export default function MasukPage() {
  const router = useRouter();
  const { hydrated, authed, email } = useMeta();
  const session = useApp((s) => s.session);
  const [side, setSide] = useState<CoupleSide>("bride");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");

  // Mode database: yang sudah punya proyek (atau akun admin) langsung masuk ke halamannya.
  const pendingCouple = !!session && COUPLE_ROLES.includes(session.role) && !session.weddingId;
  useEffect(() => {
    if (REMOTE && hydrated && authed && session && !pendingCouple) router.replace(homeFor(session.role));
  }, [hydrated, authed, session, pendingCouple, router]);

  const enter = (role: Role) => {
    login(role);
    router.push(homeFor(role));
  };

  const google = async () => {
    setBusy(true);
    setGoogleError("");
    const err = await signInWithGoogle();
    if (err) {
      setGoogleError(err);
      setBusy(false);
    }
  };

  const create = async () => {
    setBusy(true);
    const id = await startNewCouple(side);
    setBusy(false);
    if (id) router.push("/mulai");
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setCodeError("Isi kode dari pasanganmu dulu.");
      return;
    }
    setBusy(true);
    const result = await joinWedding(code, side);
    setBusy(false);
    if (result === "notfound") {
      setCodeError("Kode ini tidak ditemukan. Cek lagi huruf dan angkanya.");
      return;
    }
    if (result === "taken") {
      setCodeError("Sisi itu sudah terisi di proyek tersebut. Pilih sisi pengantin yang satunya.");
      return;
    }
    if (result === "ok") router.push("/beranda");
  };

  const showGoogle = REMOTE && !authed;
  const showDemo = !REMOTE;
  const showCouple = REMOTE ? pendingCouple : true;

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

      {REMOTE && !hydrated && <LoadingState what="akunmu" />}

      {showGoogle && hydrated && (
        <Reveal i={1} className="px-5 pt-6">
          <Button block disabled={busy} onClick={google}>
            Masuk dengan Google
          </Button>
          {googleError ? (
            <p role="alert" className="mt-2 text-[13px] font-medium text-brand-deep">
              {googleError}
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-ink-soft">
              Pengantin baru otomatis terdaftar saat pertama masuk. Admin Mahesa dan Momentum masuk dengan email yang
              sudah didaftarkan.
            </p>
          )}
        </Reveal>
      )}

      {!REMOTE && (
        <Reveal i={1} className="px-5 pt-6">
          <Button variant="secondary" block disabled aria-describedby="google-note">
            Masuk dengan Google
          </Button>
          <p id="google-note" className="mt-2 text-[13px] text-ink-soft">
            Belum aktif di versi demo. Login Google menyala setelah database Supabase tersambung.
          </p>
        </Reveal>
      )}

      {REMOTE && pendingCouple && (
        <Reveal i={1} className="px-5 pt-6">
          <Notice>
            Masuk sebagai {email}. Satu langkah lagi: buat proyek baru atau gabung ke proyek pasanganmu.
          </Notice>
        </Reveal>
      )}

      {showDemo && (
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
      )}

      {showCouple && hydrated && (
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
            disabled={!hydrated || busy}
            onClick={create}
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
          <Button type="submit" variant="secondary" block disabled={!hydrated || busy}>
            Gabung ke proyek pasangan
          </Button>
        </form>
        {REMOTE && (
          <Button variant="ghost" block className="mt-3" onClick={logout}>
            Pakai akun Google lain
          </Button>
        )}
      </Reveal>
      )}

      <div className="px-5 pt-4">
        <InstallButton />
      </div>

      {showDemo && (
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
      )}

      {showDemo && (
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
      )}
    <nav aria-label="Dokumen" className="mt-10 flex justify-center gap-5 px-5 text-[14px] text-ink-soft">
        <Link href="/privasi" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Kebijakan privasi
        </Link>
        <Link href="/ketentuan" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Ketentuan layanan
        </Link>
      </nav>
    </main>
  );
}
