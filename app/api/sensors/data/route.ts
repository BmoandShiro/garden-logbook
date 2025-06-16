import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { randomUUID } from 'crypto';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { encryptedGoveeApiKey: true },
  });

  if (!user || !user.encryptedGoveeApiKey) {
    return NextResponse.json({ error: 'Govee API key not found' }, { status: 404 });
  }

  let apiKey: string;
  try {
    apiKey = decrypt(user.encryptedGoveeApiKey);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 });
  }

  // Fetch devices from Govee API
  const devices = await prisma.goveeDevice.findMany({
    where: { userId: session.user.id },
    select: { deviceId: true, type: true },
  });

  const sensorData: Record<string, any> = {};
  for (const device of devices) {
    try {
      const requestId = randomUUID();
      const response = await fetch('https://openapi.api.govee.com/router/api/v1/device/state', {
        method: 'POST',
        headers: {
          'Govee-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          payload: {
            sku: device.type,
            device: device.deviceId,
          },
        }),
      });

      const data = await response.json();
      if (data.code !== 200 || !data.payload) {
        throw new Error(data.msg || 'Failed to fetch device state');
      }
      sensorData[device.deviceId] = data.payload.capabilities;
    } catch (e) {
      sensorData[device.deviceId] = { error: e instanceof Error ? e.message : 'An error occurred' };
    }
  }

  return NextResponse.json(sensorData);
} 