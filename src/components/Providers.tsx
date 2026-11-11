"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { initInstall } from "@/lib/install";
import { hydrate } from "@/lib/store";
import { Toaster } from "./ui";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    hydrate();
    initInstall();
    // Service worker hanya untuk halaman offline, dan hanya di build produksi supaya dev tidak ter-cache.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster />
    </MotionConfig>
  );
}
