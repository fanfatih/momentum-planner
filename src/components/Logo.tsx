import { MONOGRAM, WORDMARK } from "./brand-data";

export function Wordmark({ className, label = "Momentum" }: { className?: string; label?: string }) {
  return (
    <svg viewBox={WORDMARK.viewBox} className={className} role="img" aria-label={label} fill="currentColor">
      <g transform={WORDMARK.transform}>
        {WORDMARK.paths.map((d) => (
          <path key={d.slice(0, 24)} d={d} />
        ))}
      </g>
    </svg>
  );
}

/* Path asli berupa kotak dengan lubang huruf M, jadi warna huruf digambar sebagai alas di bawahnya. */
export function Monogram({
  size = 40,
  bg = "var(--brand)",
  mark = "var(--cream)",
  radius = 10,
  className,
}: {
  size?: number;
  bg?: string;
  mark?: string;
  radius?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox={MONOGRAM.viewBox}
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      style={{ borderRadius: radius, flexShrink: 0 }}
    >
      <rect width="1254" height="1254" fill={mark} />
      <g transform={MONOGRAM.transform} fill={bg} fillRule="evenodd">
        {MONOGRAM.paths.map((d) => (
          <path key={d.slice(0, 24)} d={d} />
        ))}
      </g>
    </svg>
  );
}
