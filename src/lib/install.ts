"use client";

import { useSyncExternalStore } from "react";

/** Event bawaan Chrome dan Edge di Android dan desktop. Safari di iPhone tidak punya, jadi perlu panduan manual. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallState {
  /** Sudah dibuka sebagai aplikasi terpasang, tidak perlu ajakan lagi. */
  installed: boolean;
  /** Browser menyediakan dialog pasang langsung. */
  canPrompt: boolean;
  ios: boolean;
}

const SERVER: InstallState = { installed: true, canPrompt: false, ios: false };

let deferred: InstallPromptEvent | null = null;
let snap: InstallState = SERVER;
let started = false;
const listeners = new Set<() => void>();

function compute(): InstallState {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios =
    /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return { installed: standalone, canPrompt: deferred !== null, ios };
}

function refresh() {
  const next = compute();
  if (next.installed !== snap.installed || next.canPrompt !== snap.canPrompt || next.ios !== snap.ios) {
    snap = next;
    listeners.forEach((l) => l());
  }
}

/** Dipanggil sekali dari Providers. Event pasang harus ditangkap sedini mungkin. */
export function initInstall() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    refresh();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    snap = { ...compute(), installed: true };
    listeners.forEach((l) => l());
  });
  window.matchMedia("(display-mode: standalone)").addEventListener("change", refresh);
  snap = compute();
  listeners.forEach((l) => l());
}

/** "manual" artinya browser tidak punya dialog pasang, tampilkan panduan langkah. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "manual"> {
  if (!deferred) return "manual";
  const ev = deferred;
  deferred = null;
  refresh();
  try {
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    return outcome;
  } catch {
    return "manual";
  }
}

export function useInstall(): InstallState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snap,
    () => SERVER,
  );
}
