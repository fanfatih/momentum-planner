import Link from "next/link";
import type { ReactNode } from "react";

export const LEGAL_UPDATED = "11 November 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="phone-frame px-5 pb-16 pt-8">
      <Link href="/masuk" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-brand-deep underline underline-offset-4">
        Kembali
      </Link>
      <h1 className="mt-4 text-[30px] text-ink">{title}</h1>
      <p className="mt-1 text-[14px] text-ink-soft">Diperbarui {LEGAL_UPDATED}</p>
      <div className="legal mt-6 space-y-7 text-[16px] leading-[1.65] text-ink">{children}</div>
      <nav aria-label="Dokumen lain" className="mt-10 flex flex-wrap gap-x-5 border-t border-line pt-4 text-[15px]">
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

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-[20px]">{title}</h2>
      {children}
    </section>
  );
}

export function Items({ children }: { children: ReactNode }) {
  return <ul className="m-0 list-disc space-y-1.5 pl-5">{children}</ul>;
}
