import { useId, type CSSProperties, type ReactNode } from "react";

/* Ilustrasi bunga digambar sendiri dengan SVG. Semua bentuk dibuat pada ukuran 1 lalu diskalakan,
   supaya satu komponen bunga bisa dipakai dalam berbagai ukuran. */

type Pos = { x: number; y: number; r: number; rot?: number };

const at = ({ x, y, r, rot = 0 }: Pos) => `translate(${x} ${y}) rotate(${rot}) scale(${r})`;
const uid = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, "");

/* Daun bergerigi, arah ke atas, panjang 1. */
function serrated(width: number, teeth: number): string {
  const pts: string[] = [];
  const side = (dir: 1 | -1) => {
    const out: string[] = [];
    for (let i = 1; i <= teeth; i++) {
      const t = i / (teeth + 1);
      const w = width * Math.sin(Math.PI * Math.pow(t, 0.75)) * dir;
      const tooth = (i % 2 ? 0.035 : -0.0) * dir;
      out.push(`${(w + tooth).toFixed(3)} ${(-t).toFixed(3)}`);
    }
    return out;
  };
  const left = side(-1);
  const right = side(1).reverse();
  pts.push("0 0", ...left, "0 -1", ...right);
  return `M${pts.join("L")}Z`;
}
const LEAF_SERRATED = serrated(0.2, 13);
const LEAF_SMOOTH = "M0 0C-.3 -.2 -.32 -.7 0 -1C.32 -.7 .3 -.2 0 0Z";
const LEAF_LANCE = "M0 0C-.17 -.3 -.2 -.72 0 -1C.2 -.72 .17 -.3 0 0Z";

const filterShadow = (id: string, color: string, opacity: number, blur = 3) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx="1.5" dy="3" stdDeviation={blur} floodColor={color} floodOpacity={opacity} />
  </filter>
);

function Svg({
  viewBox,
  className,
  style,
  children,
}: {
  viewBox: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox={viewBox} className={className} style={style} overflow="visible">
      {children}
    </svg>
  );
}

/* ---------- Blush: mawar liar putih dengan pusat merah muda ---------- */

function WildRose({ p, id, scale = 1 }: { p: Pos; id: string; scale?: number }) {
  const petal = "M0 0C-.5 -.18 -.8 -.62 -.52 -.9C-.36 -1.04 -.13 -1 0 -.9C.13 -1 .36 -1.04 .52 -.9C.8 -.62 .5 -.18 0 0Z";
  const stamens = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return <circle key={i} cx={Math.cos(a) * 0.23} cy={Math.sin(a) * 0.23} r={0.028} fill="#cf3f62" />;
  });
  return (
    <g transform={at({ ...p, r: p.r * scale })}>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={`o${i}`} d={petal} transform={`rotate(${i * 72})`} fill={`url(#${id}pa)`} stroke="#ecd0d4" strokeWidth={0.012} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={`i${i}`} d={petal} transform={`rotate(${i * 72 + 36}) scale(.72)`} fill={`url(#${id}pb)`} stroke="#ecd0d4" strokeWidth={0.014} />
      ))}
      <circle r={0.4} fill={`url(#${id}pc)`} opacity={0.8} />
      <circle r={0.13} fill="#d2415f" />
      <circle r={0.075} fill="#f06c86" />
      {stamens}
    </g>
  );
}

function RoseLeaf({ p, fill }: { p: Pos; fill: string }) {
  return (
    <g transform={at(p)}>
      <path d={LEAF_SERRATED} fill={fill} />
      <path d="M0 -.02L0 -.92" stroke="#7a4a40" strokeOpacity={0.55} strokeWidth={0.014} />
      {[0.25, 0.42, 0.58, 0.74].map((t) => (
        <g key={t} stroke="#7a4a40" strokeOpacity={0.35} strokeWidth={0.01}>
          <path d={`M0 ${-t}L${-0.12} ${-t - 0.1}`} />
          <path d={`M0 ${-t}L${0.12} ${-t - 0.1}`} />
        </g>
      ))}
    </g>
  );
}

