// 端末種別の起点と、複数の画面から参照するサービスの入口。
export const routes = {
  app: "/",
  kiosk: "/kiosk",
  kioskConnect: "/kiosk-connect",
  kioskMonitor: "/generic/kiosks",
} as const;
