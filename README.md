"# PaintViz — Smart Wall Paint Visualizer

PaintViz is a full-stack room-colour preview tool. Users can upload a room
image, manually select multiple wall regions, preview catalogue or custom
colours, refine selections with a brush and eraser, save designs, reopen them,
and download PNG previews.

## Features

- JWT authentication with protected user-owned designs.
- JPEG, PNG, and WebP image uploads with file-size and pixel-dimension limits.
- Manual polygon and brush-based wall selection with eraser support.
- Multiple independently coloured wall regions.
- Undo, redo, reset, before/after preview, and PNG download.
- MongoDB persistence for designs, selected colours, editor settings, and
  design history.
- Cloudinary storage for original images and rendered previews.
- Responsive dashboard and editor with keyboard-accessible editor tabs.

## Architecture

- `client/`: React, Vite, Tailwind CSS, React Router, and the canvas editor.
- `server/`: Express API, Mongoose models, JWT middleware, validation,
  Cloudinary upload service, and owner-scoped design CRUD.
- MongoDB Atlas stores users, paint colours, designs, and design history.
- Cloudinary stores image URLs; image binaries are never stored in MongoDB.

## Deployment

PaintViz is prepared to deploy as two independent services:

- Vercel serves the Vite frontend from `client/`.
- Render runs the Express backend from `server/`.
- MongoDB Atlas provides the database.
- Cloudinary stores original images and rendered previews.

### Local verification

```powershell
cd client
npm.cmd ci
npm.cmd run lint
npm.cmd run build

cd ..\server
npm.cmd ci
npm.cmd test
npm.cmd start
```

The backend liveness URL is `/api/health`. It reports that the HTTP process is
running. `/api/health/ready` performs a bounded MongoDB ping and returns
`503` when the database is unavailable. The server connects to MongoDB before
it begins listening, so an initial database connection failure prevents
startup.

Editor image uploads are limited to 12 MB, 8000 pixels per side, and 25
megapixels. The editor renders and exports at the validated image's native
working resolution, preserving its aspect ratio and normalized pointer
coordinates. Images above these limits are rejected before canvas allocation.
Cloud-save failures retain the current non-binary editor state in the browser
for the active session; the original image is not copied into local storage,
so this fallback is not a refresh-recoverable draft.

### Render configuration

Set the Render service root directory to `server` and use:

- Build command: `npm ci`
- Start command: `npm start`
- Health-check path: `/api/health`

Configure these environment variable names in Render:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

`CLIENT_URL` accepts a comma-separated allowlist, for example the Vercel
origin plus `http://localhost:5173` for local development. Do not use `*`
when browser credentials are required.

MongoDB Atlas Network Access should allow the Render service's documented
outbound addresses where the hosting plan provides them. If the plan does
not provide stable outbound addresses, use the narrowest supported Atlas
network option temporarily and review it regularly; do not expose database
credentials in source control.

### Vercel configuration

Set the Vercel project root directory to `client/`.

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Set this public frontend variable in Vercel:

- `VITE_API_URL=https://<your-render-service>.onrender.com/api`

The frontend normalizes this value to exactly one `/api` suffix, so
`https://<your-render-service>.onrender.com` also remains compatible. The
registration and login URLs are `/api/auth/register` and `/api/auth/login`.

Only `VITE_API_URL` belongs in the frontend environment. JWT, MongoDB, and
Cloudinary credentials must remain backend-only. The `client/vercel.json`
rewrite allows direct refreshes of `/dashboard` and `/editor`.

Cloudinary uploads are retained if a later design save fails. Automatic
cleanup is intentionally not performed because safe deletion requires
proving that a public ID is newly created and unreferenced by every design.

Live services:

- Frontend: https://paint-viz.vercel.app/
- Backend liveness: https://paintviz.onrender.com/api/health
- Backend readiness: https://paintviz.onrender.com/api/health/ready

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/colours`
- `GET /api/designs`
- `POST /api/designs`
- `GET /api/designs/:id`
- `PATCH /api/designs/:id`
- `DELETE /api/designs/:id`
- `POST /api/designs/assets`
- `GET /api/health`
- `GET /api/health/ready`

All design and image routes require a valid JWT and scope queries to the
authenticated owner. API errors intentionally return safe messages without
stack traces, tokens, credentials, or infrastructure details.

## Demo workflow

1. Open the frontend and create an account or sign in.
2. Open the editor and upload a supported room image.
3. Select a polygon wall or use the brush and eraser tools.
4. Choose colours from the catalogue or enter a custom six-digit hex value.
5. Rename or remove regions, then use undo/redo as needed.
6. Save the design, return to the dashboard, reopen it, and download the PNG.

For a portfolio presentation, add screenshots of the landing page, editor
with multiple regions, and saved-design dashboard to the repository's
documentation or project hosting page. No screenshots are generated as part
of automated verification.

## Verification

```powershell
cd client
npm.cmd run lint
npm.cmd run build

cd ..\server
npm.cmd test
Get-ChildItem -Recurse -Filter *.js src | ForEach-Object { node --check $_.FullName }
```

The automated backend suite covers route contracts, payload validation,
legacy selections, multiple regions, owner-scoped queries, image-dimension
limits, Mongoose selection bounds, unsupported settings, and disconnected
database readiness. There is currently no browser automation suite in the
repository; real pointer, touch, responsive, Cloudinary, and production
multi-user flows still require manual or isolated staging verification.

## Production checklist

- Rotate any credential that has appeared in an IDE, terminal, issue, or chat.
- Set backend-only secrets in Render; expose only `VITE_API_URL` to Vercel.
- Set `VITE_API_URL` to the Render origin, with or without one `/api` suffix.
- Confirm `CLIENT_URL` is an exact comma-separated origin allowlist.
- Confirm Atlas network access and Cloudinary credentials without logging them.
- Check `/api/health` and `/api/health/ready` after deployment.
- Run the manual workflow above with a synthetic test account.
- Keep the previous deployment available for rollback until save/reopen,
  upload failure, and authorization checks are confirmed.

Recommended commit message:

```text
Harden PaintViz data integrity and release readiness
```
