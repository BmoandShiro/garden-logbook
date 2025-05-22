#!/bin/bash

echo "Stopping and removing all Docker containers..."
sudo docker compose down

echo "Rebuilding Docker images..."
sudo docker compose build

echo "Starting Docker containers in detached mode..."
sudo docker compose up -d

echo "Running Prisma migrations in the app container..."
sudo docker compose exec app npx prisma migrate deploy

# Optional: Restart Tailscale Serve on port 3000
if command -v tailscale &> /dev/null; then
  if ! tailscale serve status | grep -q "http://localhost:3000"; then
    echo "Starting Tailscale Serve on port 3000..."
    sudo tailscale serve --bg 3000
  else
    echo "Tailscale Serve is already running on port 3000."
  fi
fi

echo "Dockerized Garden Logbook restarted!" 