const time = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Tokyo" });
export const formatLiveKitTime = (iso: string | null) => iso ? time.format(new Date(iso)) : "—";

