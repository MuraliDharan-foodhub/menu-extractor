# Menu Extractor

An AI-powered menu digitization tool built with **Next.js 14**, **Google Cloud Vision API**, and **shadcn/ui**. Upload a photo of any restaurant menu and it extracts categories, items, prices, and dietary tags into an interactive editable form, then publishes the structured data to a REST backend.

---

## Features

- 📸 Drag-and-drop image upload (JPEG / PNG / WebP, max 10 MB)
- 🤖 Google Cloud Vision OCR via OAuth2 refresh-token auth
- 🧠 Intelligent text parser: categories, prices, dietary tags, descriptions
- ✏️ Interactive editor with drag-and-drop reordering (dnd-kit)
- ↩️ Undo / redo history (Zustand)
- ✅ Zod validation + React Hook Form
- 💾 JSON file–based menu repository (`data/menus.json`)
- 🛠 Full REST API: `GET/POST /api/menus`, `GET/PUT/DELETE /api/menus/:id`
- 🎨 shadcn/ui components + Tailwind CSS
- 🧪 Jest unit tests for the menu parser

---

## Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- A Google Cloud project with **Vision API** enabled
- OAuth2 credentials (Client ID, Client Secret, Refresh Token)

---

## Installation

```bash
git clone https://github.com/your-org/menu-extractor.git
cd menu-extractor
pnpm install
cp .env.example .env.local
# Fill in your Google credentials in .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret |
| `GOOGLE_REFRESH_TOKEN` | Long-lived refresh token (see setup below) |

---

## Google Cloud Vision OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Enable APIs** → Enable **Cloud Vision API**.
2. Create **OAuth 2.0 Client credentials** (Desktop app type).
3. Obtain a refresh token using the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
   - Authorize `https://www.googleapis.com/auth/cloud-vision`
   - Exchange the authorization code for tokens
   - Copy the **Refresh Token**
4. Add all three values to `.env.local`.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint check |
| `pnpm test` | Run Jest unit tests |

---

## API Reference

### `POST /api/extract`
Extract menu from an uploaded image.

**Request:** `multipart/form-data` with field `image` (File).  
**Response:** `ExtractedMenu` JSON.

---

### `GET /api/menus`
List all saved menus.

---

### `POST /api/menus`
Save an extracted menu.

**Request body:** `ExtractedMenu` JSON.  
**Response:** `Menu` JSON (with `id`, `createdAt`, `updatedAt`).

---

### `GET /api/menus/:id`
Fetch a specific menu by ID.

---

### `PUT /api/menus/:id`
Update a menu (partial update supported).

---

### `DELETE /api/menus/:id`
Delete a menu.

---

## Project Structure

```
app/              Next.js App Router pages + API routes
components/       UI and feature components
  ui/             shadcn/ui base components
hooks/            Zustand store
lib/              Google Vision client, menu parser, repository, validation
types/            TypeScript type definitions
__tests__/        Jest unit tests
data/             Runtime menu storage (menus.json, gitignored)
```

---

## Deployment (Vercel)

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add the three environment variables in **Project Settings → Environment Variables**.
4. Deploy.

> **Note:** The `JsonFileMenuRepository` writes to `data/menus.json` on the local filesystem. On Vercel (ephemeral filesystem) this will reset between deployments. For production, replace it with a database-backed repository (e.g. Postgres via Prisma, or Vercel KV).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Token refresh failed" | Check `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` values |
| "Vision API error: 403" | Ensure Vision API is enabled in your Google Cloud project |
| "No text found in image" | Use a clearer, higher-resolution photo with good lighting |
| Build error with `next.config.ts` | Rename to `next.config.mjs` (Next.js 14 requires `.js` or `.mjs`) |
