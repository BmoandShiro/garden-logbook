import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    // Verify the requesting user is fetching their own plants
    if (userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const plants = await prisma.plant.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 