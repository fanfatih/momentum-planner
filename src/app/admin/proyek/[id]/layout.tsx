import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Detail proyek" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
