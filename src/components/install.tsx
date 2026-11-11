"use client";

import { useEffect, useState } from "react";
import { promptInstall, useInstall } from "@/lib/install";
import { Button, IconButton, Sheet, toast } from "./ui";

const DISMISS_KEY = "momentum-install-dismissed-v1";
const SNOOZE_MS = 14 * 86_400_000;

function readDismissed(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY);
    return !!at && Date.now() - Number(at) < SNOOZE_MS;
  } catch {
    return false;
  }
}

export function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ios } = useInstall();
  const steps = ios
    ? [
        "Buka halaman ini di Safari. Browser di dalam aplikasi lain (Instagram, WhatsApp) tidak bisa memasang.",
        "Ketuk tombol Bagikan, ikon kotak dengan panah ke atas, di bar bawah Safari.",
        "Gulir ke bawah dan pilih Tambah ke Layar Utama.",
        "Ketuk Tambah di pojok kanan atas. Ikon Momentum muncul di layar utama.",
      ]
    : [
        "Buka halaman ini di Chrome. Browser di dalam aplikasi lain (Instagram, WhatsApp) tidak bisa memasang.",
        "Ketuk menu titik tiga di pojok kanan atas.",
        "Pilih Instal aplikasi, atau Tambahkan ke layar utama kalau pilihan pertama tidak ada.",
        "Konfirmasi. Ikon Momentum muncul di layar utama.",
      ];
  return (
    <Sheet open={open} onClose={onClose} title="Pasang di layar utama">
      <p className="text-[15px] text-ink-soft">
        Setelah terpasang, Momentum Planner terbuka layar penuh dari ikon di HP, tanpa perlu mengetik alamat web.
      </p>
      <ol className="mt-4 space-y-3">
        {steps.map((t, i) => (
          <li key={i} className="flex gap-3 text-[15px] text-ink">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-cream"
            >
              {i + 1}
            </span>
            <span className="pt-0.5">{t}</span>
          </li>
        ))}
      </ol>
      <Button variant="secondary" block className="mt-6" onClick={onClose}>
        Mengerti
      </Button>
    </Sheet>
  );
}

/** Menjalankan dialog pasang bawaan browser, atau membuka panduan kalau tidak tersedia. */
export function useInstallAction() {
  const [guide, setGuide] = useState(false);
  const run = async () => {
    const result = await promptInstall();
    if (result === "manual") setGuide(true);
    else if (result === "accepted") toast("Momentum Planner terpasang di layar utama.");
  };
  return { run, guide, closeGuide: () => setGuide(false) };
}

/** Tombol kecil yang selalu ada selama aplikasi belum terpasang. */
export function InstallButton({ className }: { className?: string }) {
  const { installed } = useInstall();
  const { run, guide, closeGuide } = useInstallAction();
  if (installed) return null;
  return (
    <>
      <Button variant="ghost" block icon="download" className={className} onClick={run}>
        Pasang di layar utama
      </Button>
      <InstallSheet open={guide} onClose={closeGuide} />
    </>
  );
}

/** Kartu ajakan di beranda. Ditutup, kembali muncul setelah 14 hari. */
export function InstallCard() {
  const { installed } = useInstall();
  const { run, guide, closeGuide } = useInstallAction();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(readDismissed());
  }, []);

  if (installed || hidden) return null;
  return (
    <aside aria-label="Pasang aplikasi" className="rounded-[14px] border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[19px] text-ink">Pasang di layar utama HP</h2>
        <IconButton
          icon="close"
          label="Tutup ajakan pasang aplikasi"
          className="-mr-2 -mt-2"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, String(Date.now()));
            } catch {
              /* hanya kenyamanan */
            }
            setHidden(true);
          }}
        />
      </div>
      <p className="mt-1 text-[15px] text-ink-soft">
        Buka Momentum Planner dari ikon di HP, layar penuh, tanpa mengetik alamat web.
      </p>
      <Button className="mt-3" icon="download" onClick={run}>
        Pasang aplikasi
      </Button>
      <InstallSheet open={guide} onClose={closeGuide} />
    </aside>
  );
}
