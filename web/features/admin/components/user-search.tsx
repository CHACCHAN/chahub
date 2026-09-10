import { Button, Input, TextLink } from "@/component/ui";

export function UserSearch({ query, path }: { query: string; path: string }) {
  return <form action={path} className="mb-6 flex flex-wrap items-end gap-3">
    <Input label="ユーザーを検索" wrapperClassName="min-w-0 flex-1" type="search" name="q" defaultValue={query} key={query} maxLength={200} placeholder="名前またはメールアドレス" />
    <Button type="submit">検索</Button>
    {query && <TextLink href={path} className="flex min-h-11 items-center px-2 font-normal text-zinc-500 dark:text-zinc-400">クリア</TextLink>}
  </form>;
}
