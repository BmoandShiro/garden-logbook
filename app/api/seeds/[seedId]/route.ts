import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { seedId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const seed = await prisma.seed.findUnique({
      where: {
        id: params.seedId,
      },
    });

    if (!seed) {
      return new NextResponse('Seed not found', { status: 404 });
    }

    if (seed.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    await prisma.seed.delete({
      where: {
        id: params.seedId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[SEED_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 