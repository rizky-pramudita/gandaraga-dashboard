# gandaraga-dashboard — Assistant Admin UI

React + TypeScript (Vite) single-page admin for the
[gandaraga-rizkeeps](../gandaraga-rizkeeps) assistant backend. Create channels,
attach Markdown knowledge, bind chats, toggle commands, dry-run `/ask`, and
watch activity.

## Stack

- React 18 + TypeScript, Vite 4 (Node 16 compatible)
- React Router 6
- Plain CSS (no component library) — dark admin theme
- Token-based auth: the operator's `ADMIN_TOKEN` is stored in `localStorage` and
  sent as `Authorization: Bearer <token>` on every request.

## Screens

- **Dashboard** — channel/doc/binding counts, connector status, recent activity.
- **Channels** — list with counts, create channel.
- **Channel detail** — tabs:
  - *Knowledge*: upload `.md` (file or paste), list with version, delete.
  - *Bindings*: bind a connector + chat_id + label, list, unbind.
  - *Commands*: toggle each command, edit the fallback message.
  - *Test*: dry-run a command and preview the bot's reply.
- **Connectors** — status + "Link WhatsApp".
- **Activity** — filterable audit log.

## Configure

Copy `.env.example` to `.env`:

```bash
VITE_API_BASE="http://localhost:8080"   # the rizkeeps API URL
```

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

Sign in with the backend's `ADMIN_TOKEN`. Make sure the backend's
`CORS_ORIGINS` includes this dev URL (it does by default).

## Build

```bash
npm run build    # type-checks then bundles to dist/
npm run preview  # serve the production build locally
```

## Deploy to Vercel

Framework preset: **Vite**. `vercel.json` rewrites all routes to `index.html`
for client-side routing. Set the environment variable `VITE_API_BASE` to your
deployed backend URL. Ensure the backend's `CORS_ORIGINS` includes this
dashboard's Vercel URL.
