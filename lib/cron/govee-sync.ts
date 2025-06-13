import { PrismaClient } from '@prisma/client';
import { GoveeService } from '../govee';

const prisma = new PrismaClient();

export async function syncGoveeDevices() {
  try {
    // Get all gardens with Govee API keys
    const gardens = await prisma.garden.findMany({
      where: {
        goveeApiKey: { not: null },
        goveeDevices: { some: { isActive: true } }
      },
      include: {
        goveeDevices: true
      }
    });

    for (const garden of gardens) {
      if (!garden.goveeApiKey) continue;

      const goveeService = new GoveeService(garden.goveeApiKey);

      for (const device of garden.goveeDevices) {
        try {
          // Get latest reading from Govee API
          const reading = await goveeService.syncDeviceReadings(device);

          // Save reading to database
          await prisma.goveeReading.create({
            data: reading
          });

          // Check for alerts
          const alerts = await goveeService.checkDeviceAlerts(device, reading);

          if (alerts.temperatureAlert || alerts.humidityAlert) {
            // Create notification for alerts
            await prisma.notification.create({
              data: {
                userId: garden.creatorId,
                type: 'ALERT',
                title: 'Govee Device Alert',
                message: `Device ${device.name} has readings outside of set ranges:
                  ${alerts.temperatureAlert ? `Temperature is ${alerts.temperatureAlert.type} (${alerts.temperatureAlert.value}°C)` : ''}
                  ${alerts.humidityAlert ? `Humidity is ${alerts.humidityAlert.type} (${alerts.humidityAlert.value}%)` : ''}`,
                data: {
                  deviceId: device.id,
                  alerts
                }
              }
            });

            // Create log entry for the alert
            await prisma.log.create({
              data: {
                type: 'ENVIRONMENTAL',
                stage: 'ALL',
                temperature: reading.temperature,
                humidity: reading.humidity,
                notes: `Govee device alert: ${alerts.temperatureAlert ? `Temperature ${alerts.temperatureAlert.type}` : ''} ${alerts.humidityAlert ? `Humidity ${alerts.humidityAlert.type}` : ''}`,
                userId: garden.creatorId,
                gardenId: garden.id,
                roomId: device.zone?.roomId,
                zoneId: device.zoneId,
                plantId: device.plantId,
                logDate: new Date()
              }
            });
          }
        } catch (error) {
          console.error(`Error syncing Govee device ${device.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in Govee sync cron job:', error);
  }
} 