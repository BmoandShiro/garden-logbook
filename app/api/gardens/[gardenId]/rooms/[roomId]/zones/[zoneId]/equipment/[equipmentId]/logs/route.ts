import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ gardenId: string; roomId: string; zoneId: string; equipmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params as required by Next.js
    const params = await context.params;

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
      return NextResponse.json({ error: 'Garden not found or access denied' }, { status: 404 });
    }

    // Get logs for this equipment
    const logs = await prisma.log.findMany({
      where: {
        equipmentId: params.equipmentId,
        gardenId: params.gardenId
      },
      orderBy: {
        logDate: 'desc'
      },
      include: {
        garden: {
          select: {
            name: true,
            timezone: true,
            zipcode: true
          }
        },
        room: {
          select: {
            name: true
          }
        },
        zone: {
          select: {
            name: true
          }
        },
        equipment: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[EQUIPMENT_LOGS_GET]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 