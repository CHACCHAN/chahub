"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button, Icon } from "@/component/ui";
import { toast } from "@/lib/notifications";

export type AuthButtonProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
};

type Props = AuthButtonProps & {
  kind: "login" | "logout";
  onAction: () => Promise<void>;
};

export function AuthButton({ children, className = "", disabled = false, fullWidth = false, kind, onAction }: Props) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const login = kind === "login";

  async function handleClick() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await onAction();
      // Keep disabled until navigation completes.
    } catch {
      toast.error(`${login ? "ログイン" : "ログアウト"}できませんでした。もう一度お試しください。`);
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <div className={fullWidth ? "w-full" : "inline-flex max-w-full flex-col items-start"}>
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        pending={pending}
        fullWidth={fullWidth}
        variant={login ? "primary" : "secondary"}
        className={className}
      >
        {!pending && <Icon path={login ? "M14 4h5v16h-5M3 12h12m-4-4 4 4-4 4" : "M10 4H5v16h5m0-8h11m-4-4 4 4-4 4"} />}
        <span aria-live="polite">{pending ? (login ? "接続中…" : "ログアウト中…") : children ?? (login ? "ログイン" : "ログアウト")}</span>
      </Button>
    </div>
  );
}
