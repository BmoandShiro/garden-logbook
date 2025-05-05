import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { gardenId, email } = await request.json();
    if (!gardenId || !email) {
      return NextResponse.json({ error: 'Missing gardenId or email' }, { status: 400 });
    }
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Check if already a member
      const existingMember = await prisma.gardenMember.findUnique({
        where: {
          gardenId_userId: {
            gardenId,
            userId: user.id,
          },
        },
      });
      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member of this garden.' }, { status: 400 });
      }
      // Add as member (default permissions: VIEW, INVITE)
      await prisma.gardenMember.create({
        data: {
          gardenId,
          userId: user.id,
          permissions: ['VIEW', 'INVITE'],
          addedById: user.id, // You may want to use the inviter's ID if available
        },
      });
      return NextResponse.json({ success: true, message: 'User added as member.' });
    } else {
      // Create a pending invite if not already invited
      const existingInvite = await prisma.gardenInvite.findUnique({
        where: {
          gardenId_email: {
            gardenId,
            email,
          },
        },
      });
      if (existingInvite) {
        return NextResponse.json({ error: 'Invite already sent to this email.' }, { status: 400 });
      }
      await prisma.gardenInvite.create({
        data: {
          gardenId,
          email,
        },
      });
      return NextResponse.json({ success: true, message: 'Invite created for new user.' });
    }
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
} 