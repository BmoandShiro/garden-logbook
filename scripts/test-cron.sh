#!/bin/bash

# Test script to verify cron endpoints are working
echo "Testing Garden Logbook cron endpoints..."

# Wait for the app to be ready
echo "Waiting for app to be ready..."
sleep 10

# Test weather alerts endpoint
echo "Testing weather alerts endpoint..."
WEATHER_RESPONSE=$(curl -s -w "%{http_code}" "http://localhost:3000/api/cron/weather-alerts")
WEATHER_HTTP_CODE="${WEATHER_RESPONSE: -3}"
WEATHER_BODY="${WEATHER_RESPONSE%???}"

if [ "$WEATHER_HTTP_CODE" -eq 200 ]; then
    echo "✅ Weather alerts endpoint: OK"
else
    echo "❌ Weather alerts endpoint: FAILED (HTTP $WEATHER_HTTP_CODE)"
    echo "Response: $WEATHER_BODY"
fi

# Test maintenance notifications endpoint
echo "Testing maintenance notifications endpoint..."
MAINTENANCE_RESPONSE=$(curl -s -w "%{http_code}" "http://localhost:3000/api/cron/maintenance-notifications")
MAINTENANCE_HTTP_CODE="${MAINTENANCE_RESPONSE: -3}"
MAINTENANCE_BODY="${MAINTENANCE_RESPONSE%???}"

if [ "$MAINTENANCE_HTTP_CODE" -eq 200 ]; then
    echo "✅ Maintenance notifications endpoint: OK"
else
    echo "❌ Maintenance notifications endpoint: FAILED (HTTP $MAINTENANCE_HTTP_CODE)"
    echo "Response: $MAINTENANCE_BODY"
fi

# Test sensor data endpoint
echo "Testing sensor data endpoint..."
SENSOR_RESPONSE=$(curl -s -w "%{http_code}" "http://localhost:3000/api/cron/sensor-data")
SENSOR_HTTP_CODE="${SENSOR_RESPONSE: -3}"
SENSOR_BODY="${SENSOR_RESPONSE%???}"

if [ "$SENSOR_HTTP_CODE" -eq 200 ]; then
    echo "✅ Sensor data endpoint: OK"
else
    echo "❌ Sensor data endpoint: FAILED (HTTP $SENSOR_HTTP_CODE)"
    echo "Response: $SENSOR_BODY"
fi

echo "Cron endpoint testing complete!" 