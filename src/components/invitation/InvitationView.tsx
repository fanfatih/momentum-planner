"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";
import { resolveTheme, type ThemeId } from "@/lib/invitation-themes";
import type { InvitationContent, InvitationEvent } from "@/lib/types";
import {
  BlushCluster,
  GoldCrest,
  GoldDivider,
  GoldVine,
  MarunBottomCluster,
  MarunSprig,
  MarunTopCluster,
  WildflowerSprig,
  WildflowerSpray,
  WildflowerWave,
  ZaitunHang,
  ZaitunSprig,
} from "./art";
import {
  Countdown,
  dayNumber,
  EventDateStack,
  EventIcons,
  firstName,
  Gallery,
  GiftCard,
  monthNumber,
  RsvpForm,
  scriptSize,
  Section,
  weekdayName,
  Wishes,
  yearNumber,
} from "./sections";
import { Ambient, Bloom, Curtain, Grow, Parallax, StillContext } from "./motion";
import { MusicDock, OpenContext, useMusic, useOpen } from "./music";
import "./invitation.css";

const AMBIENT = { blush: "petal", marun: "gold", wildflower: "pollen", zaitun: "leaf", malam: "star" } as const;

const eventDateLabel = (iso: string) => `${dayNumber(iso)}-${monthNumber(iso)}-${yearNumber(iso)}`;

interface CoverProps {
  c: InvitationContent;
  guestName: string;
  main: InvitationEvent;
  bride: string;
  groom: string;
}

function Guest({ name }: { name: string }) {
  if (!name) return null;
  return (
    <div className="inv-guest">
      <p className="text-[14px] text-ink-soft">Kepada Yth.</p>
      <p className="mt-1 break-words text-[22px] font-semibold text-ink">{name}</p>
    </div>
  );
}

function Open() {
  const onOpen = useOpen();
  return (
    <a href="#mempelai" className={buttonClass("primary")} onClick={onOpen}>
      Buka undangan
    </a>
  );
}

function BlushCover({ main, bride, groom, guestName }: CoverProps) {
  const b = firstName(bride);
  const g = firstName(groom);
  return (
    <section aria-label="Sampul" className="bl-cover">
      <Parallax className="bl-fl bl-fl-tr" y={[0, 80]} x={[0, 26]} rotate={[0, 9]}>
        <BlushCluster className="block w-full" />
      </Parallax>
      <Parallax className="bl-fl bl-fl-bl" y={[0, -80]} x={[0, -26]} rotate={[0, 9]}>
        <BlushCluster className="block w-full" />
      </Parallax>
      <div className="bl-oval inv-rise">
        <p className="t-caps m-0">
          Bersama keluarga
          <br />
          kami mengundang
        </p>
        <h1 className="bl-names t-script m-0" aria-label={`${b} dan ${g}`}>
          <span style={{ fontSize: scriptSize(b, 76) }}>{b}</span>
          <span className="amp" aria-hidden="true">
            &amp;
          </span>
          <span style={{ fontSize: scriptSize(g, 76) }}>{g}</span>
        </h1>
        <p className="t-caps m-0">
          Anda ke acara
          <br />
          pernikahan kami
        </p>
        {(main.date || main.place) && <EventIcons ev={main} withMaps={false} />}
        <Guest name={guestName} />
        <Open />
      </div>
    </section>
  );
}

function MarunCover({ main, bride, groom, guestName }: CoverProps) {
  const b = firstName(bride);
  const g = firstName(groom);
  return (
    <section aria-label="Sampul" className="mr-cover">
      <div className="mr-ribbon" aria-hidden="true" />
      <div className="mr-arch" aria-hidden="true" />
      <Parallax className="mr-fl mr-fl-top" y={[0, 60]} x={[0, -22]} rotate={[0, -5]}>
        <MarunTopCluster className="block w-full" />
      </Parallax>
      <Parallax className="mr-fl mr-fl-bot" y={[0, -60]} x={[0, 22]} rotate={[0, 5]}>
        <MarunBottomCluster className="block w-full" />
      </Parallax>
      <div className="mr-content inv-rise">
        <p className="t-caps m-0">Undangan pernikahan</p>
        <h1 className="t-script m-0 text-brand" style={{ lineHeight: 1.02 }} aria-label={`${b} dan ${g}`}>
          <span style={{ fontSize: scriptSize(b, 62) }}>{b}</span>
          <span className="my-1 block text-[26px]" aria-hidden="true">
            dan
          </span>
          <span style={{ fontSize: scriptSize(g, 62) }}>{g}</span>
        </h1>
        <div className="w-full">
          <EventDateStack ev={main} compact />
        </div>
        <Guest name={guestName} />
        <Open />
      </div>
    </section>
  );
}

