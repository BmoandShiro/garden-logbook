import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { variety, strain, batch, breeder, quantity, dateAcquired, dateHarvested } = body;

    const seed = await prisma.seed.create({
      data: {
        variety,
        strain,
        batch,
        breeder,
        quantity,
        dateAcquired,
        dateHarvested,
        userId: session.user.id,
      },
    });

    return NextResponse.json(seed);
  } catch (error) {
    console.error('[SEEDS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const seeds = await prisma.seed.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdBy: true,
      },
    });

    return NextResponse.json(seeds);
  } catch (error) {
    console.error('[SEEDS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 