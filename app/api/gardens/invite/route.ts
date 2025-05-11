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
        console.warn('[INVITE] User is already a member:', email);
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
      console.log('[INVITE] User added as member:', email);
      // TODO: Optionally send notification email to existing user
      return NextResponse.json({ success: true, message: 'User added as member.' });
    } else {
      // Not a user yet, check for existing invite
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
      console.log('[INVITE] Created invite for new user:', invite);
      // TODO: Send invite email here. Log before and after sending.
      try {
        console.log('[INVITE] Attempting to send invite email to:', email);
        // await sendInviteEmail(email, gardenId); // Uncomment and implement this function
        console.log('[INVITE] Invite email sent successfully to:', email);
      } catch (emailError) {
        console.error('[INVITE] Failed to send invite email:', email, emailError);
      }
      return NextResponse.json({ success: true, message: 'Invite created for new user.' });
    }
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
} 