import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { randomUUID } from 'crypto';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { encryptedGoveeApiKey: true },
  });

  if (!user?.encryptedGoveeApiKey) {
    return NextResponse.json({ error: 'Govee API key not found' }, { status: 404 });
  }

  let apiKey: string;
  try {
    apiKey = decrypt(user.encryptedGoveeApiKey);
  } catch (e) {
    console.error('Failed to decrypt Govee API key:', e);
    return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 });
  }

  const devices = await prisma.goveeDevice.findMany({ where: { userId } });

  const allDeviceData: Record<string, any> = {};

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
      
      const twentyFourHoursAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
      const readings = await prisma.goveeReading.aggregate({
        where: {
          deviceId: device.id,
          timestamp: {
            gte: twentyFourHoursAgo,
          },
        },
        _max: {
          temperature: true,
          humidity: true,
          vpd: true,
        },
        _min: {
          temperature: true,
          humidity: true,
          vpd: true,
        },
      });

      allDeviceData[device.deviceId] = {
        currentState: data.payload.capabilities,
        history: {
          tempHigh24h: readings._max.temperature,
          tempLow24h: readings._min.temperature,
          humidityHigh24h: readings._max.humidity,
          humidityLow24h: readings._min.humidity,
          vpdHigh24h: readings._max.vpd,
          vpdLow24h: readings._min.vpd,
        },
      };

    } catch (e) {
      console.error(`Error fetching data for device ${device.name}:`, e);
      allDeviceData[device.deviceId] = { error: e instanceof Error ? e.message : 'An unknown error occurred' };
    }
  }

  return NextResponse.json(allDeviceData);
} 