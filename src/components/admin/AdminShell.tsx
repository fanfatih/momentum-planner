"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ADMIN_NAV } from "@/components/admin/shared";
import { Icon } from "@/components/icons";
import { Monogram } from "@/components/Logo";
import { DemoRibbon, StorageNotice } from "@/components/shell";
import { Button, cx, LoadingState, Sheet } from "@/components/ui";
import { ADMIN_ROLES, useGuard } from "@/lib/guard";
import { ROLE_LABEL } from "@/lib/labels";
import { logout } from "@/lib/store";

export function AdminShell({ children }: { children: ReactNode }) {
  const { ready, session } = useGuard(ADMIN_ROLES);
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!ready || !session) {
    return (
      <main className="min-h-dvh bg-cream">
        <LoadingState what="panel admin" />
      </main>
    );
  }

  const items = ADMIN_NAV.filter((n) => n.roles.includes(session.role));
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/proyek") : pathname.startsWith(href);

  const signOut = () => {
    logout();
    router.replace("/masuk");
  };

  const nav = (
    <ul className="space-y-1">
      {items.map((n) => (
        <li key={n.href}>
          <Link
            href={n.href}
            aria-current={isActive(n.href) ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
            className={cx(
              "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors duration-150",
              isActive(n.href)
                ? "bg-brand-tint font-bold text-brand-deep"
                : "font-medium text-ink hover:bg-cream-deep active:bg-line",
            )}
          >
            <Icon name={n.icon} size={20} />
            {n.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-paper p-4 lg:flex">
        <div className="flex items-center gap-3 px-1 pb-5">
          <Monogram size={40} />
          <div className="min-w-0">
            <p className="font-serif text-[17px] font-semibold leading-tight text-ink">Momentum Planner</p>
            <p className="text-[13px] text-ink-soft">{ROLE_LABEL[session.role]}</p>
          </div>
        </div>
        <nav aria-label="Menu admin" className="flex-1">
          {nav}
        </nav>
        <Button variant="secondary" icon="logout" onClick={signOut}>
          Keluar
        </Button>
      </aside>

      <div className="min-w-0">
        <DemoRibbon />
        <header className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-2 lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <Monogram size={36} />
            <p className="truncate text-sm font-semibold text-ink">{ROLE_LABEL[session.role]}</p>
          </div>
          <Button variant="secondary" icon="menu" onClick={() => setMenuOpen(true)}>
            Menu
          </Button>
        </header>
        <StorageNotice />
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu admin" variant="modal">
        <nav aria-label="Menu admin">{nav}</nav>
        <Button variant="secondary" block icon="logout" className="mt-4" onClick={signOut}>
          Keluar
        </Button>
      </Sheet>
    </div>
  );
}
