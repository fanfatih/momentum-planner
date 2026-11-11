"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionStyle } from "framer-motion";
import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from "react";

/* Gerak untuk undangan. Semua gerak mati kalau perangkat meminta gerak dikurangi,
   dan juga di miniatur katalog tema (StillContext) supaya miniatur tidak ikut bergeser saat halaman di-scroll. */

export const StillContext = createContext(false);
const useStill = () => {
  const reduce = useReducedMotion();
  const still = useContext(StillContext);
  return reduce || still;
};

type Range = [number, number];

/** Bergeser pelan mengikuti scroll halaman, supaya bunga terasa berada di lapisan lain dari teks. */
export function Parallax({
  children,
  y = [0, 0],
  x = [0, 0],
  rotate = [0, 0],
  range = 900,
  origin,
  className,
  style,
}: {
  children: ReactNode;
  origin?: string;
  y?: Range;
  x?: Range;
  rotate?: Range;
  range?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useStill();
  const { scrollY } = useScroll();
  const ty = useTransform(scrollY, [0, range], y);
  const tx = useTransform(scrollY, [0, range], x);
  const tr = useTransform(scrollY, [0, range], rotate);
  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <div className={className} style={style}>
      <motion.div style={{ y: ty, x: tx, rotate: tr, transformOrigin: origin, willChange: "transform" } as MotionStyle}>{children}</motion.div>
    </div>
  );
}

const VIEW = { once: true, margin: "0px 0px -12% 0px" } as const;
const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Naik pelan saat masuk layar. Hanya dipakai untuk blok isi, bukan untuk tiap kata. */
export function Rise({ children, delay = 0, y = 28, className, style }: { children: ReactNode; delay?: number; y?: number; className?: string; style?: CSSProperties }) {
  const reduce = useStill();
  if (reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW}
      transition={{ duration: 0.85, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Bunga mekar: membesar sambil berputar sedikit saat masuk layar. */
export function Bloom({ children, delay = 0, from = -16, className, style }: { children: ReactNode; delay?: number; from?: number; className?: string; style?: CSSProperties }) {
  const reduce = useStill();
  if (reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, scale: 0.55, rotate: from }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={VIEW}
      transition={{ duration: 1.3, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Tumbuh dari satu sisi: garis emas membentang, daun tumbuh dari pangkal. */
export function Grow({
  children,
  axis = "x",
  origin,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  axis?: "x" | "y";
  origin?: string;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useStill();
  if (reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={{ ...style, transformOrigin: origin ?? (axis === "x" ? "50% 50%" : "50% 100%") }}
      initial={axis === "x" ? { scaleX: 0, opacity: 0 } : { scaleY: 0, opacity: 0 }}
      whileInView={axis === "x" ? { scaleX: 1, opacity: 1 } : { scaleY: 1, opacity: 1 }}
      viewport={VIEW}
      transition={{ duration: 1.1, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Dibuka dari bawah ke atas seperti tirai. Cocok untuk kartu berbentuk lengkung. */
export function Curtain({ children, delay = 0, className, style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  const reduce = useStill();
  if (reduce) return <div className={className} style={style}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ clipPath: "inset(100% 0 0 0)", opacity: 0.4 }}
      whileInView={{ clipPath: "inset(0% 0 0 0)", opacity: 1 }}
      viewport={VIEW}
      transition={{ duration: 1.2, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Lapisan partikel yang turun pelan di seluruh halaman: kelopak, debu emas, atau serbuk sari. */
export function Ambient({ kind }: { kind: "petal" | "gold" | "pollen" | "star" | "leaf" }) {
  const reduce = useStill();
  if (reduce) return null;
  const n = kind === "star" ? 22 : 12;
  return (
    <div aria-hidden="true" className={`inv-ambient inv-ambient-${kind}`}>
      {Array.from({ length: n }, (_, i) => {
        const r = (i * 7919) % 100;
        return (
          <span
            key={i}
            style={
              {
                left: `${(i * 37 + r) % 100}%`,
                ...(kind === "star" ? { top: `${(i * 53 + r) % 96}%` } : {}),
                animationDelay: `${-((i * 3.7) % 24)}s`,
                animationDuration: `${(kind === "star" ? 4 : 16) + (r % 9)}s`,
                "--s": `${0.6 + (r % 7) / 10}`,
                "--dx": `${((r % 5) - 2) * 30}px`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** Foto galeri: muncul pelan, lalu isinya bergeser tipis di dalam bingkai saat halaman digulir. */
export function GalleryPhoto({ src, alt, delay = 0, className }: { src: string; alt: string; delay?: number; className?: string }) {
  const reduce = useStill();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  if (reduce) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" decoding="async" className="inv-photo-img" />
      </div>
    );
  }
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={VIEW}
      transition={{ duration: 0.95, delay, ease: EASE }}
    >
      <motion.img src={src} alt={alt} loading="lazy" decoding="async" className="inv-photo-img" style={{ y, scale: 1.16 }} />
    </motion.div>
  );
}
