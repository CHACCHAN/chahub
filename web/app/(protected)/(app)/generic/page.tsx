import { redirect } from "next/navigation";

// サービスの一覧はホームとサイドバーが担当するため、/generic 単体では表示しない。
export default async function GenericIndexPage() {
  redirect("/");
}
