"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useApp, useMeta } from "./store";
import type { AppMode, Role, Wedding } from "./types";

export const COUPLE_ROLES: Role[] = ["bride", "groom"];
export const ADMIN_ROLES: Role[] = ["admin_mahesa", "admin_momentum", "super_admin"];

export function homeFor(role: Role): string {
  return COUPLE_ROLES.includes(role) ? "/beranda" : "/admin";
}

/** Arahkan ke halaman masuk kalau sesi tidak ada atau role tidak diizinkan. */
export function useGuard(allowed: Role[]) {
  const { hydrated } = useMeta();
  const session = useApp((s) => s.session);
  const router = useRouter();
  // Akun pengantin tanpa proyek belum boleh membuka layar proyek.
  const ok =
    !!session && allowed.includes(session.role) && (!COUPLE_ROLES.includes(session.role) || !!session.weddingId);

  useEffect(() => {
    if (hydrated && !ok) router.replace("/masuk");
  }, [hydrated, ok, router]);

  return { ready: hydrated && ok, session };
}

/** Akun lama yang sudah punya jalur dianggap memakai planner, jadi tidak ditanya ulang. */
export function modeOf(w: Wedding): AppMode | null {
  return w.mode ?? (w.track ? "planner" : null);
}

/** Halaman yang hanya ada di mode planner. */
export const PLANNER_ONLY = ["/beranda", "/ceklis", "/vendor", "/budget"];

export function useCurrentWedding(): Wedding | null {
  const session = useApp((s) => s.session);
  const weddings = useApp((s) => s.weddings);
  return useMemo(
    () => weddings.find((w) => w.id === session?.weddingId) ?? null,
    [weddings, session],
  );
}
