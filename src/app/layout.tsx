import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Momentum Planner", template: "%s | Momentum Planner" },
  description:
    "Planner pernikahan dari Momentum by Luna: ceklis dokumen, budget, vendor, venue, dan daftar tamu dalam satu aplikasi.",
  applicationName: "Momentum Planner",
  appleWebApp: { capable: true, title: "Momentum", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#b93636",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
