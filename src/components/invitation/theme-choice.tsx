"use client";

import { Button, Sheet, toast } from "@/components/ui";
import { useOrgWa } from "@/components/promo";
import { coupleLabel, slugify, waLink } from "@/lib/format";
import { contentFromWedding, suggestSlug } from "@/lib/invitation";
import { resolveTheme, type ThemeInfo } from "@/lib/invitation-themes";
import { saveInvitation, useApp } from "@/lib/store";
import type { Invitation, InvitationContent, Wedding } from "@/lib/types";

export function useThemeState(wedding: Wedding) {
  const invitations = useApp((s) => s.invitations);
  const existing = invitations.find((i) => i.weddingId === wedding.id) ?? null;
  const content: InvitationContent = existing?.content ?? contentFromWedding(wedding);
  return {
    existing,
    content,
    locked: !!existing?.themeLocked,
    current: existing ? resolveTheme(existing.theme) : null,
  };
}

/** Memilih tema langsung mengunci tema itu. Kalau undangan belum ada, dibuat dulu dari data proyek. */
export async function chooseTheme(wedding: Wedding, existing: Invitation | null, theme: ThemeInfo): Promise<boolean> {
  const base: Invitation = existing ?? {
    weddingId: wedding.id,
    slug: suggestSlug(wedding),
    theme: theme.id,
    themeLocked: true,
    published: false,
    content: contentFromWedding(wedding),
  };
  let result = await saveInvitation({ ...base, theme: theme.id, themeLocked: true });
  if (result === "taken" && !existing) {
    const slug = `${base.slug}-${slugify(wedding.code)}`.slice(0, 40).replace(/-+$/, "");
    result = await saveInvitation({ ...base, slug, theme: theme.id, themeLocked: true });
  }
  if (result !== "ok") {
    toast("Tema belum tersimpan. Coba lagi.");
    return false;
  }
  toast(`Tema ${theme.name} dipilih dan dikunci.`);
  return true;
}

export function ChooseSheet({
  open,
  onClose,
  theme,
  wedding,
  existing,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  theme: ThemeInfo | null;
  wedding: Wedding;
  existing: Invitation | null;
  onDone: () => void;
}) {
  return (
    <Sheet open={open && !!theme} onClose={onClose} title={theme ? `Pilih tema ${theme.name}?` : "Pilih tema"}>
      <p className="text-[15px] text-ink-soft">
        Setelah dipilih, tema dikunci dan tidak bisa diganti sendiri. Isi undanganmu tetap bisa diubah kapan saja. Kalau nanti ingin tema lain, minta ke admin lewat WhatsApp.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button
          onClick={async () => {
            if (!theme) return;
            if (await chooseTheme(wedding, existing, theme)) {
              onClose();
              onDone();
            }
          }}
        >
          Pilih dan kunci
        </Button>
      </div>
    </Sheet>
  );
}

/** Pesan WhatsApp ke Momentum untuk minta tema lain setelah tema dikunci. */
export function useThemeRequestLink(wedding: Wedding, current: ThemeInfo | null) {
  const wa = useOrgWa("momentum");
  return (wanted: ThemeInfo) =>
    waLink(
      wa,
      `Halo Momentum by Luna, kami ${coupleLabel(wedding.brideName, wedding.groomName)} ingin ganti tema undangan digital${current ? ` dari ${current.name}` : ""} ke ${wanted.name}. Kode proyek ${wedding.code}.`,
    );
}
