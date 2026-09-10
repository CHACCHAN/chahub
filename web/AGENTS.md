<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Directory responsibilities

- `app/`: Next.js route entry points (`page.tsx`, `layout.tsx`, `route.ts`). Compose feature components and call feature services here; put extracted feature UI in its feature directory.
- `component/ui/`: Reusable UI independent of a particular feature (Card, Button, Input, etc.). Do not put authentication, database access or feature rules here. Follow `component/ui/README.md`.
- `component/layout/`: Shared layout parts such as the sidebar and navigation. Route-level layouts remain in `app/`.
- `features/<feature>/components/`: Feature-specific UI, including UI used on multiple routes. For example, kiosk connection, monitoring and kiosk administration components all belong to `features/kiosk/components/`.
- `features/<feature>/`: Logic, types, validation, data access and Server Actions belonging to that feature. Keep them with their UI rather than creating a matching domain directory under `lib/`. Route handlers, server pages and integration hooks may call these services as well.
- `lib/`: Common infrastructure and low-level helpers, such as Better Auth integration, trusted-origin handling and notification calls. Do not use this as a catch-all for feature logic.

Use the singular `component/` for shared components and plural `components/` inside each feature. Use `@/` imports across directory boundaries; short relative imports are appropriate inside a feature. Keep server-only services separate from client modules and avoid barrels that mix the two.

Prefer the existing Button, TextLink, Card/CardLink, List/ListItem, Input, Select, Badge, Icon, PageHeader and Spinner over duplicating their styles. Keep components at a useful size rather than splitting them into tiny pieces. Organize by responsibility without changing behavior as part of a move.
