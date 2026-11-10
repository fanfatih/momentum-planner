"use client";

import { Button } from "@/components/ui";
import { resetDemo } from "@/lib/store";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="phone-frame grid place-items-center px-6 text-center">
      <div>
        <h1 className="text-[28px] text-brand-deep">Halaman ini gagal dimuat</h1>
        <p className="mx-auto mt-2 max-w-[32ch] text-[15px] text-ink-soft">
          Ada kesalahan saat menampilkan data. Coba muat ulang. Kalau masih gagal, data demo di perangkat ini bisa
          dikembalikan ke kondisi awal.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset}>Muat ulang halaman</Button>
          <Button
            variant="secondary"
            onClick={() => {
              resetDemo();
              reset();
            }}
          >
            Kembalikan data demo ke awal
          </Button>
        </div>
      </div>
    </main>
  );
}
