"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BottomNav, DemoRibbon, StorageNotice } from "@/components/shell";
import { PromoPopup } from "@/components/promo";
import { LoadingState } from "@/components/ui";
import { COUPLE_ROLES, modeOf, PLANNER_ONLY, useCurrentWedding, useGuard } from "@/lib/guard";

export default function CoupleLayout({ children }: { children: ReactNode }) {
  const { ready } = useGuard(COUPLE_ROLES);
  const wedding = useCurrentWedding();
  const pathname = usePathname();
  const router = useRouter();
  const onboarding = pathname === "/mulai";
  const mode = wedding ? modeOf(wedding) : null;
  const needsOnboarding = ready && !!wedding && !onboarding && (!mode || (mode === "planner" && !wedding.track));
  // Mode undangan tidak punya halaman planner, jadi dialihkan ke undangan.
  const wrongPlace = ready && mode === "undangan" && PLANNER_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (ready && !wedding) router.replace("/masuk");
    else if (needsOnboarding) router.replace("/mulai");
    else if (wrongPlace) router.replace("/undangan");
  }, [ready, wedding, needsOnboarding, wrongPlace, router]);

  const show = ready && !!wedding && !needsOnboarding && !wrongPlace;

  return (
    <div className="phone-frame">
      <DemoRibbon />
      <StorageNotice />
      {show ? (
        <main className={onboarding ? "pb-12" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"}>{children}</main>
      ) : (
        <main>
          <LoadingState what="proyek pernikahanmu" />
        </main>
      )}
      {show && !onboarding && wedding && <PromoPopup wedding={wedding} />}
      {show && !onboarding && <BottomNav mode={mode ?? "planner"} />}
    </div>
  );
}
