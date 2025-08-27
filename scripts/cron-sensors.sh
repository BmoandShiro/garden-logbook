#!/bin/bash

# Sensor data fetching cron script for Garden Logbook
# This script runs every 15 minutes to fetch sensor data

# Get the current date for logging
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Log the start of the cron job
echo "[$DATE] Starting sensor data fetch cron job..."

# Make a request to the sensor data API endpoint
response=$(curl -s -w "%{http_code}" "http://localhost:3000/api/cron/sensor-data")
http_code="${response: -3}"
body="${response%???}"

if [ "$http_code" -eq 200 ]; then
    echo "[$DATE] Sensor data fetch completed successfully"
else
    echo "[$DATE] Sensor data fetch failed with HTTP $http_code: $body"
fi

# Exit with success
exit 0 