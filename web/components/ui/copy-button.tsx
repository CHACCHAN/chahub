"use client";

import { useEffect, useState } from "react";
import { Button, type ButtonProps } from "./button";
import { Icon } from "./icon";

/** テキストをクリップボードにコピーするボタン。成功すると 2 秒間「コピーしました」に変わります。 */
export function CopyButton({ text, label = "コピー", className = "", ...props }: Omit<ButtonProps, "onClick" | "children"> & { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt("コピーできませんでした。手動でコピーしてください。", text);
    }
  }
  return <Button variant="secondary" {...props} onClick={copy} aria-live="polite" className={`min-h-9 px-3 py-1.5 text-xs ${className}`}>
    <Icon path={copied ? "M20 6 9 17l-5-5" : "M8 4h10a2 2 0 0 1 2 2v10M6 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"} className="size-3.5" />
    {copied ? "コピーしました" : label}
  </Button>;
}
