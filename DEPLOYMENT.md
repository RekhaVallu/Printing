# PrintFlow Project Structure And Deployment

## Which folders matter?

The active projects are:

- `printflow-frontend/` - Expo / React Native frontend.
- `printflow-backend/` - Node / Express / MongoDB backend.

The root-level folders such as `app/`, `components/`, `constants/`, `context/`, `hooks/`, `services/`, `types/`, and `utils/` are old frontend code. They are not used by the backend and they are not the active frontend app because the root folder has no real `package.json`.

Use `printflow-frontend/` as the frontend root and `printflow-backend/` as the backend root when deploying.

## Backend Deployment

Good targets: Render, Railway, Fly.io, or any Node server host.

Backend root directory:

```bash
printflow-backend
```

Install command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required environment variables:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SUPER_ADMIN_EMAIL=your_admin_college_email
FRONTEND_ORIGIN=https://your-frontend-domain
```

After deployment, note the backend URL, for example:

```bash
https://printflow-backend.onrender.com
```

## Frontend Deployment

For web, Expo can export a static site that can be hosted on Vercel, Netlify, or similar.

Frontend root directory:

```bash
printflow-frontend
```

Install command:

```bash
npm install
```

Build command:

```bash
npx expo export --platform web
```

Output directory:

```bash
dist
```

Frontend environment variables:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_API_URL=https://your-backend-domain/api
EXPO_PUBLIC_SOCKET_URL=https://your-backend-domain
EXPO_PUBLIC_WEB_API_URL=https://your-backend-domain/api
EXPO_PUBLIC_WEB_SOCKET_URL=https://your-backend-domain
```

For local development:

```bash
cd printflow-backend
npm run dev
```

```bash
cd printflow-frontend
npm start
```

## Cleanup Note

Once you confirm the app works from `printflow-frontend/`, the stale root-level frontend folders can be deleted or archived:

```text
app/
components/
constants/
context/
hooks/
services/
types/
utils/
```

Do not delete `printflow-frontend/` or `printflow-backend/`.
