import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { randomUUID } from 'crypto';
import { calculateVPD, calculateVPDFromFahrenheit } from '@/lib/vpdCalculator';

export async function fetchAndStoreSensorData() {
  console.log('[SENSOR_DATA] Starting automated sensor data fetch...');
  
  try {
    // Get all users with Govee API keys
    const users = await prisma.user.findMany({
      where: {
        encryptedGoveeApiKey: {
          not: null
        }
      },
      select: {
        id: true,
        encryptedGoveeApiKey: true
      }
    });

    console.log(`[SENSOR_DATA] Found ${users.length} users with Govee API keys`);

    for (const user of users) {
      try {
        // Decrypt API key
        let apiKey: string;
        try {
          apiKey = decrypt(user.encryptedGoveeApiKey!);
        } catch (e) {
          console.error(`[SENSOR_DATA] Failed to decrypt API key for user ${user.id}:`, e);
          continue;
        }

        // Get all devices for this user
        const devices = await prisma.goveeDevice.findMany({
          where: { userId: user.id },
        });

        console.log(`[SENSOR_DATA] Found ${devices.length} devices for user ${user.id}`);

        for (const device of devices) {
          try {
            // Fetch current state from Govee API
            const response = await fetch('https://openapi.api.govee.com/router/api/v1/device/state', {
              method: 'POST',
              headers: {
                'Govee-API-Key': apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requestId: randomUUID(),
                payload: {
                  sku: device.type,
                  device: device.deviceId,
                },
              }),
            });

            const data = await response.json();
            if (data.code !== 200 || !data.payload) {
              throw new Error(data.msg || `Failed to fetch state for ${device.name}`);
            }

            const capabilities = data.payload.capabilities;
            let temperature: number | null | undefined;
            let humidity: number | null | undefined;
            let battery: number | null | undefined;

            // Parse sensor data from capabilities
            for (const cap of capabilities) {
              if (cap.instance === 'sensorTemperature') {
                const tempValue = parseFloat(cap.state?.value);
                temperature = isNaN(tempValue) ? null : tempValue;
              }
              if (cap.instance === 'sensorHumidity') {
                const humidityValue = parseFloat(cap.state?.value);
                humidity = isNaN(humidityValue) ? null : humidityValue;
              }
              if (cap.instance === 'battery') {
                const batteryValue = parseInt(cap.state?.value);
                battery = isNaN(batteryValue) ? null : batteryValue;
              }
            }

            // Only store reading if we have temperature or humidity data
            if (temperature !== undefined || humidity !== undefined) {
              // Calculate VPD if both temperature and humidity are available
              let vpd: number | null = null;
              if (temperature !== null && humidity !== null && temperature !== undefined && humidity !== undefined) {
                // Temperature from Govee is in Fahrenheit, use the Fahrenheit VPD calculation
                vpd = calculateVPDFromFahrenheit(temperature, humidity);
              }

              await prisma.goveeReading.create({
                data: {
                  deviceId: device.id,
                  timestamp: new Date(),
                  temperature: temperature,
                  humidity: humidity,
                  vpd: vpd,
                  battery: battery,
                  rawData: capabilities,
                  source: 'CRON',
                },
              });

              // Update device status
              await prisma.goveeDevice.update({
                where: { id: device.id },
                data: {
                  lastState: capabilities,
                  lastStateAt: new Date(),
                  batteryLevel: battery,
                  isOnline: true,
                },
              });

              console.log(`[SENSOR_DATA] Stored reading for ${device.name}: T=${temperature}, H=${humidity}, B=${battery}`);
            } else {
              console.log(`[SENSOR_DATA] No sensor data available for ${device.name}`);
            }
          } catch (e) {
            console.error(`[SENSOR_DATA] Error fetching data for device ${device.name}:`, e);
            
            // Mark device as offline if we can't reach it
            await prisma.goveeDevice.update({
              where: { id: device.id },
              data: {
                isOnline: false,
                lastStateAt: new Date(),
              },
            });
          }
        }
      } catch (e) {
        console.error(`[SENSOR_DATA] Error processing user ${user.id}:`, e);
      }
    }

    console.log('[SENSOR_DATA] Automated sensor data fetch completed');
  } catch (error) {
    console.error('[SENSOR_DATA] Error in fetchAndStoreSensorData:', error);
    throw error;
  }
} 