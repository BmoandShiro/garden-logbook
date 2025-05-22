import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { gardenId, email } = await request.json();
    console.log('[INVITE] Received invite request:', { gardenId, email });
    if (!gardenId || !email) {
      console.warn('[INVITE] Missing gardenId or email');
      return NextResponse.json({ error: 'Missing gardenId or email' }, { status: 400 });
    }
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      console.log('[INVITE] User found:', user.id, user.email);
    } else {
      console.log('[INVITE] No user found for email:', email);
    }
    // Always create a pending invite (delete any old one first)
    const existingInvite = await prisma.gardenInvite.findUnique({
      where: {
        gardenId_email: {
          gardenId,
          email,
        },
      },
    });
    if (existingInvite) {
      await prisma.gardenInvite.delete({ where: { id: existingInvite.id } });
      console.log('[INVITE] Deleted old invite for:', email);
    }
    const invite = await prisma.gardenInvite.create({
      data: {
        gardenId,
        email,
      },
    });
    console.log('[INVITE] Created invite:', invite);
    // If user exists, create a notification for them
    if (user) {
      try {
        const garden = await prisma.garden.findUnique({ where: { id: gardenId } });
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'invite',
            title: 'You have been invited to a garden!',
            message: `You have been invited to join the garden "${garden?.name ?? gardenId}".`,
            link: `/gardens/${gardenId}`,
            meta: { inviteId: invite.id },
          },
        });
        console.log('[INVITE] Notification created for user:', email, notification);
      } catch (notifError) {
        console.error('[INVITE] Failed to create notification for user:', email, notifError);
      }
    }
    // TODO: Optionally send invite email here
    return NextResponse.json({ success: true, message: 'Invite created.' });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
} 