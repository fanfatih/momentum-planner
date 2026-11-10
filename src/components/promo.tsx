"use client";

import { useMemo, useState } from "react";
import { coupleLabel, formatDate, isDummyWa, waLink } from "@/lib/format";
import { createRequest, dismissPromo, setLink, useApp } from "@/lib/store";
import type { OrgKey, PromoCard, PromoTrigger, Wedding } from "@/lib/types";
import { Button, buttonClass, cx, IconButton, Notice, Sheet, Tag, TextAreaField, toast } from "./ui";

const SNOOZE_MS = 7 * 86_400_000;

export const ORG_NAME: Record<OrgKey, string> = {
  mahesa: "Mahesa Weddings",
  momentum: "Momentum by Luna",
};

const orgOf = (p: PromoCard): OrgKey => (p.target === "mahesa" ? "mahesa" : "momentum");

/** Kartu promo pertama yang layak tampil: aktif, proyek belum tertaut, dan tidak ditutup dalam 7 hari terakhir. */
export function usePromo(trigger: PromoTrigger, wedding: Wedding | null): PromoCard | null {
  const promos = useApp((s) => s.promos);
  const dismissed = useApp((s) => s.dismissed);
  return useMemo(() => {
    if (!wedding) return null;
    const now = Date.now();
    return (
      promos.find((p) => {
        if (!p.active || p.trigger !== trigger) return false;
        if (wedding[orgOf(p)] !== "none") return false;
        const at = dismissed[p.id];
        return !at || now - new Date(at).getTime() > SNOOZE_MS;
      }) ?? null
    );
  }, [promos, dismissed, trigger, wedding]);
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

export function PromoCardView({ promo, wedding, compact = false }: { promo: PromoCard; wedding: Wedding; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const org = orgOf(promo);
  const Heading = compact ? "h3" : "h2";
  return (
    <aside aria-label={`Iklan ${ORG_NAME[org]}`} className="rounded-[14px] bg-butter p-4 text-ink">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Tag tone="neutral">Iklan dari {ORG_NAME[org]}</Tag>
          <Heading className={cx("mt-2", compact ? "text-[17px]" : "text-[21px]")}>{promo.title}</Heading>
        </div>
        <IconButton
          icon="close"
          label="Tutup iklan ini selama 7 hari"
          className="-mr-2 -mt-2 text-ink hover:bg-[#f5e78a]"
          onClick={() => dismissPromo(promo.id)}
        />
      </div>
      <p className="mt-1 text-[15px]">{promo.body}</p>
      <Button variant="accent" className="mt-3" onClick={() => setOpen(true)}>
        {promo.cta}
      </Button>
      <PackageSheet open={open} onClose={() => setOpen(false)} org={org} wedding={wedding} />
    </aside>
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
