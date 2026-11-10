"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useApp, useMeta } from "./store";
import type { Role, Wedding } from "./types";

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
  const ok = !!session && allowed.includes(session.role);

  useEffect(() => {
    if (hydrated && !ok) router.replace("/masuk");
  }, [hydrated, ok, router]);

  return { ready: hydrated && ok, session };
}

export function useCurrentWedding(): Wedding | null {
  const session = useApp((s) => s.session);
  const weddings = useApp((s) => s.weddings);
  return useMemo(
    () => weddings.find((w) => w.id === session?.weddingId) ?? null,
    [weddings, session],
  );
}