function RoseBud({ p, id }: { p: Pos; id: string }) {
  return (
    <g transform={at(p)}>
      <path d="M0 0C-.34 -.1 -.4 -.62 0 -1C.4 -.62 .34 -.1 0 0Z" fill={`url(#${id}pa)`} stroke="#ecd0d4" strokeWidth={0.02} />
      <path d="M0 -.15C-.12 -.3 -.12 -.6 0 -.82" fill="none" stroke="#e8b8c2" strokeWidth={0.03} strokeLinecap="round" />
      <path d="M0 0C-.18 .08 -.16 .22 0 .26C.16 .22 .18 .08 0 0Z" fill="#a8685c" />
    </g>
  );
}

/** Rangkaian mawar liar untuk sudut kanan atas. Dipakai dua kali (diputar) di sampul Blush. */
export function BlushCluster({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  return (
    <Svg viewBox="0 0 320 320" className={className} style={style}>
      <defs>
        <radialGradient id={`${id}pa`} cx="50%" cy="100%" r="105%">
          <stop offset="0" stopColor="#efb7c2" />
          <stop offset="0.32" stopColor="#fff" />
          <stop offset="1" stopColor="#f7eeee" />
        </radialGradient>
        <radialGradient id={`${id}pb`} cx="50%" cy="100%" r="105%">
          <stop offset="0" stopColor="#e9a3b1" />
          <stop offset="0.4" stopColor="#fdf6f6" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <radialGradient id={`${id}pc`}>
          <stop offset="0" stopColor="#e4506f" />
          <stop offset="1" stopColor="#e4506f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}l1`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8f5448" />
          <stop offset="1" stopColor="#c99486" />
        </linearGradient>
        <linearGradient id={`${id}l2`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#a8695b" />
          <stop offset="1" stopColor="#dcb0a3" />
        </linearGradient>
        {filterShadow(`${id}sh`, "#7a4a4a", 0.28, 3.5)}
      </defs>
      <g filter={`url(#${id}sh)`}>
        <path d="M330 -10C270 20 205 40 140 95" stroke="#9a5f52" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <path d="M300 120C260 150 230 175 215 215" stroke="#9a5f52" strokeWidth={2} fill="none" strokeLinecap="round" />
        <RoseLeaf p={{ x: 140, y: 96, r: 98, rot: -62 }} fill={`url(#${id}l1)`} />
        <RoseLeaf p={{ x: 150, y: 92, r: 84, rot: -18 }} fill={`url(#${id}l2)`} />
        <RoseLeaf p={{ x: 215, y: 214, r: 80, rot: 192 }} fill={`url(#${id}l1)`} />
        <RoseLeaf p={{ x: 220, y: 205, r: 92, rot: 160 }} fill={`url(#${id}l2)`} />
        <RoseLeaf p={{ x: 250, y: 150, r: 76, rot: -100 }} fill={`url(#${id}l1)`} />
        <RoseLeaf p={{ x: 190, y: 45, r: 70, rot: -125 }} fill={`url(#${id}l2)`} />
        <RoseBud p={{ x: 232, y: 40, r: 56, rot: -22 }} id={id} />
        <RoseBud p={{ x: 296, y: 235, r: 62, rot: 168 }} id={id} />
        <WildRose p={{ x: 232, y: 120, r: 70, rot: 14 }} id={id} />
        <WildRose p={{ x: 146, y: 104, r: 54, rot: -22 }} id={id} />
        <WildRose p={{ x: 275, y: 170, r: 46, rot: 40 }} id={id} />
        <WildRose p={{ x: 198, y: 176, r: 38, rot: 8 }} id={id} />
        <WildRose p={{ x: 306, y: 78, r: 40, rot: -10 }} id={id} />
      </g>
    </Svg>
  );
}

/* ---------- Marun: bunga kertas berlapis ---------- */

const PAPER = {
  burgundy: ["#4a0f1b", "#8c2236", "#c0566a"],
  wine: ["#5d1424", "#a02a40", "#d17285"],
  cream: ["#cfa982", "#ebd2b4", "#faf0e0"],
} as const;

function PaperFlower({ p, id, tone, layers = 3 }: { p: Pos; id: string; tone: keyof typeof PAPER; layers?: number }) {
  const petal = "M0 0C-.34 -.18 -.4 -.72 0 -1C.4 -.72 .34 -.18 0 0Z";
  const rings = [
    { n: 9, s: 1, rot: 0 },
    { n: 8, s: 0.74, rot: 20 },
    { n: 6, s: 0.5, rot: 8 },
  ].slice(0, layers);
  return (
    <g transform={at(p)}>
      {rings.map((ring, k) =>
        Array.from({ length: ring.n }, (_, i) => (
          <g key={`${k}-${i}`} transform={`rotate(${ring.rot + (360 / ring.n) * i}) scale(${ring.s})`}>
            <path d={petal} fill={`url(#${id}${tone})`} stroke="#f1d9a3" strokeOpacity={0.5} strokeWidth={0.014} />
            <path d="M0 -.1L0 -.8" stroke="#f6e3b3" strokeOpacity={0.35} strokeWidth={0.012} />
          </g>
        )),
      )}
      <circle r={0.13} fill="#d9aa4f" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * 0.17} cy={Math.sin(a) * 0.17} r={0.02} fill="#fff1c7" />;
      })}
    </g>
  );
}

