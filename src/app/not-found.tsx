import Link from "next/link";

export default function NotFound() {
  return (
    <main className="phone-frame grid place-items-center px-6 text-center">
      <div>
        <h1 className="text-[28px] text-brand-deep">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-2 max-w-[30ch] text-[15px] text-ink-soft">
          Alamat ini tidak ada di Momentum Planner. Mungkin tautannya salah ketik.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-4 text-[15px] font-semibold text-cream transition-colors hover:bg-brand-deep active:translate-y-px"
        >
          Kembali ke awal
        </Link>
      </div>
    </main>
  );
}
