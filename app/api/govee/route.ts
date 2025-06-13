import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoveeService } from '@/lib/govee';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gardenId = searchParams.get('gardenId');

    if (!gardenId) {
      return new NextResponse('Garden ID is required', { status: 400 });
    }

    // Check if user has access to the garden
    const garden = await prisma.garden.findFirst({
      where: {
        id: gardenId,
        OR: [
          { creatorId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        goveeDevices: {
          include: {
            readings: {
              orderBy: { timestamp: 'desc' },
              take: 100
            }
          }
        }
      }
    });

    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }

    return NextResponse.json(garden.goveeDevices);
  } catch (error) {
    console.error('Error fetching Govee devices:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { gardenId, deviceId, name, model } = body;

    if (!gardenId || !deviceId || !name || !model) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if user is the garden creator
    const garden = await prisma.garden.findFirst({
      where: {
        id: gardenId,
        creatorId: session.user.id
      }
    });

    if (!garden) {
      return new NextResponse('Garden not found or unauthorized', { status: 404 });
    }

    if (!garden.goveeApiKey) {
      return new NextResponse('Govee API key not configured', { status: 400 });
    }

    // Verify device exists and is accessible
    const goveeService = new GoveeService(garden.goveeApiKey);
    const devices = await goveeService.getDevices();
    const deviceExists = devices.some(d => d.device === deviceId && d.model === model);

    if (!deviceExists) {
      return new NextResponse('Device not found or not accessible', { status: 404 });
    }

    // Create device in database
    const device = await prisma.goveeDevice.create({
      data: {
        deviceId,
        name,
        model,
        gardenId
      }
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error('Error creating Govee device:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return new NextResponse('Device ID is required', { status: 400 });
    }

    // Check if user has access to the device
    const device = await prisma.goveeDevice.findFirst({
      where: {
        id,
        garden: {
          OR: [
            { creatorId: session.user.id },
            { members: { some: { userId: session.user.id } } }
          ]
        }
      }
    });

    if (!device) {
      return new NextResponse('Device not found or unauthorized', { status: 404 });
    }

    // Update device
    const updatedDevice = await prisma.goveeDevice.update({
      where: { id },
      data: updates
    });

    return NextResponse.json(updatedDevice);
  } catch (error) {
    console.error('Error updating Govee device:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Device ID is required', { status: 400 });
    }

    // Check if user has access to the device
    const device = await prisma.goveeDevice.findFirst({
      where: {
        id,
        garden: {
          OR: [
            { creatorId: session.user.id },
            { members: { some: { userId: session.user.id } } }
          ]
        }
      }
    });

    if (!device) {
      return new NextResponse('Device not found or unauthorized', { status: 404 });
    }

    // Delete device
    await prisma.goveeDevice.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting Govee device:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 