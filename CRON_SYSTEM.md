# Garden Logbook Cron System

## Overview

The Garden Logbook now has a comprehensive automated cron system that handles all background tasks in Docker. This system replaces the previous manual approach and ensures all automated tasks run reliably.

## What's Automated

### 1. Weather Alerts
- **Frequency**: Every 4 hours (0, 4, 8, 12, 16, 20 UTC)
- **Purpose**: Check for weather conditions that may affect plants
- **Alerts**: Heat, frost, wind, drought, flood, heavy rain
- **API Endpoint**: `/api/cron/weather-alerts`
- **Script**: `scripts/cron-weather.sh`

### 2. Maintenance Notifications
- **Frequency**: Daily at 9 AM UTC
- **Purpose**: Check for maintenance tasks due within 9 days
- **Notifications**: Overdue, urgent (≤3 days), reminder (4-9 days)
- **API Endpoint**: `/api/cron/maintenance-notifications`
- **Script**: `scripts/cron.sh`

### 3. Sensor Data Fetching
- **Frequency**: Every 15 minutes
- **Purpose**: Fetch and store sensor data from Govee devices
- **Data**: Temperature, humidity, battery level
- **API Endpoint**: `/api/cron/sensor-data`
- **Script**: `scripts/cron-sensors.sh`

### 4. Sensor Alerts
- **Frequency**: Every 4 hours (same as weather alerts)
- **Purpose**: Check sensor data against plant/zone thresholds
- **Alerts**: High/low temperature, high/low humidity
- **Integration**: Part of weather alerts system

## Docker Setup

### Cron Jobs
The Docker container runs three separate cron jobs:

```bash
# Weather alerts every 4 hours
0 0,4,8,12,16,20 * * * /app/scripts/cron-weather.sh

# Maintenance notifications daily at 9 AM
0 9 * * * /app/scripts/cron.sh

# Sensor data every 15 minutes
*/15 * * * * /app/scripts/cron-sensors.sh
```

### Logging
All cron jobs log to `/var/log/cron.log` inside the container.

## API Endpoints

### Weather Alerts
```
GET /api/cron/weather-alerts
```
- Processes weather alerts for all plants
- Checks weather API and sensor data
- Creates notifications and logs

### Maintenance Notifications
```
GET /api/cron/maintenance-notifications
```
- Checks maintenance tasks due within 9 days
- Creates notifications for garden members
- Prevents duplicate notifications

### Sensor Data
```
GET /api/cron/sensor-data
```
- Fetches data from all Govee devices
- Stores readings in database
- Updates device status

## Local Development

For local development, you can run the cron system manually:

```bash
# Run all cron jobs
npm run cron

# Run specific checks
npm run check:maintenance
```

## Monitoring

### Logs
Check cron logs in Docker:
```bash
docker exec -it garden-logbook-app cat /var/log/cron.log
```

### API Testing
Test endpoints manually:
```bash
curl http://localhost:3000/api/cron/weather-alerts
curl http://localhost:3000/api/cron/maintenance-notifications
curl http://localhost:3000/api/cron/sensor-data
```

## Troubleshooting

### Common Issues

1. **Weather alerts not working**
   - Check if plants have sensitivities configured
   - Verify garden zipcodes are set
   - Check weather API rate limits

2. **Sensor data not updating**
   - Verify Govee API keys are configured
   - Check device connectivity
   - Review API response logs

3. **Maintenance notifications not sending**
   - Check if maintenance tasks exist
   - Verify garden member relationships
   - Check notification deduplication logic

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=true
```

## Security

### API Protection
All cron endpoints support optional secret key authentication:
```bash
# Set in environment
CRON_SECRET=your-secret-key

# Use in requests
curl "http://localhost:3000/api/cron/weather-alerts?secret=your-secret-key"
```

### Rate Limiting
- Weather API calls are rate-limited
- Sensor data fetching respects device limits
- Notification deduplication prevents spam

## Future Enhancements

1. **Email notifications** - Send alerts via email
2. **SMS notifications** - Send urgent alerts via SMS
3. **Webhook support** - Integrate with external systems
4. **Metrics dashboard** - Monitor cron job performance
5. **Retry logic** - Handle temporary failures gracefully 