"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { coupleLabel, formatDate, isDummyWa, waLink } from "@/lib/format";
import { buildChecklist, createRequest, dismissPromo, setLink, useApp } from "@/lib/store";
import type { OrgKey, PromoCard, Wedding } from "@/lib/types";
import { Button, buttonClass, cx, IconButton, Notice, Sheet, Tag, TextAreaField, toast } from "./ui";

export const ORG_NAME: Record<OrgKey, string> = {
  mahesa: "Mahesa Weddings",
  momentum: "Momentum by Luna",
};

const orgOf = (p: PromoCard): OrgKey => (p.target === "mahesa" ? "mahesa" : "momentum");

const sameDay = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

const CLOSED_KEY = "momentum-promo-closed-v1";
const FIRST_DELAY_MS = 1500;
const NEXT_DELAY_MS = 8000;

function readClosed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(CLOSED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * Iklan melayang di atas menu bawah. Satu per satu: tombol X menutup untuk sesi ini lalu iklan lain (kalau ada)
 * muncul beberapa detik kemudian, dan kotak centang menyembunyikan iklan itu sampai besok.
 * Iklan terkait ceklis hanya tampil di layar Ceklis selama itemnya belum selesai.
 */
export function PromoPopup({ wedding }: { wedding: Wedding }) {
  const pathname = usePathname();
  const promos = useApp((s) => s.promos);
  const dismissed = useApp((s) => s.dismissed);
  const templates = useApp((s) => s.templates);
  const entries = useApp((s) => s.checklist);
  const [closed, setClosed] = useState<string[]>([]);
  const [shown, setShown] = useState<string | null>(null);
  const [sheetFor, setSheetFor] = useState<PromoCard | null>(null);
  const [hiding, setHiding] = useState<string | null>(null);
  const gap = useRef(FIRST_DELAY_MS);

  useEffect(() => setClosed(readClosed()), []);

  const eligible = useMemo(() => {
    if (pathname === "/mulai") return [];
    const rows = pathname === "/ceklis" ? buildChecklist(templates, entries, wedding.id, wedding.track) : [];
    return promos
      .filter((p) => {
        if (!p.active || wedding[orgOf(p)] !== "none") return false;
        if (closed.includes(p.id)) return false;
        const at = dismissed[p.id];
        if (at && sameDay(at)) return false;
        if (p.trigger === "beranda") return true;
        return rows.some((r) => !r.done && !r.hidden && r.promo === p.trigger);
      })
      .sort((a, b) => Number(a.trigger === "beranda") - Number(b.trigger === "beranda"));
  }, [promos, dismissed, closed, pathname, templates, entries, wedding]);

  const currentId = eligible[0]?.id ?? null;
  // Pindah layar: iklan yang sesuai layar baru boleh menggantikan yang sedang tampil setelah jeda singkat.
  useEffect(() => {
    gap.current = FIRST_DELAY_MS;
  }, [pathname]);
  useEffect(() => {
    if (!currentId || shown === currentId) return;
    const t = setTimeout(() => setShown(currentId), gap.current);
    return () => clearTimeout(t);
  }, [currentId, shown]);

  const promo = eligible.find((p) => p.id === shown) ?? null;

  const closeForSession = (id: string) => {
    gap.current = NEXT_DELAY_MS;
    const next = [...closed, id];
    setClosed(next);
    try {
      sessionStorage.setItem(CLOSED_KEY, JSON.stringify(next));
    } catch {
      /* hanya kenyamanan */
    }
  };

  const hideToday = (id: string) => {
    gap.current = NEXT_DELAY_MS;
    dismissPromo(id);
    toast("Iklan ini disembunyikan sampai besok.");
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto w-full max-w-[430px] px-3">
        <AnimatePresence>
          {promo && (
            <motion.aside
              key={promo.id}
              aria-label={`Iklan ${ORG_NAME[orgOf(promo)]}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pointer-events-auto rounded-[14px] border border-ink/10 bg-butter p-4 text-ink shadow-[0_10px_28px_rgba(40,30,20,0.18)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Tag tone="neutral">Iklan dari {ORG_NAME[orgOf(promo)]}</Tag>
                  <h2 className="mt-2 text-[19px] leading-snug">{promo.title}</h2>
                </div>
                <IconButton
                  icon="close"
                  label="Tutup iklan ini"
                  className="-mr-2 -mt-2 text-ink hover:bg-[#f5e78a]"
                  onClick={() => closeForSession(promo.id)}
                />
              </div>
              <p className="mt-1 text-[15px]">{promo.body}</p>
              <Button variant="accent" className="mt-3" onClick={() => setSheetFor(promo)}>
                {promo.cta}
              </Button>
              <label className="-mb-2 mt-1 flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="size-5 shrink-0 accent-[var(--brand)]"
                  checked={hiding === promo.id}
                  onChange={() => {
                    const id = promo.id;
                    setHiding(id);
                    setTimeout(() => hideToday(id), 300);
                  }}
                />
                Jangan tampilkan lagi hari ini
              </label>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      {sheetFor && (
        <PackageSheet open onClose={() => setSheetFor(null)} org={orgOf(sheetFor)} wedding={wedding} />
      )}
    </>
  );
}

export function useOrgWa(org: OrgKey): string {
  return useApp((s) => (org === "mahesa" ? s.settings.mahesaWa : s.settings.momentumWa));
}

function DummyNumberNotice({ org }: { org: OrgKey }) {
  return (
    <Notice>
      Nomor WhatsApp {ORG_NAME[org]} masih nomor contoh. Super Admin bisa menggantinya di panel admin, menu Akun.
    </Notice>
  );
}

export function PackageSheet({
  open,
  onClose,
  org,
  wedding,
}: {
  open: boolean;
  onClose: () => void;
  org: OrgKey;
  wedding: Wedding;
}) {
  const wa = useOrgWa(org);
  const service = org === "mahesa" ? "wedding organizer" : "wedding content creator (WCC)";
  const text = `Halo ${ORG_NAME[org]}, kami ${coupleLabel(wedding.brideName, wedding.groomName)} ingin tanya paket ${service}. Tanggal akad: ${formatDate(wedding.akadDate)}. Kota: ${wedding.city || "belum diisi"}. Dikirim dari Momentum Planner, kode proyek ${wedding.code}.`;

  return (
    <Sheet open={open} onClose={onClose} title={`Ajukan paket ke ${ORG_NAME[org]}`}>
      <p className="text-[15px] text-ink-soft">
        WhatsApp admin terbuka dengan pesan yang sudah terisi. Setelah kalian deal, admin menautkan proyek ini
        supaya bisa ikut membantu dari aplikasi.
      </p>
      <blockquote className="mt-4 rounded-[10px] border border-line bg-paper p-3 text-sm text-ink">{text}</blockquote>
      {isDummyWa(wa) && (
        <div className="mt-4">
          <DummyNumberNotice org={org} />
        </div>
      )}
      <a
        href={waLink(wa, text)}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(buttonClass("primary", true), "mt-5")}
        onClick={() => {
          setLink(wedding.id, org, "diajukan");
          toast("Pengajuan dicatat. Lanjutkan obrolan di WhatsApp.");
          onClose();
        }}
      >
        Kirim lewat WhatsApp
      </a>
    </Sheet>
  );
}

export function ChangeRequestSheet({
  open,
  onClose,
  wedding,
  org,
  section,
}: {
  open: boolean;
  onClose: () => void;
  wedding: Wedding;
  org: OrgKey;
  section: string;
}) {
  const wa = useOrgWa(org);
  const [note, setNote] = useState("");
  const trimmed = note.trim();
  const text = `Halo admin ${ORG_NAME[org]}, kami ${coupleLabel(wedding.brideName, wedding.groomName)} (kode ${wedding.code}) ingin mengajukan perubahan pada bagian ${section}: ${trimmed}`;

  return (
    <Sheet open={open} onClose={onClose} title="Ajukan perubahan">
      <p className="text-[15px] text-ink-soft">
        Bagian <span className="font-semibold text-ink">{section}</span> dikelola {ORG_NAME[org]}. Tulis perubahan
        yang kamu mau, lalu kirim ke admin lewat WhatsApp untuk dikonfirmasi.
      </p>
      <div className="mt-4">
        <TextAreaField
          label="Perubahan yang diminta"
          placeholder="Contoh: ganti jam akad jadi pukul 09.00"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {isDummyWa(wa) && (
        <div className="mt-4">
          <DummyNumberNotice org={org} />
        </div>
      )}
      {trimmed ? (
        <a
          href={waLink(wa, text)}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(buttonClass("primary", true), "mt-5")}
          onClick={() => {
            createRequest({ weddingId: wedding.id, org, section, note: trimmed });
            toast("Permintaan dicatat dan menunggu konfirmasi admin.");
            setNote("");
            onClose();
          }}
        >
          Kirim lewat WhatsApp
        </a>
      ) : (
        <Button block disabled className="mt-5">
          Tulis perubahannya dulu
        </Button>
      )}
    </Sheet>
  );
}
