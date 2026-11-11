"use client";

import type { InvitationContent } from "@/lib/types";
import { InvitationCover } from "./InvitationView";

/** Sampul asli tema dengan isi undangan pasangan, diperkecil. Dekoratif, jadi disembunyikan dari pembaca layar. */
export function ThemeMini({ theme, content, width = 156 }: { theme: string; content: InvitationContent; width?: number }) {
  const scale = width / 390;
  return (
    <div aria-hidden="true" className="relative shrink-0 overflow-hidden rounded-[10px] border border-line" style={{ width, height: 844 * scale }}>
      <div inert style={{ width: 390, height: 844, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <InvitationCover content={content} theme={theme} />
      </div>
    </div>
  );
}
