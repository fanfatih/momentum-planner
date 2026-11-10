"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Template dipasang ulang tiap pindah rute, jadi animasi masuk berjalan di setiap halaman.
export default function CoupleTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
