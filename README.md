"# PaintViz" 

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

The backend health URL is `/api/health`. It reports that the HTTP process is
running; the server connects to MongoDB before it begins listening, so an
initial database connection failure prevents startup.

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

Only `VITE_API_URL` belongs in the frontend environment. JWT, MongoDB, and
Cloudinary credentials must remain backend-only. The `client/vercel.json`
rewrite allows direct refreshes of `/dashboard` and `/editor`.

Cloudinary uploads are retained if a later design save fails. Automatic
cleanup is intentionally not performed because safe deletion requires
proving that a public ID is newly created and unreferenced by every design."
