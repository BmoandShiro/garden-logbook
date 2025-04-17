import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { gardenId: string; roomId: string; zoneId: string; plantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user has access to this garden
    const garden = await prisma.garden.findFirst({
      where: {
        id: params.gardenId,
        OR: [
          { creatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      }
    });

    if (!garden) {
      return new NextResponse('Garden not found or access denied', { status: 404 });
    }

    // Check if plant exists and belongs to the zone
    const plant = await prisma.zonePlant.findFirst({
      where: {
        id: params.plantId,
        zoneId: params.zoneId,
        zone: {
          room: {
            gardenId: params.gardenId
          }
        }
      }
    });

    if (!plant) {
      return new NextResponse('Plant not found or access denied', { status: 404 });
    }

    await prisma.zonePlant.delete({
      where: {
        id: params.plantId
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[PLANTS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 