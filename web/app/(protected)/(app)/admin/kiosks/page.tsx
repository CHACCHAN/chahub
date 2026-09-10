import { getAdminPageUser } from "@/features/admin/access";
import { listKiosks } from "@/features/kiosk/admin";
import { KioskItem } from "@/features/kiosk/components/kiosk-forms";
import { PageHeader, Card, List } from "@/component/ui";

export default async function KiosksPage() {
  await getAdminPageUser();
  const kiosks = await listKiosks();
  const online = kiosks.filter(kiosk => kiosk.online).length;
  return <>
    <PageHeader title="キオスク端末" description="Free Kiosk で /kiosk-connect を開くと自動登録されます。端末名・設置場所の編集や、接続の有効／無効を管理できます。" />
    <Card as="section" title="登録済みのキオスク端末" meta={`${kiosks.length} 台(訪問中 ${online})`} divided
      description={<>見守り・ビデオ通話の相手として選べるのは、いまサイトを訪問中の端末だけです。無効にすると接続を止められます。</>}>
      <List empty="キオスク端末はまだありません。Free Kiosk で /kiosk-connect を開いてください。">
        {kiosks.map(kiosk => <KioskItem key={kiosk.deviceId} kiosk={kiosk} />)}
      </List>
    </Card>
  </>;
}
