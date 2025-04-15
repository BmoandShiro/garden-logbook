import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { Permission } from '@/types/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'USER', 'MODERATOR']),
  permissions: z.array(z.string()),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async () => {
    try {
      const body = await request.json();
      const { name, role, permissions } = updateUserSchema.parse(body);

      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: {
          name,
          role,
          permissions,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
        },
      });

      return NextResponse.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
  }, Permission.MANAGE_USERS);
} 