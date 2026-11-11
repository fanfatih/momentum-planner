"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";
import { resolveTheme, type ThemeId } from "@/lib/invitation-themes";
import type { InvitationContent, InvitationEvent } from "@/lib/types";
import { BlushCluster, MarunBottomCluster, MarunSprig, MarunTopCluster, WildflowerSprig, WildflowerSpray, WildflowerWave } from "./art";
import {
  Countdown,
  EventDateStack,
  EventIcons,
  firstName,
  GiftCard,
  RsvpForm,
  scriptSize,
  Section,
  Wishes,
} from "./sections";
import "./invitation.css";

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

const Open = () => (
  <a href="#mempelai" className={buttonClass("primary")}>
    Buka undangan
  </a>
);

function BlushCover({ main, bride, groom, guestName }: CoverProps) {
  const b = firstName(bride);
  const g = firstName(groom);
  return (
    <section aria-label="Sampul" className="bl-cover">
      <BlushCluster className="bl-fl bl-fl-tr" />
      <BlushCluster className="bl-fl bl-fl-bl" />
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
      <MarunTopCluster className="mr-fl mr-fl-top" />
      <MarunBottomCluster className="mr-fl mr-fl-bot" />
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
      <WildflowerSpray className="wf-spray" />
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
      {id === "marun" && <MarunSprig className="mr-sprig" />}
      {id === "wildflower" && <WildflowerSprig className="wf-sprig" />}
    </>
  );

  const events: { key: string; title: string; ev: InvitationEvent }[] = [];
  if (hasAkad) events.push({ key: "akad", title: "Akad nikah", ev: c.akad });
  if (hasResepsi) events.push({ key: "resepsi", title: "Resepsi", ev: c.resepsi });

  return (
    <main className={`phone-frame inv inv-${id}`}>
      {preview && (
        <p role="note" className="relative z-10 m-0 bg-butter px-4 py-2 text-center text-sm font-medium text-ink">
          Pratinjau. Hanya kamu yang melihat tampilan ini, tamu membukanya lewat link undangan.
        </p>
      )}

      {id === "blush" && <BlushCover {...cover} />}
      {id === "marun" && <MarunCover {...cover} />}
      {id === "wildflower" && <WildCover {...cover} />}

      <div className="relative z-[1] pt-8">
        <Section id="mempelai" label="Mempelai" title="Mempelai" orn={ornament}>
          {id === "blush" && <BlushCluster className="bl-sprig" style={{ top: "-9%", right: "-20%", width: "52%" }} />}
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
                id === "marun" ? (
                  <div key={key} className="mr-event inv-event">
                    <h3 className="inv-sub">{title}</h3>
                    <div className="mt-3">
                      <EventDateStack ev={ev} />
                    </div>
                  </div>
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
          {id === "blush" && <BlushCluster className="bl-sprig" style={{ bottom: "-7%", left: "-20%", width: "52%", transform: "rotate(180deg)" }} />}
          <RsvpForm slug={slug} defaultName={guestName} preview={preview} onSent={() => setWishKey((k) => k + 1)} />
        </Section>

        <Section label="Ucapan" title="Ucapan" orn={ornament}>
          <Wishes slug={slug} refreshKey={wishKey} preview={preview} />
        </Section>

        <Section label="Penutup" title={firstName(bride) + " & " + firstName(groom)} orn={ornament}>
          <p className="t-body inv-lead m-0">{c.closing}</p>
        </Section>
      </div>

      <footer className="inv-footer">Dibuat dengan Momentum Planner</footer>
    </main>
  );
}

