#!/bin/bash

# Comprehensive cron script for Garden Logbook
# This script handles all automated tasks: weather alerts, sensor alerts, maintenance notifications, and sensor data fetching

# Get the current date for logging
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Log the start of the cron job
echo "[$DATE] Starting Garden Logbook cron jobs..."

# Function to make API calls with error handling
make_api_call() {
    local endpoint=$1
    local description=$2
    
    echo "[$DATE] Running $description..."
    response=$(curl -s -w "%{http_code}" "http://localhost:3000$endpoint")
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" -eq 200 ]; then
        echo "[$DATE] $description completed successfully"
    else
        echo "[$DATE] $description failed with HTTP $http_code: $body"
    fi
}

# Run all cron jobs
make_api_call "/api/cron/weather-alerts" "Weather alerts check"
make_api_call "/api/cron/maintenance-notifications" "Maintenance notifications check"
make_api_call "/api/cron/sensor-data" "Sensor data fetch"

# Log the completion
echo "[$DATE] All Garden Logbook cron jobs completed"

# Exit with success
exit 0 