"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { REMOTE } from "@/lib/mode";
import { dismissLoadError, dismissSyncError, useMeta } from "@/lib/store";
import { Icon, type IconName } from "./icons";
import { Button, cx, Notice } from "./ui";

export function DemoRibbon() {
  if (REMOTE) return null;
  return (
    <p className="bg-butter px-4 py-1.5 text-center text-xs font-medium text-ink">
      Mode demo: data contoh, tersimpan di perangkat ini saja.
    </p>
  );
}

export function StorageNotice() {
  const { loadError, saveError, syncError } = useMeta();
  if (!loadError && !saveError && !syncError) return null;
  return (
    <div className="space-y-2 px-4 pt-3">
      {loadError && (
        <Notice
          tone="brand"
          action={
            <Button variant="ghost" className="-my-1.5 shrink-0" onClick={dismissLoadError}>
              Mengerti
            </Button>
          }
        >
          {loadError}
        </Notice>
      )}
      {syncError && (
        <Notice
          tone="brand"
          action={
            <Button variant="ghost" className="-my-1.5 shrink-0" onClick={dismissSyncError}>
              Mengerti
            </Button>
          }
        >
          {syncError}
        </Notice>
      )}
      {saveError && (
        <Notice tone="brand">
          Perubahan terakhir gagal disimpan karena penyimpanan browser penuh atau diblokir. Kosongkan ruang atau
          izinkan penyimpanan situs, lalu ulangi perubahannya.
        </Notice>
      )}
    </div>
  );
}

export function PageHeader({ title, lead, action }: { title: string; lead?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pb-3 pt-6">
      <div className="min-w-0">
        <h1 className="text-[28px] text-ink">{title}</h1>
        {lead && <p className="mt-1 text-[15px] text-ink-soft">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/beranda", label: "Beranda", icon: "home" },
  { href: "/ceklis", label: "Ceklis", icon: "checklist" },
  { href: "/vendor", label: "Vendor", icon: "store" },
  { href: "/budget", label: "Budget", icon: "wallet" },
  { href: "/tamu", label: "Tamu", icon: "people" },
];

const TABS_UNDANGAN: { href: string; label: string; icon: IconName }[] = [
  { href: "/undangan", label: "Undangan", icon: "rings" },
  { href: "/tamu", label: "Tamu", icon: "people" },
];

export function BottomNav({ mode = "planner" }: { mode?: "planner" | "undangan" }) {
  const pathname = usePathname();
  const tabs = mode === "undangan" ? TABS_UNDANGAN : TABS;
  return (
    <nav
      aria-label="Menu utama"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]"
    >
      <ul className={mode === "undangan" ? "grid grid-cols-2" : "grid grid-cols-5"}>
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs transition-colors duration-150",
                  active ? "font-bold text-brand-deep" : "font-medium text-ink-soft hover:text-ink active:bg-cream-deep",
                )}
              >
                {active && <span aria-hidden="true" className="absolute top-0 h-[3px] w-9 rounded-b-[3px] bg-brand" />}
                <Icon name={t.icon} size={22} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function CheckToggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-45"
    >
      <span
        className={cx(
          "grid size-[26px] place-items-center rounded-full border-2 transition-colors duration-150",
          checked
            ? "border-leaf-deep bg-leaf-deep text-cream"
            : "border-ink/55 bg-paper group-hover:border-ink group-active:bg-cream-deep",
        )}
      >
        {checked && (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 pb-2 pt-6">
      <h2 className="text-[19px] text-ink">{children}</h2>
      {aside && <div className="shrink-0 text-sm text-ink-soft">{aside}</div>}
    </div>
  );
}
