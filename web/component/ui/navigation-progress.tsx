"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

NProgress.configure({ showSpinner: false, minimum: 0.15, trickleSpeed: 200 });

/**
 * ページ遷移中に画面上部へ NProgress のバーを表示する。
 * 開始は instrumentation-client.ts の onRouterTransitionStart から届くイベント、
 * 完了は pathname / searchParams の変化で検知する。ルートレイアウトに 1 つだけ置く。
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function onStart(event: Event) {
      const { url } = (event as CustomEvent<{ url: string }>).detail;
      const target = new URL(url, window.location.href);
      // 同じページ内の移動(ハッシュのみ等)では表示しない。
      if (target.pathname + target.search === window.location.pathname + window.location.search) return;
      NProgress.start();
      // 完了を検知できなかった場合(遷移の中断など)の保険。
      clearTimeout(fallback.current);
      fallback.current = setTimeout(() => NProgress.done(), 15000);
    }
    window.addEventListener("chahub:navigation-start", onStart);
    return () => { window.removeEventListener("chahub:navigation-start", onStart); clearTimeout(fallback.current); };
  }, []);

  useEffect(() => {
    clearTimeout(fallback.current);
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}
