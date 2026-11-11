export type ThemeId = "blush" | "marun" | "wildflower";

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Warna untuk gambar preview WhatsApp dan miniatur di editor. */
  bg: string;
  ink: string;
  accent: string;
}

export const THEMES: ThemeInfo[] = [
  {
    id: "blush",
    name: "Blush Oval",
    blurb: "Latar merah muda lembut, bingkai oval putih, bunga mawar liar.",
    bg: "#f1e4e1",
    ink: "#7c5428",
    accent: "#d9486a",
  },
  {
    id: "marun",
    name: "Marun Lengkung",
    blurb: "Pita marun, lengkung emas, bunga kertas marun dan krem.",
    bg: "#fbf5e9",
    ink: "#6b1727",
    accent: "#b88a44",
  },
  {
    id: "wildflower",
    name: "Bunga Liar",
    blurb: "Latar abu hangat, garis lengkung emas, bunga poppy cat air.",
    bg: "#edebe8",
    ink: "#7a5a24",
    accent: "#c9809a",
  },
];

/** Tema lama atau tidak dikenal jatuh ke Blush Oval. */
export function resolveTheme(id: string | null | undefined): ThemeInfo {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