function WildCover({ main, bride, groom, guestName }: CoverProps) {
  const b = firstName(bride);
  const g = firstName(groom);
  return (
    <section aria-label="Sampul" className="wf-cover">
      <WildflowerWave className="wf-wave" />
      <Parallax className="wf-spray" y={[0, -110]} rotate={[0, -7]} origin="100% 100%">
        <WildflowerSpray className="block w-full" />
      </Parallax>
      <div className="wf-top inv-rise">
        <p className="t-caps m-0">Kami mengundang Anda ke</p>
        <p className="t-script m-0" style={{ fontSize: 66, lineHeight: 1.05, color: "var(--gold)" }}>
          pernikahan
        </p>
        <h1 className="wf-names m-0" aria-label={`${b} dan ${g}`} style={{ fontSize: b.length > 9 || g.length > 9 ? 26 : 34 }}>
          {b}
          <span className="my-2 block text-[15px] font-medium normal-case italic tracking-[0.1em]" aria-hidden="true">
            dan
          </span>
          {g}
        </h1>
      </div>
      <div className="wf-bottom">
        {(main.date || main.place) && <EventIcons ev={main} withMaps={false} />}
        <Guest name={guestName} />
        <div>
          <Open />
        </div>
      </div>
    </section>
  );
}

function ZaitunCover({ main, bride, groom, guestName }: CoverProps) {
  const b = firstName(bride);
  const g = firstName(groom);
  return (
    <section aria-label="Sampul" className="zt-cover">
      <Parallax className="zt-hang zt-hang-l" y={[0, 50]} rotate={[0, -4]} origin="0% 0%">
        <ZaitunHang className="block w-full" />
      </Parallax>
      <Parallax className="zt-hang zt-hang-r" y={[0, 50]} rotate={[0, -4]} origin="0% 0%">
        <ZaitunHang className="block w-full" />
      </Parallax>
      <Parallax className="zt-foot" y={[0, -50]} rotate={[0, 4]}>
        <ZaitunHang className="block w-full" />
      </Parallax>
      <div className="zt-window inv-rise">
        <p className="t-caps m-0">Undangan pernikahan</p>
        <h1 className="zt-names" aria-label={`${b} dan ${g}`}>
          <span style={{ fontSize: scriptSize(b, 68) }}>{b}</span>
          <span className="amp" aria-hidden="true">
            &amp;
          </span>
          <span style={{ fontSize: scriptSize(g, 68) }}>{g}</span>
        </h1>
        {main.date && (
          <div>
            <p className="t-caps m-0 mb-2">{weekdayName(main.date)}</p>
            <div className="zt-date" aria-label={eventDateLabel(main.date)}>
              <span>{dayNumber(main.date)}</span>
              <i aria-hidden="true" />
              <span>{monthNumber(main.date)}</span>
              <i aria-hidden="true" />
              <span>{yearNumber(main.date)}</span>
            </div>
            {main.time && <p className="m-0 mt-2 text-[14px] text-ink-soft">Pukul {main.time}</p>}
          </div>
        )}
        {main.place && <p className="m-0 text-[17px] font-semibold italic text-ink">{main.place}</p>}
        <Guest name={guestName} />
        <Open />
      </div>
    </section>
  );
}

const STARS: [number, number][] = [
  [12, 9],
  [86, 7],
  [22, 22],
  [78, 26],
  [8, 41],
  [92, 46],
  [15, 63],
  [88, 70],
  [30, 88],
  [70, 90],
];

