# Frontend Environment Configuration

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BACKEND_URL` | No | _(empty)_ | Backend API base URL. When empty, the frontend uses relative `/api` paths which are proxied by the dev server or reverse proxy in production. |

## How API URL Resolution Works

The frontend resolves the API base URL in this order:

1. **Explicit `VITE_BACKEND_URL`** → Uses `{VITE_BACKEND_URL}/api`
2. **Empty / unset** → Falls back to relative `/api`

In development, Vite's dev server proxy forwards `/api` requests to `http://localhost:8001`.

In production, the reverse proxy (e.g. nginx) should route `/api` to the backend.

## WebSocket URL

The WebSocket URL for real-time tracking is derived from `VITE_BACKEND_URL`:
- `https://example.com` → `wss://example.com`
- `http://localhost:8001` → `ws://localhost:8001`

If `VITE_BACKEND_URL` is not set, the WebSocket falls back to `ws://localhost:8001`.

## Local Development Setup

```bash
# Copy the example env file
cp .env.example .env

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The dev server runs on `http://localhost:3000` with automatic proxy for `/api`.
