import { getAdminPageUser } from "@/lib/admin/access";
import { listKiosks, KIOSK_KEY_HEADER } from "@/lib/admin/kiosks";
import { CreateKioskForm, KioskItem } from "@/components/admin/kiosk-forms";
import { PageHeader, Card, List, TextLink } from "@/components/ui";

export default async function KiosksPage() {
  await getAdminPageUser();
  const kiosks = await listKiosks();
  const active = kiosks.filter(kiosk => kiosk.key?.status === "active").length;
  return <>
    <PageHeader title="キオスク端末" description="Android タブレット(Tauri)用の端末アカウントと API キーを管理します。端末は通常のユーザー(一般ユーザー)として扱われ、ユーザー一覧やロール・権限にも表示されます。" />
    <Card as="section" title="キオスク端末を追加" className="mb-6"
      description={<>端末ごとにアカウント(一般ユーザー)と API キーを作成します。作成直後に表示される情報を Tauri アプリのビルド時に埋め込んでください。端末は <code className="font-mono">{KIOSK_KEY_HEADER}</code> ヘッダーでキーを送ります。</>}>
      <CreateKioskForm />
    </Card>
    <Card as="section" title="登録済みのキオスク端末" meta={`${kiosks.length} 台(有効 ${active})`} divided
      description={<>ロールや所属の変更は<TextLink href="/admin/roles" className="mx-1">ロール・権限</TextLink>から行います。キーを無効にすると端末からの接続を一時停止できます。</>}>
      <List empty="キオスク端末はまだありません。上のフォームから追加してください。">
        {kiosks.map(kiosk => <KioskItem key={kiosk.userId} kiosk={kiosk} />)}
      </List>
    </Card>
  </>;
}
