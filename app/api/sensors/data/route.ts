import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

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
    select: { deviceId: true },
  });

  const deviceIds = devices.map((device: { deviceId: string }) => device.deviceId);

  // Fetch sensor data for each device
  const sensorData: Record<string, any> = {};
  for (const deviceId of deviceIds) {
    try {
      const response = await fetch(`https://openapi.api.govee.com/router/api/v1/device/state?device=${deviceId}&model=H5179`, {
        headers: {
          'Govee-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data for device ${deviceId}`);
      }

      const data = await response.json();
      sensorData[deviceId] = data;
    } catch (e) {
      sensorData[deviceId] = { error: e instanceof Error ? e.message : 'An error occurred' };
    }
  }

  return NextResponse.json(sensorData);
} 