import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, context: { params: Promise<{ gardenId: string }> }) {
  const params = await context.params;
  const { gardenId } = params;
  try {
    const session = await getServerSession(authOptions);
    console.log('Session data:', session?.user);

    if (!session?.user) {
      console.log('Unauthorized: No session found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First check if the garden exists and if the user is the creator
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      select: { creatorId: true }
    });

    console.log('Garden data:', garden);
    console.log('Comparing creatorId:', garden?.creatorId, 'with userId:', session.user.id);

    if (!garden) {
      console.log('Garden not found:', gardenId);
      return new NextResponse('Garden not found', { status: 404 });
    }

    if (garden.creatorId !== session.user.id) {
      console.log('Forbidden: User is not the creator');
      console.log('Garden creatorId:', garden.creatorId);
      console.log('Session user id:', session.user.id);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete the garden - cascading deletes will handle related records
    await prisma.garden.delete({
      where: { id: gardenId },
    });

    console.log('Garden deleted successfully');
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[GARDEN_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ gardenId: string }> }) {
  const params = await context.params;
  const { gardenId } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      select: { creatorId: true }
    });
    if (!garden) {
      return new NextResponse('Garden not found', { status: 404 });
    }
    if (garden.creatorId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    const body = await request.json();
    const { name, description, imageUrl, isPrivate, zipcode } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }
    const updatedGarden = await prisma.garden.update({
      where: { id: gardenId },
      data: {
        name,
        description: description ?? '',
        imageUrl: imageUrl ?? '',
        isPrivate: typeof isPrivate === 'boolean' ? isPrivate : true,
        zipcode: zipcode ?? '',
      },
    });
    return NextResponse.json(updatedGarden);
  } catch (error) {
    console.error('[GARDEN_PATCH]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE_member(request: Request, context: { params: Promise<{ gardenId: string; memberId: string }> }) {
  const params = await context.params;
  const { gardenId, memberId } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const garden = await prisma.garden.findUnique({
      where: { id: gardenId },
      select: { creatorId: true },
    });
    if (!garden) {
      return NextResponse.json({ error: 'Garden not found' }, { status: 404 });
    }
    if (garden.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (memberId === garden.creatorId) {
      return NextResponse.json({ error: 'Cannot remove the garden creator' }, { status: 400 });
    }
    // Remove the member from the garden
    await prisma.garden.update({
      where: { id: gardenId },
      data: {
        members: {
          disconnect: { id: memberId },
        },
      },
    });
    await prisma.gardenMember.delete({
      where: {
        gardenId_userId: {
          gardenId: gardenId,
          userId: memberId,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[GARDEN_REMOVE_MEMBER]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
} 