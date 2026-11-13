import type { Metadata } from "next";
import { Catalog } from "@/components/katalog/Catalog";

export const metadata: Metadata = {
  title: { absolute: "Katalog undangan digital | Momentum" },
  description: "Lihat tema undangan digital, bandingkan paket, dan mulai lewat WhatsApp.",
};

export default function Page() {
  return <Catalog />;
}
