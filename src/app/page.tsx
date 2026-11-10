"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/ui";
import { homeFor } from "@/lib/guard";
import { useApp, useMeta } from "@/lib/store";

export default function RootPage() {
  const { hydrated } = useMeta();
  const session = useApp((s) => s.session);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(session ? homeFor(session.role) : "/masuk");
  }, [hydrated, session, router]);

  return (
    <main className="phone-frame">
      <LoadingState what="sesi kamu" />
    </main>
  );
}
