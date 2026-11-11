import { ImageResponse } from "next/og";
import { getPublicInvitation } from "@/lib/public-invitation";

export const alt = "Undangan pernikahan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const first = (s: string) => s.trim().split(/\s+/)[0] || s;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const inv = await getPublicInvitation(slug);
  const names = inv ? `${first(inv.content.brideFull)} & ${first(inv.content.groomFull)}` : "Undangan pernikahan";
  const iso = inv?.content.akad.date || inv?.content.resepsi.date || "";
  let date = "";
  if (iso) {
    const [y, m, d] = iso.split("-").map(Number);
    date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(y, m - 1, d)),
    );
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#b93636",
          color: "#faf7f0",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase" }}>Undangan pernikahan</div>
        <div style={{ fontSize: 110, fontWeight: 700, marginTop: 28, textAlign: "center", padding: "0 60px" }}>{names}</div>
        {date && <div style={{ fontSize: 40, marginTop: 28 }}>{date}</div>}
      </div>
    ),
    size,
  );
}
