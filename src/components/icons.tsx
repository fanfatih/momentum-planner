const PATHS = {
  home: ["M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"],
  checklist: ["M4.5 6.5 6 8l2.5-2.8", "M4.5 12.5 6 14l2.5-2.8", "M4.5 18.5 6 20l2.5-2.8", "M12 7h8", "M12 13h8", "M12 19h8"],
  store: ["M3.5 9.5 5 4h14l1.5 5.5", "M3.5 9.5a3 3 0 0 0 5.6 1.5 3 3 0 0 0 5.8 0 3 3 0 0 0 5.6-1.5", "M5 12.5V20h14v-7.5", "M10 20v-4.5h4V20"],
  wallet: ["M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3", "M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z", "M16 13.5h.5"],
  people: ["M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M3.5 19c.5-3 2.7-5 5.5-5s5 2 5.5 5", "M16.5 11a2.5 2.5 0 1 0 0-5", "M17 14.2c1.9.4 3.1 2.1 3.5 4.8"],
  plus: ["M12 5v14", "M5 12h14"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  chat: ["M4 19.5l1.2-4A8 8 0 1 1 8.5 18.8z"],
  pin: ["M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z", "M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z"],
  heart: ["M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"],
  lock: ["M7 11V8a5 5 0 0 1 10 0v3", "M6 11h12v9H6z"],
  trash: ["M5 7h14", "M10 7V5h4v2", "M7 7l.8 12h8.4L17 7", "M10.5 11v5", "M13.5 11v5"],
  edit: ["M5 19l.8-3.8L16.5 4.5l3 3L8.8 18.2z", "M14.5 6.5l3 3"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  chevronRight: ["M9 6l6 6-6 6"],
  chevronLeft: ["M15 6l-6 6 6 6"],
  chevronDown: ["M6 9l6 6 6-6"],
  calendar: ["M5 6.5h14v13H5z", "M5 10.5h14", "M9 4v4", "M15 4v4"],
  logout: ["M10 5H5v14h5", "M14 8l4 4-4 4", "M18 12H9"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  eye: ["M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z", "M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
  eyeOff: ["M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z", "M4 4l16 16"],
  copy: ["M9 9h10v10H9z", "M5 15V5h10"],
  external: ["M14 5h5v5", "M19 5l-8 8", "M11 6H6v12h12v-5"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7.5V12l3 2"],
  video: ["M4 7h11v10H4z", "M15 10.5l5-3v9l-5-3"],
  folder: ["M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.5h8A1.5 1.5 0 0 1 20.5 10v8a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"],
  megaphone: ["M4 10v4h3l6 4V6l-6 4z", "M16.5 9.5a3.5 3.5 0 0 1 0 5"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "M20 20l-4-4"],
  rings: ["M9 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10z", "M15 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10z", "M10 6l2-2 2 2"],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 22,
  className,
  filled = false,
}: {
  name: IconName;
  size?: number;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