function PaperLeaf({ p, fill, edge }: { p: Pos; fill: string; edge: string }) {
  return (
    <g transform={at(p)}>
      <path d={LEAF_LANCE} fill={fill} stroke={edge} strokeWidth={0.02} />
      <path d="M0 -.04L0 -.9" stroke={edge} strokeOpacity={0.8} strokeWidth={0.014} />
    </g>
  );
}

function MarunDefs({ id }: { id: string }) {
  const grad = (name: keyof typeof PAPER) => (
    <linearGradient id={`${id}${name}`} x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor={PAPER[name][0]} />
      <stop offset="0.55" stopColor={PAPER[name][1]} />
      <stop offset="1" stopColor={PAPER[name][2]} />
    </linearGradient>
  );
  return (
    <defs>
      {grad("burgundy")}
      {grad("wine")}
      {grad("cream")}
      <linearGradient id={`${id}lw`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#4c0e1b" />
        <stop offset="1" stopColor="#8a2033" />
      </linearGradient>
      <linearGradient id={`${id}lg`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#d3b27a" />
        <stop offset="1" stopColor="#f1e1bd" />
      </linearGradient>
      {filterShadow(`${id}sh`, "#2a0710", 0.38, 2.5)}
    </defs>
  );
}

/** Gugusan bunga kertas untuk pojok kiri atas, menumpang di atas pita marun. */
export function MarunTopCluster({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  return (
    <Svg viewBox="0 0 300 300" className={className} style={style}>
      <MarunDefs id={id} />
      <g filter={`url(#${id}sh)`}>
        <path d="M296 60C250 40 205 52 165 92" stroke="#bd9650" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <PaperLeaf p={{ x: 168, y: 92, r: 92, rot: -35 }} fill={`url(#${id}lg)`} edge="#bd9650" />
        <PaperLeaf p={{ x: 230, y: 52, r: 70, rot: 52 }} fill={`url(#${id}lw)`} edge="#c9a24f" />
        <PaperLeaf p={{ x: 260, y: 62, r: 64, rot: 98 }} fill={`url(#${id}lg)`} edge="#bd9650" />
        <PaperLeaf p={{ x: 120, y: 182, r: 108, rot: 168 }} fill={`url(#${id}lg)`} edge="#bd9650" />
        <PaperLeaf p={{ x: 168, y: 176, r: 90, rot: 210 }} fill={`url(#${id}lw)`} edge="#c9a24f" />
        <PaperLeaf p={{ x: 96, y: 118, r: 96, rot: -120 }} fill={`url(#${id}lw)`} edge="#c9a24f" />
        <PaperFlower p={{ x: 108, y: 112, r: 76, rot: 6 }} id={id} tone="burgundy" />
        <PaperFlower p={{ x: 186, y: 158, r: 52, rot: 20 }} id={id} tone="cream" />
        <PaperFlower p={{ x: 62, y: 190, r: 40, rot: 30 }} id={id} tone="wine" layers={2} />
      </g>
    </Svg>
  );
}

/** Gugusan bunga kertas untuk pojok kanan bawah. */
export function MarunBottomCluster({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  return (
    <Svg viewBox="0 0 300 300" className={className} style={style}>
      <MarunDefs id={id} />
      <g filter={`url(#${id}sh)`}>
        <path d="M-10 270C40 250 90 262 130 230" stroke="#bd9650" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <PaperLeaf p={{ x: 70, y: 246, r: 96, rot: -70 }} fill={`url(#${id}lw)`} edge="#c9a24f" />
        <PaperLeaf p={{ x: 120, y: 236, r: 90, rot: -16 }} fill={`url(#${id}lg)`} edge="#bd9650" />
        <PaperLeaf p={{ x: 200, y: 120, r: 84, rot: 20 }} fill={`url(#${id}lw)`} edge="#c9a24f" />
        <PaperLeaf p={{ x: 232, y: 112, r: 96, rot: 52 }} fill={`url(#${id}lg)`} edge="#bd9650" />
        <PaperFlower p={{ x: 196, y: 196, r: 68, rot: 0 }} id={id} tone="burgundy" />
        <PaperFlower p={{ x: 120, y: 218, r: 46, rot: 14 }} id={id} tone="cream" />
        <PaperFlower p={{ x: 262, y: 258, r: 44, rot: 24 }} id={id} tone="wine" layers={2} />
        <PaperFlower p={{ x: 248, y: 150, r: 34, rot: 10 }} id={id} tone="cream" layers={2} />
      </g>
    </Svg>
  );
}

/** Tangkai daun emas untuk pemisah antar bagian. */
export function MarunSprig({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  return (
    <Svg viewBox="0 0 200 40" className={className} style={style}>
      <MarunDefs id={id} />
      <path d="M10 20H80M120 20H190" stroke="#c4a05a" strokeWidth={1} />
      <PaperLeaf p={{ x: 100, y: 22, r: 26, rot: -90 }} fill={`url(#${id}lw)`} edge="#c9a24f" />
      <PaperLeaf p={{ x: 100, y: 22, r: 26, rot: 90 }} fill={`url(#${id}lw)`} edge="#c9a24f" />
      <PaperFlower p={{ x: 100, y: 20, r: 12, rot: 0 }} id={id} tone="burgundy" layers={2} />
    </Svg>
  );
}

/* ---------- Bunga liar: poppy cat air ---------- */

function Poppy({ p, id, hue = "a" }: { p: Pos; id: string; hue?: "a" | "b" }) {
  const petal = "M0 0C-.5 -.12 -.9 -.5 -.62 -.9C-.34 -1.2 .34 -1.2 .62 -.9C.9 -.5 .5 -.12 0 0Z";
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return (
      <g key={i}>
        <path d={`M0 0L${Math.cos(a) * 0.26} ${Math.sin(a) * 0.26}`} stroke="#4a2a5a" strokeWidth={0.014} />
        <circle cx={Math.cos(a) * 0.27} cy={Math.sin(a) * 0.27} r={0.022} fill="#3f2250" />
      </g>
    );
  });
  return (
    <g transform={at(p)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={petal}
          transform={`rotate(${i * 72 + (hue === "b" ? 14 : 0)}) scale(${0.92 + (i % 2) * 0.1})`}
          fill={`url(#${id}p${hue})`}
          stroke="#c887a4"
          strokeOpacity={0.55}
          strokeWidth={0.014}
          opacity={0.97}
        />
      ))}
      <circle r={0.32} fill={`url(#${id}pc)`} />
      <circle r={0.1} fill="#5b3470" />
      {rays}
    </g>
  );
}

function WildLeaf({ p, fill }: { p: Pos; fill: string }) {
  return (
    <g transform={at(p)}>
      <path d="M0 0C-.22 -.25 -.22 -.7 0 -1C.22 -.7 .22 -.25 0 0Z" fill={fill} />
      <path d="M0 -.03L0 -.88" stroke="#e4eed9" strokeOpacity={0.55} strokeWidth={0.014} />
    </g>
  );
}

function WildBud({ p, id }: { p: Pos; id: string }) {
  return (
    <g transform={at(p)}>
      <path d="M0 0C-.4 -.1 -.45 -.7 0 -1.05C.45 -.7 .4 -.1 0 0Z" fill={`url(#${id}bud)`} stroke="#6f9159" strokeOpacity={0.6} strokeWidth={0.02} />
      <path d="M0 -.1C-.06 -.4 -.04 -.7 0 -.95" stroke="#e8c4d4" strokeWidth={0.03} fill="none" strokeLinecap="round" opacity={0.7} />
    </g>
  );
}

/** Rumpun poppy yang masuk dari tepi kanan. Tinggi mengikuti lebar (viewBox 260 x 520). */
export function WildflowerSpray({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  return (
    <Svg viewBox="0 0 260 520" className={className} style={style}>
      <defs>
        <linearGradient id={`${id}pa`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8a5aa0" />
          <stop offset="0.32" stopColor="#cf8fb0" />
          <stop offset="1" stopColor="#f6dfe6" />
        </linearGradient>
        <linearGradient id={`${id}pb`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#a56a9e" />
          <stop offset="0.38" stopColor="#e0a2b8" />
          <stop offset="1" stopColor="#fbebee" />
        </linearGradient>
        <radialGradient id={`${id}pc`}>
          <stop offset="0" stopColor="#6d3f86" />
          <stop offset="1" stopColor="#6d3f86" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}g1`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#4f7640" />
          <stop offset="1" stopColor="#97b783" />
        </linearGradient>
        <linearGradient id={`${id}g2`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#6a8d56" />
          <stop offset="1" stopColor="#bcd2a8" />
        </linearGradient>
        <linearGradient id={`${id}bud`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#6f9159" />
          <stop offset="1" stopColor="#b5ce9f" />
        </linearGradient>
        <filter id={`${id}wc`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
      </defs>
      <g filter={`url(#${id}wc)`}>
        <path d="M300 520C250 440 232 360 238 300C244 240 232 160 150 78" stroke="#5f8449" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <path d="M290 430C240 400 160 372 118 300" stroke="#5f8449" strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M244 300C210 270 196 236 192 190" stroke="#6a8d56" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <path d="M286 505C240 470 190 468 160 430" stroke="#6a8d56" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <WildLeaf p={{ x: 238, y: 330, r: 110, rot: -112 }} fill={`url(#${id}g1)`} />
        <WildLeaf p={{ x: 244, y: 392, r: 96, rot: -64 }} fill={`url(#${id}g2)`} />
        <WildLeaf p={{ x: 200, y: 392, r: 84, rot: 205 }} fill={`url(#${id}g1)`} />
        <WildLeaf p={{ x: 160, y: 430, r: 92, rot: -128 }} fill={`url(#${id}g2)`} />
        <WildLeaf p={{ x: 190, y: 200, r: 70, rot: -150 }} fill={`url(#${id}g2)`} />
        <WildBud p={{ x: 116, y: 304, r: 54, rot: -168 }} id={id} />
        <WildBud p={{ x: 192, y: 190, r: 46, rot: -8 }} id={id} />
        <WildBud p={{ x: 150, y: 460, r: 42, rot: 196 }} id={id} />
        <Poppy p={{ x: 158, y: 86, r: 66, rot: -12 }} id={id} />
        <Poppy p={{ x: 232, y: 246, r: 58, rot: 24 }} id={id} hue="b" />
      </g>
    </Svg>
  );
}

/** Tangkai kecil untuk pemisah bagian. */
export function WildflowerSprig({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  return (
    <Svg viewBox="0 0 200 50" className={className} style={style}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#5f8449" />
          <stop offset="1" stopColor="#a6c392" />
        </linearGradient>
      </defs>
      <path d="M20 26H88M112 26H180" stroke="#b79556" strokeWidth={1} />
      <WildLeaf p={{ x: 100, y: 30, r: 26, rot: -60 }} fill={`url(#${id}g)`} />
      <WildLeaf p={{ x: 100, y: 30, r: 26, rot: 60 }} fill={`url(#${id}g)`} />
      <WildLeaf p={{ x: 100, y: 30, r: 30, rot: 0 }} fill={`url(#${id}g)`} />
    </Svg>
  );
}

/** Garis lengkung emas dengan bayangan lembut, pemisah sampul pada tema Bunga Liar. Diregangkan penuh mengikuti tinggi sampul. */
export function WildflowerWave({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  const curve = "M-20 330C150 380 300 560 340 700C365 790 400 870 446 960";
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 430 1000" preserveAspectRatio="none" className={className} style={style}>
      <defs>
        <linearGradient id={`${id}shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bdb9b3" stopOpacity="0.9" />
          <stop offset="1" stopColor="#dcd9d5" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}blur`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <linearGradient id={`${id}gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9a24f" />
          <stop offset="0.5" stopColor="#a8742a" />
          <stop offset="1" stopColor="#d6b46a" />
        </linearGradient>
      </defs>
      <path d={`${curve}L446 1000L-20 1000Z`} fill={`url(#${id}shade)`} filter={`url(#${id}blur)`} transform="translate(10 -14)" />
      <path d={`${curve}L446 1000L-20 1000Z`} fill="#f5f4f2" />
      <path d={curve} fill="none" stroke={`url(#${id}gold)`} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ---------- Ikon garis emas ---------- */

export function CalendarGold({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="9" width="30" height="29" rx="4" />
      <path d="M6 18H36M14 5V12M28 5V12" />
      <path d="M12 24h4M20 24h4M28 24h4M12 31h4M20 31h4" />
      <circle cx="35" cy="35" r="9" fill="var(--paper, #fff)" />
      <path d="M35 30V35L38.5 37" />
    </svg>
  );
}

export function PinGold({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 43C24 43 9 29.5 9 19A15 15 0 0 1 39 19C39 29.5 24 43 24 43Z" />
      <circle cx="24" cy="19" r="5.5" />
      <path d="M17 43H31" />
    </svg>
  );
}

/* ---------- Zaitun: dahan eukaliptus ---------- */

type V = [number, number];
const bez = (t: number, a: V, b: V, c: V): V => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
];
const bezAngle = (t: number, a: V, b: V, c: V) => {
  const dx = 2 * (1 - t) * (b[0] - a[0]) + 2 * t * (c[0] - b[0]);
  const dy = 2 * (1 - t) * (b[1] - a[1]) + 2 * t * (c[1] - b[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

const ROUND_LEAF = "M0 0C-.62 -.18 -.7 -.78 0 -1C.7 -.78 .62 -.18 0 0Z";

function Eucalyptus({ a, b, c, n, size, id, seed = 0 }: { a: V; b: V; c: V; n: number; size: number; id: string; seed?: number }) {
  const leaves = Array.from({ length: n }, (_, i) => {
    const t = 0.1 + (0.9 * i) / n;
    const [x, y] = bez(t, a, b, c);
    const ang = bezAngle(t, a, b, c);
    const side = i % 2 ? 1 : -1;
    const r = size * (1.15 - t * 0.55) * (0.9 + ((i * 37 + seed) % 10) / 50);
    return { x, y, r, rot: ang + 90 + side * (58 + ((i * 13 + seed) % 14)), tone: (i + seed) % 3 };
  });
  const end = bez(1, a, b, c);
  return (
    <g>
      <path d={`M${a[0]} ${a[1]}Q${b[0]} ${b[1]} ${c[0]} ${c[1]}`} stroke="#6d835f" strokeWidth={2} fill="none" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <g key={i} transform={at({ x: l.x, y: l.y, r: l.r, rot: l.rot })}>
          <path d={ROUND_LEAF} fill={`url(#${id}t${l.tone})`} stroke="#5f7552" strokeOpacity={0.35} strokeWidth={0.014} />
          <path d="M0 -.04L0 -.82" stroke="#f0f4e8" strokeOpacity={0.5} strokeWidth={0.016} />
        </g>
      ))}
      <g transform={at({ x: end[0], y: end[1], r: size * 0.7, rot: bezAngle(1, a, b, c) + 90 })}>
        <path d={ROUND_LEAF} fill={`url(#${id}t1)`} />
      </g>
    </g>
  );
}

function ZaitunDefs({ id }: { id: string }) {
  const g = (k: number, c0: string, c1: string) => (
    <linearGradient id={`${id}t${k}`} x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor={c0} />
      <stop offset="1" stopColor={c1} />
    </linearGradient>
  );
  return (
    <defs>
      {g(0, "#6f8a62", "#a9bf9b")}
      {g(1, "#86a078", "#c4d5b8")}
      {g(2, "#5c7650", "#93ad85")}
      {filterShadow(`${id}sh`, "#3a4d33", 0.22, 2.5)}
    </defs>
  );
}

/** Dua dahan eukaliptus yang menjuntai dari sudut kiri atas. Dicerminkan dengan CSS untuk sudut kanan. */
export function ZaitunHang({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  return (
    <Svg viewBox="0 0 220 470" className={className} style={style}>
      <ZaitunDefs id={id} />
      <g filter={`url(#${id}sh)`}>
        <Eucalyptus a={[40, -10]} b={[130, 120]} c={[70, 400]} n={16} size={32} id={id} seed={1} />
        <Eucalyptus a={[-6, 40]} b={[50, 140]} c={[24, 300]} n={10} size={26} id={id} seed={4} />
      </g>
    </Svg>
  );
}

/** Tangkai kecil untuk pemisah bagian. */
export function ZaitunSprig({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = uid(useId());
  return (
    <Svg viewBox="0 0 200 46" className={className} style={style}>
      <ZaitunDefs id={id} />
      <path d="M14 26H84M116 26H186" stroke="#9db18f" strokeWidth={1} />
      <path d="M100 42V12" stroke="#6d835f" strokeWidth={1.6} />
      {[
        { x: 100, y: 12, r: 20, rot: 0, t: 1 },
        { x: 100, y: 28, r: 22, rot: -52, t: 0 },
        { x: 100, y: 28, r: 22, rot: 52, t: 2 },
        { x: 100, y: 40, r: 17, rot: -82, t: 2 },
        { x: 100, y: 40, r: 17, rot: 82, t: 0 },
      ].map((l, i) => (
        <g key={i} transform={at(l)}>
          <path d={ROUND_LEAF} fill={`url(#${id}t${l.t})`} />
        </g>
      ))}
    </Svg>
  );
}

/* ---------- Malam Emas: garis emas ---------- */

const GOLD = "#d4af6a";

function GoldLeaf({ p }: { p: Pos }) {
  return (
    <g transform={at(p)}>
      <path d="M0 0C-.3 -.2 -.34 -.7 0 -1C.34 -.7 .3 -.2 0 0Z" fill="none" stroke={GOLD} strokeWidth={0.035} />
      <path d="M0 -.05L0 -.85" stroke={GOLD} strokeWidth={0.02} />
    </g>
  );
}

/** Ranting daun emas berbentuk garis, simetris, untuk puncak lengkung sampul. */
export function GoldCrest({ className, style }: { className?: string; style?: CSSProperties }) {
  const sideLeaves = [
    { x: 100, y: 92, r: 30, rot: -62 },
    { x: 100, y: 76, r: 28, rot: -50 },
    { x: 100, y: 60, r: 25, rot: -40 },
    { x: 100, y: 46, r: 21, rot: -30 },
  ];
  return (
    <Svg viewBox="0 0 200 110" className={className} style={style}>
      <path d="M100 100V20" stroke={GOLD} strokeWidth={1.4} />
      {sideLeaves.map((l, i) => (
        <g key={i}>
          <GoldLeaf p={l} />
          <GoldLeaf p={{ ...l, rot: -l.rot }} />
        </g>
      ))}
      <GoldLeaf p={{ x: 100, y: 22, r: 22, rot: 0 }} />
      <circle cx={100} cy={104} r={3} fill="none" stroke={GOLD} strokeWidth={1.2} />
      <path d="M20 104H90M110 104H180" stroke={GOLD} strokeWidth={1} />
    </Svg>
  );
}

/** Sulur emas untuk sudut bawah. */
export function GoldVine({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <Svg viewBox="0 0 200 200" className={className} style={style}>
      <path d="M0 200C30 150 40 100 90 70C120 52 160 50 200 20" stroke={GOLD} strokeWidth={1.3} fill="none" />
      <path d="M0 160C20 130 30 110 60 96" stroke={GOLD} strokeWidth={1} fill="none" />
      {[
        { x: 22, y: 160, r: 36, rot: 40 },
        { x: 44, y: 118, r: 40, rot: 55 },
        { x: 80, y: 84, r: 42, rot: 62 },
        { x: 118, y: 62, r: 38, rot: 78 },
        { x: 156, y: 44, r: 34, rot: 92 },
        { x: 34, y: 134, r: 26, rot: -30 },
        { x: 66, y: 96, r: 30, rot: -18 },
        { x: 104, y: 70, r: 28, rot: -4 },
        { x: 142, y: 52, r: 24, rot: 12 },
      ].map((l, i) => (
        <GoldLeaf key={i} p={l} />
      ))}
      <circle cx={186} cy={26} r={3} fill={GOLD} />
    </Svg>
  );
}

/** Pemisah antar bagian: garis emas dengan berlian kecil. */
export function GoldDivider({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <Svg viewBox="0 0 200 20" className={className} style={style}>
      <path d="M10 10H86M114 10H190" stroke={GOLD} strokeWidth={1} />
      <path d="M100 3L107 10L100 17L93 10Z" fill="none" stroke={GOLD} strokeWidth={1.2} />
      <circle cx={100} cy={10} r={1.5} fill={GOLD} />
    </Svg>
  );
}
