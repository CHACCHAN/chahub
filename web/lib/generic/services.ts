// 一般メニューに並べるサービス。サイドバー・ホーム・各ページで同じ定義を使う。
// Client Component からも読み込むため、サーバー専用モジュールを import しないこと。
export type GenericService = {
  href: string;
  title: string;
  description: string;
  icon: string;
  /** 自宅の外からでも使える見込みのサービス。 */
  away: boolean;
};

export const genericServices: GenericService[] = [
  { href: "/generic/messages", title: "伝言板", description: "家族へのメモや連絡を共有します。", away: true, icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/generic/shopping", title: "買い物リスト", description: "足りないものを追加して家族と共有します。", away: true, icon: "M6 6h15l-1.5 9h-12zM6 6 5 3H2M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" },
  { href: "/generic/schedule", title: "予定と天気", description: "今日の予定と天気予報をまとめて確認します。", away: true, icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
  { href: "/generic/status", title: "家の状態", description: "ドア・窓・室温などのセンサーの状態を確認します。", away: true, icon: "M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" },
  { href: "/generic/appliances", title: "家電の操作", description: "照明やエアコンなど、連携した家電をまとめて操作します。", away: true, icon: "M9 2v6M15 2v6M5 8h14v4a7 7 0 0 1-14 0zM12 19v3" },
  { href: "/generic/timer", title: "タイマー", description: "料理や洗濯のタイマーを確認します。", away: false, icon: "M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4l3 2M9 2h6" },
];

export function findService(href: string) {
  const service = genericServices.find(candidate => candidate.href === href);
  if (!service) throw new Error(`未登録のサービスです: ${href}`);
  return service;
}
