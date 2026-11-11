"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/** Dipanggil tombol Buka undangan di sampul. Browser hanya mengizinkan suara setelah tamu menyentuh layar. */
export const OpenContext = createContext<() => void>(() => {});
export const useOpen = () => useContext(OpenContext);

export function useMusic(url: string) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = useCallback(() => {
    const a = ref.current;
    if (!a || !url || a.dataset.started === "1") return;
    a.dataset.started = "1";
    a.play().catch(() => setFailed(true));
  }, [url]);

  const toggle = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    a.dataset.started = "1";
    if (a.paused) a.play().catch(() => setFailed(true));
    else a.pause();
  }, []);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const on = () => setPlaying(true);
    const off = () => setPlaying(false);
    a.addEventListener("play", on);
    a.addEventListener("pause", off);
    return () => {
      a.removeEventListener("play", on);
      a.removeEventListener("pause", off);
      a.pause();
    };
  }, [url]);

  return { ref, playing, failed, start, toggle };
}

export function MusicDock({ url, title, music }: { url: string; title: string; music: ReturnType<typeof useMusic> }) {
  if (!url) return null;
  const label = music.playing ? "Jeda musik" : "Putar musik";
  return (
    <>
      <audio ref={music.ref} src={url} loop preload="none" />
      <div className="inv-music-dock">
        <button type="button" onClick={music.toggle} aria-label={title ? `${label}: ${title}` : label} aria-pressed={music.playing} className="inv-music" data-playing={music.playing || undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {music.playing ? (
              <>
                <path d="M9 18V6l10-2v12" />
                <circle cx="6.5" cy="18" r="2.5" />
                <circle cx="16.5" cy="16" r="2.5" />
              </>
            ) : (
              <>
                <path d="M9 18V6l10-2v12" />
                <circle cx="6.5" cy="18" r="2.5" />
                <circle cx="16.5" cy="16" r="2.5" />
                <path d="M3 3l18 18" />
              </>
            )}
          </svg>
        </button>
      </div>
    </>
  );
}
