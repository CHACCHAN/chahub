"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return <SonnerToaster
    position="top-right"
    theme="system"
    duration={4500}
    closeButton
    richColors
    visibleToasts={3}
    gap={12}
    offset={24}
    mobileOffset={16}
    containerAriaLabel="通知"
    toastOptions={{
      closeButtonAriaLabel: "通知を閉じる",
      style: { borderRadius: "14px", fontFamily: "inherit" },
    }}
  />;
}
