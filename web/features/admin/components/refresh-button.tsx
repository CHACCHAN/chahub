"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/component/ui";

/** 現在のページをサーバーで再取得する。 */
export function RefreshButton({ children = "再読み込み" }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button variant="secondary" pending={pending} pendingLabel="更新中…" onClick={() => startTransition(() => router.refresh())}>
    <Icon path="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />{children}
  </Button>;
}