function MalamCover({ main, bride, groom, guestName }: CoverProps) {
  const b = firstName(bride);
  const g = firstName(groom);
  return (
    <section aria-label="Sampul" className="me-cover">
      {STARS.map(([x, y], i) => (
        <span key={i} aria-hidden="true" className="me-star" style={{ left: `${x}%`, top: `${y}%`, transform: `scale(${0.6 + (i % 4) / 4})` }} />
      ))}
      <div className="me-arch" aria-hidden="true" />
      <Parallax className="me-crest" y={[0, 40]}>
        <GoldCrest className="block w-full" />
      </Parallax>
      <Parallax className="me-vine me-vine-l" y={[0, -40]} x={[0, 14]}>
        <GoldVine className="block w-full" />
      </Parallax>
      <Parallax className="me-vine me-vine-r" y={[0, -40]} x={[0, 14]}>
        <GoldVine className="block w-full" />
      </Parallax>
      <div className="me-content inv-rise">
        <p className="t-caps m-0">Undangan pernikahan</p>
        <h1 className="t-script m-0" style={{ color: "var(--gold)", lineHeight: 1.04 }} aria-label={`${b} dan ${g}`}>
          <span style={{ fontSize: scriptSize(b, 66) }}>{b}</span>
          <span className="my-1 block text-[22px]" aria-hidden="true" style={{ fontFamily: "Cinzel, serif" }}>
            &amp;
          </span>
          <span style={{ fontSize: scriptSize(g, 66) }}>{g}</span>
        </h1>
        <div className="w-full">
          <EventDateStack ev={main} compact />
        </div>
        <Guest name={guestName} />
        <Open />
      </div>
    </section>
  );
}

