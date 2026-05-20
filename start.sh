#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Kill any previous instances
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "vite --host" 2>/dev/null
pkill -f "cloudflared tunnel" 2>/dev/null
sleep 1

# Start backend
cd "$ROOT/backend"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &> /tmp/wb_backend.log &
echo "✓ Backend starting..."

# Start frontend
cd "$ROOT/frontend"
npm run dev -- --host &> /tmp/wb_frontend.log &
echo "✓ Frontend starting..."

# Wait for frontend to be ready
sleep 5

# Start Cloudflare tunnel
cloudflared tunnel --url http://localhost:5173 &> /tmp/wb_tunnel.log &
echo "✓ Tunnel starting..."

# Wait for tunnel URL
echo ""
echo "Getting your public link..."
URL=""
for i in {1..20}; do
  URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" /tmp/wb_tunnel.log 2>/dev/null | head -1)
  if [ -n "$URL" ]; then
    break
  fi
  sleep 2
done

# Copy URL to clipboard
echo "$URL" | pbcopy

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       Wedding Planner is running! 💍      ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  Share this link with Omer:              ║"
echo "║  $URL"
echo "║                                          ║"
echo "║  (Link copied to clipboard!)             ║"
echo "║                                          ║"
echo "║  Local: http://localhost:5173            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Open the app locally
open "http://localhost:5173"
