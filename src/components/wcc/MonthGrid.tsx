"use client";

import { Icon } from "@/components/icons";
import { cx } from "@/components/ui";
import type { DayStatus } from "@/lib/wcc-schedule";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export const STATUS_LABEL: Record<DayStatus, string> = { kosong: "Kosong", sebagian: "Sebagian terisi", penuh: "Penuh" };

/** Warna dan simbol dipakai bersama, supaya status tidak hanya dibedakan lewat warna. */
const STATUS_CLASS: Record<DayStatus, string> = {
  kosong: "bg-[#e3edd9] text-[#2c4520]",
  sebagian: "bg-[#fff2a0] text-[#5a4700]",
  penuh: "bg-[#f1d3d3] text-[#8a1c1c] [background-image:repeating-linear-gradient(135deg,transparent_0_5px,rgb(138_28_28/0.13)_5px_7px)]",
};
const STATUS_MARK: Record<DayStatus, string> = { kosong: "○", sebagian: "◐", penuh: "●" };

export const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function MonthGrid({
  year,
  month,
  statusOf,
  disabled,
  selected,
  onPick,
  onMonth,
  today,
}: {
  year: number;
  month: number;
  statusOf: (isoDate: string) => DayStatus | undefined;
  disabled?: (isoDate: string) => boolean;
  selected?: string;
  onPick: (isoDate: string) => void;
  onMonth: (delta: number) => void;
  today: string;
}) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <button type="button" aria-label="Bulan sebelumnya" onClick={() => onMonth(-1)} className="inline-grid size-11 place-items-center rounded-[10px] hover:bg-cream-deep">
          <Icon name="chevronLeft" size={20} />
        </button>
        <p role="status" aria-live="polite" className="m-0 text-[17px] font-semibold">
          {MONTHS[month]} {year}
        </p>
        <button type="button" aria-label="Bulan berikutnya" onClick={() => onMonth(1)} className="inline-grid size-11 place-items-center rounded-[10px] hover:bg-cream-deep">
          <Icon name="chevronRight" size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-ink-soft" aria-hidden="true">
        {DAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Kalender ${MONTHS[month]} ${year}`}>
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} role="gridcell" aria-hidden="true" />;
          const date = iso(year, month, d);
          const status = statusOf(date);
          const off = disabled?.(date) ?? false;
          const isSel = selected === date;
          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              disabled={off}
              aria-selected={isSel}
              aria-label={`${d} ${MONTHS[month]}${status ? `, ${STATUS_LABEL[status]}` : ""}${date === today ? ", hari ini" : ""}`}
              data-date={date}
              data-status={status}
              onClick={() => onPick(date)}
              className={cx(
                "relative grid min-h-12 place-items-center rounded-[10px] text-[15px] font-semibold leading-none transition-[box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-35",
                off || !status ? "bg-cream-deep text-ink-soft" : STATUS_CLASS[status],
                isSel && "ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-paper",
                date === today && !isSel && "outline outline-1 outline-offset-1 outline-[var(--ink)]",
              )}
            >
              <span>{d}</span>
              {status && !off && (
                <span aria-hidden="true" className="text-[10px] leading-none">
                  {STATUS_MARK[status]}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[13px] text-ink-soft" aria-label="Arti warna">
        {(Object.keys(STATUS_LABEL) as DayStatus[]).map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cx("inline-grid size-5 place-items-center rounded-[5px] text-[10px]", STATUS_CLASS[s])}>
              {STATUS_MARK[s]}
            </span>
            {STATUS_LABEL[s]}
          </li>
        ))}
      </ul>
    </div>
  );
}
