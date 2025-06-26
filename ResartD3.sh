#!/bin/bash

echo "WARNING: This will remove all unused Docker data (images, containers, volumes)."
read -p "Proceed with Docker cleanup? (y/N): " confirm
if [[ $confirm =~ ^[Yy]$ ]]; then
  sudo docker system prune -af --volumes
  echo "Docker cleanup complete."
else
  echo "Docker cleanup skipped."
fi


echo "Stopping and removing all Docker containers..."
sudo docker compose down

echo "Rebuilding Docker images..."
sudo docker compose build

echo "Starting Docker containers in detached mode..."
sudo docker compose up -d

echo "Running Prisma migrations in the app container..."
sudo docker compose exec app npx prisma migrate deploy

# Make test script executable and test cron endpoints
echo "Testing cron endpoints..."
chmod +x scripts/test-cron.sh
./scripts/test-cron.sh

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
echo ""
echo "Cron jobs are now running:"
echo "  - Weather alerts: Every 4 hours (0, 4, 8, 12, 16, 20 UTC)"
echo "  - Maintenance notifications: Daily at 9 AM UTC"
echo "  - Sensor data: Every 15 minutes"
echo ""
echo "Check cron logs with: sudo docker exec -it garden-logbook-app cat /var/log/cron.log" 