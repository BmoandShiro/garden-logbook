import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processWeatherAlerts } from '@/lib/weatherAlerts';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { randomUUID } from 'crypto';

async function fetchAndStoreSensorData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { encryptedGoveeApiKey: true },
  });

  if (!user || !user.encryptedGoveeApiKey) {
    console.log('[SENSOR_FETCH] No Govee API key found for user.');
    return;
  }

  let apiKey: string;
  try {
    apiKey = decrypt(user.encryptedGoveeApiKey);
  } catch (e) {
    console.error('[SENSOR_FETCH] Failed to decrypt API key:', e);
    return;
  }

  const devices = await prisma.goveeDevice.findMany({
    where: { userId: userId },
  });

  for (const device of devices) {
    try {
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

      for (const cap of capabilities) {
        if (cap.instance === 'sensorTemperature') {
          const tempValue = parseFloat(cap.state?.value);
          temperature = isNaN(tempValue) ? null : tempValue;
        }
        if (cap.instance === 'sensorHumidity') {
          const humidityValue = parseFloat(cap.state?.value);
          humidity = isNaN(humidityValue) ? null : humidityValue;
        }
      }

      if (temperature !== undefined && humidity !== undefined) {
        await prisma.goveeReading.create({
          data: {
            deviceId: device.id,
            timestamp: new Date(),
            temperature: temperature,
            humidity: humidity,
            rawData: capabilities,
          },
        });
        console.log(`[SENSOR_FETCH] Stored reading for ${device.name}: T=${temperature}, H=${humidity}`);
      }
    } catch (e) {
      console.error(`[SENSOR_FETCH] Error fetching data for device ${device.name}:`, e);
    }
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[WEATHER_TEST] Manually triggering sensor data fetch...');
    await fetchAndStoreSensorData(session.user.id);
    
    console.log('[WEATHER_TEST] Manually triggering weather alerts...');
    await processWeatherAlerts();
    
    console.log('[WEATHER_TEST] Weather alerts completed successfully');
    return NextResponse.json({ success: true, message: 'Sensor data fetched and weather alerts processed successfully' });
  } catch (error) {
    console.error('[WEATHER_TEST] Error processing weather alerts:', error);
    return NextResponse.json({ error: 'Failed to process weather alerts' }, { status: 500 });
  }
} 