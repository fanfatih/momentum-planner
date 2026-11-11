import { formatRp } from "@/lib/format";

/** Harga jual, dengan harga normal dicoret dan persen hemat bila ada promo. */
export function Price({ price, old, unit = "", className = "" }: { price: number; old?: number | null; unit?: string; className?: string }) {
  const promo = old && old > price ? old : null;
  return (
    <span className={`${className} inline-flex flex-wrap items-baseline gap-x-2`}>
      {promo && (
        <>
          <s className="font-normal text-ink-soft">
            <span className="sr-only">Harga normal </span>
            {formatRp(promo)}
          </s>
        </>
      )}
      <span>
        {promo && <span className="sr-only">Harga promo </span>}
        {formatRp(price)}
        {unit}
      </span>
      {promo && <span className="inline-block rounded-full bg-[#fff2a0] px-2 py-0.5 align-middle text-[12px] font-semibold text-[#4a3b00]">Hemat {Math.round(((promo - price) / promo) * 100)}%</span>}
    </span>
  );
}
