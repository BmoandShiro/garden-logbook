#!/bin/bash

echo "Stopping Docker containers (if any)..."
sudo docker-compose down

echo "Killing Next.js processes..."
pkill -f "next dev"

echo "Killing previous cron job..."
pkill -f "start-cron.ts"

echo "Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "Starting cron job..."
npm run cron &

echo "Restarting development server..."
npm run dev

# Check if Tailscale Serve is already running on port 3000
if ! tailscale serve status | grep -q "http://localhost:3000"; then
  echo "Starting Tailscale Serve on port 3000..."
  sudo tailscale serve --bg 3000
else
  echo "Tailscale Serve is already running on port 3000."
fi



