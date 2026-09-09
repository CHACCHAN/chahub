<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Shared UI

Reusable presentational components belong in `components/ui/` and should be shared across pages. Prefer the existing Button, TextLink, Card/CardLink, List/ListItem, Input, Select, Badge, Icon, PageHeader and Spinner over duplicating their styles. Keep components at a useful size (a Card with title/meta/description/action, a List with an empty state) rather than splitting them into many tiny pieces. Keep authentication, database access and domain actions in feature components or services. Follow `components/ui/README.md` for usage.
