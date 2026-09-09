// App Router の遷移開始を NavigationProgress(components/ui/navigation-progress.tsx)へ通知する。
// このファイルは別バンドルとして読み込まれるため、NProgress 本体はここでは扱わずイベントで橋渡しする。
export function onRouterTransitionStart(url: string, navigationType: "push" | "replace" | "traverse") {
  window.dispatchEvent(new CustomEvent("chahub:navigation-start", { detail: { url, navigationType } }));
}
