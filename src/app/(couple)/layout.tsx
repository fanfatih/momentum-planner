"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BottomNav, DemoRibbon, StorageNotice } from "@/components/shell";
import { PromoPopup } from "@/components/promo";
import { LoadingState } from "@/components/ui";
import { COUPLE_ROLES, useCurrentWedding, useGuard } from "@/lib/guard";

export default function CoupleLayout({ children }: { children: ReactNode }) {
  const { ready } = useGuard(COUPLE_ROLES);
  const wedding = useCurrentWedding();
  const pathname = usePathname();
  const router = useRouter();
  const onboarding = pathname === "/mulai";
  const needsOnboarding = ready && !!wedding && !wedding.track && !onboarding;

  useEffect(() => {
    if (ready && !wedding) router.replace("/masuk");
    else if (needsOnboarding) router.replace("/mulai");
  }, [ready, wedding, needsOnboarding, router]);

  const show = ready && !!wedding && !needsOnboarding;

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
      {show && !onboarding && <BottomNav />}
    </div>
  );
}
