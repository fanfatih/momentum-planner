export type ThemeId = "blush" | "marun" | "wildflower" | "zaitun" | "malam";

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Gaya untuk penyaring di katalog tema. */
  tags: string[];
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
    tags: ["Floral", "Romantis"],
    bg: "#f1e4e1",
    ink: "#7c5428",
    accent: "#d9486a",
  },
  {
    id: "marun",
    name: "Marun Lengkung",
    blurb: "Pita marun, lengkung emas, bunga kertas marun dan krem.",
    tags: ["Klasik", "Mewah"],
    bg: "#fbf5e9",
    ink: "#6b1727",
    accent: "#b88a44",
  },
  {
    id: "wildflower",
    name: "Bunga Liar",
    blurb: "Latar abu hangat, garis lengkung emas, bunga poppy cat air.",
    tags: ["Floral", "Lembut"],
    bg: "#edebe8",
    ink: "#7a5a24",
    accent: "#c9809a",
  },
  {
    id: "zaitun",
    name: "Hijau Zaitun",
    blurb: "Jendela lengkung krem, dahan eukaliptus menjuntai, tulisan serif yang tenang.",
    tags: ["Modern", "Botanikal"],
    bg: "#eef1e8",
    ink: "#34452f",
    accent: "#6f8a62",
  },
  {
    id: "malam",
    name: "Malam Emas",
    blurb: "Biru malam, garis emas, bintang berkelip. Satu-satunya tema gelap.",
    tags: ["Gelap", "Mewah"],
    bg: "#0f1a33",
    ink: "#ecdca9",
    accent: "#d4af6a",
  },
];

export const THEME_TAGS = ["Floral", "Klasik", "Modern", "Gelap"];

/** Tema lama atau tidak dikenal jatuh ke Blush Oval. */
export function resolveTheme(id: string | null | undefined): ThemeInfo {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
