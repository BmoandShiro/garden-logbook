#!/bin/bash

echo "=== Garden Logbook Cron Status ==="
echo ""

# Check if container is running
if ! sudo docker ps | grep -q "garden-logbook-app"; then
    echo "❌ App container is not running!"
    exit 1
fi

echo "✅ App container is running"
echo ""

# Check cron daemon status
echo "Checking cron daemon status..."
if sudo docker exec garden-logbook-app ps aux | grep -q "crond"; then
    echo "✅ Cron daemon is running"
else
    echo "❌ Cron daemon is not running"
fi
echo ""

# Show recent cron logs
echo "Recent cron logs:"
sudo docker exec garden-logbook-app tail -20 /var/log/cron.log 2>/dev/null || echo "No cron logs found yet"
echo ""

# Check cron job schedule
echo "Cron job schedule:"
sudo docker exec garden-logbook-app cat /etc/crontabs/root
echo ""

# Test endpoints
echo "Testing cron endpoints..."
echo "Weather alerts:"
curl -s "http://localhost:3000/api/cron/weather-alerts" | jq '.message' 2>/dev/null || echo "Endpoint test failed"

echo "Maintenance notifications:"
curl -s "http://localhost:3000/api/cron/maintenance-notifications" | jq '.message' 2>/dev/null || echo "Endpoint test failed"

echo "Sensor data:"
curl -s "http://localhost:3000/api/cron/sensor-data" | jq '.message' 2>/dev/null || echo "Endpoint test failed" 