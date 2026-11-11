import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationView } from "@/components/invitation/InvitationView";
import { DemoInvitation } from "@/components/invitation/DemoInvitation";
import { REMOTE } from "@/lib/mode";
import { getPublicInvitation } from "@/lib/public-invitation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
};

const guestFrom = (to: string | string[] | undefined) => {
  const raw = Array.isArray(to) ? to[0] : to;
  return (raw ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
};

const first = (s: string) => s.trim().split(/\s+/)[0] || s;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const inv = await getPublicInvitation(slug);
  const robots = { index: false, follow: false };
  if (!inv) return { title: "Undangan pernikahan", robots };
  const c = inv.content;
  const title = `Undangan pernikahan ${first(c.brideFull)} & ${first(c.groomFull)}`;
  return {
    title,
    description: "Kami mengundang Anda untuk hadir di hari bahagia kami.",
    robots,
    openGraph: { title, description: "Kami mengundang Anda untuk hadir di hari bahagia kami.", type: "website" },
  };
}

export default async function InvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const guest = guestFrom((await searchParams).to);
  if (!REMOTE) return <DemoInvitation slug={slug} guestName={guest} />;
  const inv = await getPublicInvitation(slug);
  if (!inv) notFound();
  return <InvitationView content={inv.content} slug={inv.slug} guestName={guest} />;
}
