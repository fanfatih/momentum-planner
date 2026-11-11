import type { Metadata } from "next";
import { Landing } from "@/components/wcc/Landing";

export const metadata: Metadata = {
  title: { absolute: "Momentum WCC | Wedding content creator Bogor" },
  description: "Liputan story real-time, reels, dan highlight pernikahan mulai 250 ribu. Cek jadwal kosong dan booking lewat WhatsApp.",
};

export default function Page() {
  return <Landing />;
}
