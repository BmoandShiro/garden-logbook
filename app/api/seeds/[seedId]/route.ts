import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: Request, context: { params: Promise<{ seedId: string }> }) {
  const params = await context.params;
  const { seedId } = params;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const seed = await prisma.seed.findUnique({
      where: {
        id: seedId,
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
        id: seedId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[SEED_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 