export function InvitationView({
  content: c,
  slug,
  theme,
  guestName = "",
  preview = false,
}: {
  content: InvitationContent;
  slug: string;
  theme?: string;
  guestName?: string;
  preview?: boolean;
}) {
  const [wishKey, setWishKey] = useState(0);
  const music = useMusic(c.musicUrl ?? "");
  const photos = c.photos ?? [];
  const t = resolveTheme(theme);
  const id: ThemeId = t.id;
  const bride = c.brideFull.trim() || "Mempelai wanita";
  const groom = c.groomFull.trim() || "Mempelai pria";
  const hasAkad = !!(c.akad.date || c.akad.place || c.akad.time);
  const hasResepsi = c.hasResepsi && !!(c.resepsi.date || c.resepsi.place || c.resepsi.time);
  const gifts = c.gifts.filter((g) => g.number.trim());
  const main = hasAkad ? c.akad : c.resepsi;
  const cover: CoverProps = { c, guestName, main, bride, groom };

  const ornament = (
    <>
      {id === "marun" && (
        <Grow className="mr-sprig">
          <MarunSprig className="block w-full" />
        </Grow>
      )}
      {id === "wildflower" && (
        <Grow axis="y" className="wf-sprig">
          <WildflowerSprig className="block w-full" />
        </Grow>
      )}
      {id === "zaitun" && (
        <Grow axis="y" className="zt-sprig">
          <ZaitunSprig className="block w-full" />
        </Grow>
      )}
      {id === "malam" && (
        <Grow className="me-divider">
          <GoldDivider className="block w-full" />
        </Grow>
      )}
    </>
  );

  const events: { key: string; title: string; ev: InvitationEvent }[] = [];
  if (hasAkad) events.push({ key: "akad", title: "Akad nikah", ev: c.akad });
  if (hasResepsi) events.push({ key: "resepsi", title: "Resepsi", ev: c.resepsi });

  return (
    <OpenContext.Provider value={music.start}>
    <main className={`phone-frame inv inv-${id}`}>
      {preview && (
        <p role="note" className="inv-note relative z-10 m-0 bg-butter px-4 py-2 text-center text-sm font-medium">
          Pratinjau. Hanya kamu yang melihat tampilan ini, tamu membukanya lewat link undangan.
        </p>
      )}

      <Ambient kind={AMBIENT[id]} />
      {id === "blush" && <BlushCover {...cover} />}
      {id === "marun" && <MarunCover {...cover} />}
      {id === "wildflower" && <WildCover {...cover} />}
      {id === "zaitun" && <ZaitunCover {...cover} />}
      {id === "malam" && <MalamCover {...cover} />}

      <div className="relative z-[1] pt-8">
        <Section id="mempelai" label="Mempelai" title="Mempelai" orn={ornament}>
          {id === "blush" && (
            <Bloom className="bl-sprig" style={{ top: "-9%", right: "-20%", width: "52%" }}>
              <BlushCluster className="block w-full" />
            </Bloom>
          )}
          <div className="inv-gap">
            <p className="t-body inv-lead m-0">
              {c.opening.trim() || "Dengan penuh syukur, kami mengundang Anda untuk hadir dan berbagi kebahagiaan di hari pernikahan kami."}
            </p>
            <div>
              <p className="inv-name">{bride}</p>
              {c.brideParents && <p className="inv-parents">{c.brideParents}</p>}
              <p className="inv-name inv-amp" aria-hidden="true">
                &amp;
              </p>
              <p className="inv-name">{groom}</p>
              {c.groomParents && <p className="inv-parents">{c.groomParents}</p>}
            </div>
          </div>
        </Section>

        {events.length > 0 && (
          <Section id="acara" label="Acara" title="Acara" orn={ornament}>
            <div className="inv-gap">
              {events.map(({ key, title, ev }) =>
                id === "marun" || id === "malam" ? (
                  <Curtain key={key} className={`${id === "marun" ? "mr-event" : "me-event"} inv-event`}>
                    <h3 className="inv-sub">{title}</h3>
                    <div className="mt-3">
                      <EventDateStack ev={ev} />
                    </div>
                  </Curtain>
                ) : (
                  <div key={key} className="inv-event">
                    <h3 className="inv-sub">{title}</h3>
                    <EventIcons ev={ev} />
                  </div>
                ),
              )}
            </div>
            <Countdown iso={c.akad.date || c.resepsi.date} />
          </Section>
        )}

        {photos.length > 0 && (
          <Section id="galeri" label="Galeri" title="Galeri" orn={ornament}>
            <Gallery photos={photos} />
          </Section>
        )}

        {gifts.length > 0 && (
          <Section label="Amplop digital" title="Amplop digital" orn={ornament}>
            <p className="t-body inv-lead m-0 mb-5">
              Doa restu Anda sudah menjadi hadiah terbaik. Bila ingin berbagi tanda kasih, bisa melalui rekening berikut.
            </p>
            <ul className="m-0 space-y-3 p-0">
              {gifts.map((g, i) => (
                <GiftCard key={i} {...g} />
              ))}
            </ul>
          </Section>
        )}

        <Section label="Konfirmasi kehadiran" title="Konfirmasi kehadiran" orn={ornament}>
          {id === "blush" && (
            <Bloom className="bl-sprig" style={{ bottom: "-7%", left: "-20%", width: "52%" }} from={16}>
              <BlushCluster className="block w-full" style={{ transform: "rotate(180deg)" }} />
            </Bloom>
          )}
          <RsvpForm slug={slug} defaultName={guestName} preview={preview} onSent={() => setWishKey((k) => k + 1)} />
        </Section>

        <Section label="Ucapan" title="Ucapan" orn={ornament}>
          <Wishes slug={slug} refreshKey={wishKey} preview={preview} />
        </Section>

        <Section label="Penutup" title={firstName(bride) + " & " + firstName(groom)} orn={ornament}>
          <p className="t-body inv-lead m-0">{c.closing}</p>
        </Section>
      </div>

      <footer className="inv-footer">
        Dibuat dengan Momentum Planner
        {!preview && (
          <>
            {" "}
            <a href="/privasi" className="underline underline-offset-4">
              Privasi
            </a>
          </>
        )}
      </footer>
      <MusicDock url={c.musicUrl ?? ""} title={c.musicTitle ?? ""} music={music} />
    </main>
    </OpenContext.Provider>
  );
}


/** Sampul saja, dipakai sebagai miniatur live di katalog tema. Tanpa gerak dan tidak bisa diklik. */
export function InvitationCover({ content: c, theme }: { content: InvitationContent; theme?: string }) {
  const id = resolveTheme(theme).id;
  const bride = c.brideFull.trim() || "Mempelai wanita";
  const groom = c.groomFull.trim() || "Mempelai pria";
  const hasAkad = !!(c.akad.date || c.akad.place || c.akad.time);
  const main = hasAkad ? c.akad : c.resepsi;
  const cover: CoverProps = { c, guestName: "Nama Tamu", main, bride, groom };
  return (
    <StillContext.Provider value>
      <div className={`inv inv-${id} inv-mini`}>
        {id === "blush" && <BlushCover {...cover} />}
        {id === "marun" && <MarunCover {...cover} />}
        {id === "wildflower" && <WildCover {...cover} />}
        {id === "zaitun" && <ZaitunCover {...cover} />}
        {id === "malam" && <MalamCover {...cover} />}
      </div>
    </StillContext.Provider>
  );
}
