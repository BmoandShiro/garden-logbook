#!/bin/bash

# Weather alerts cron script for Garden Logbook
# This script runs every 4 hours to check for weather alerts

# Get the current date for logging
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Log the start of the cron job
echo "[$DATE] Starting weather alerts cron job..."

# Make a request to the weather alerts API endpoint
response=$(curl -s -w "%{http_code}" "http://localhost:3000/api/cron/weather-alerts")
http_code="${response: -3}"
body="${response%???}"

if [ "$http_code" -eq 200 ]; then
    echo "[$DATE] Weather alerts check completed successfully"
else
    echo "[$DATE] Weather alerts check failed with HTTP $http_code: $body"
fi

# Exit with success
exit 0 