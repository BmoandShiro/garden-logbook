#!/bin/bash

# Startup script for Garden Logbook - runs on system boot
# This is a non-interactive version of ResartD3.sh for systemd

cd /home/bmo/garden-logbook || exit 1

echo "Starting Garden Logbook on boot..."

# Start Docker containers (skip rebuild on boot - use existing images)
echo "Starting Docker containers..."
sudo docker compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run Prisma migrations
echo "Running Prisma migrations..."
sudo docker compose exec -T app npx prisma migrate deploy || echo "Migration failed or already applied"

# Set up Tailscale Serve on port 3000
if command -v tailscale &> /dev/null; then
  if ! tailscale serve status | grep -q "http://localhost:3000"; then
    echo "Starting Tailscale Serve on port 3000..."
    sudo tailscale serve --bg 3000
  else
    echo "Tailscale Serve is already running on port 3000."
  fi
fi

echo "Garden Logbook startup complete!"
