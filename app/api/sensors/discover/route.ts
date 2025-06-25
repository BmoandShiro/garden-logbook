import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function POST(request: Request) {
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

  // Fetch device list from Govee API
  const response = await fetch('https://openapi.api.govee.com/router/api/v1/user/devices', {
    headers: {
      'Govee-API-Key': apiKey,
    },
  });

  const raw = await response.json();

  // Return raw response for debugging if not as expected
  if (!raw.code || raw.code !== 200 || !Array.isArray(raw.data)) {
    return NextResponse.json({
      error: 'Unexpected response from Govee API',
      status: raw.code,
      message: raw.message,
      raw
    }, { status: 500 });
  }

  const devices = raw.data;
  const upsertedDevices = [];

  for (const device of devices) {
    const upserted = await prisma.goveeDevice.upsert({
      where: { userId_deviceId: { userId: session.user.id, deviceId: device.device } },
      update: {
        name: device.deviceName || device.device,
        type: device.sku,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        deviceId: device.device,
        name: device.deviceName || device.device,
        type: device.sku,
        isActive: true,
      },
    });
    upsertedDevices.push(upserted);
  }

  return NextResponse.json({ devices: upsertedDevices });
} 