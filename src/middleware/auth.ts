import { NextRequest, NextResponse } from 'next/server';
import { User, Permission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { hasPermission } from '@/types/auth';

// Extend the NextRequest type to include user
interface AuthenticatedRequest extends NextRequest {
  user: User | null;
}

export async function withAuth(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  requiredPermission?: Permission
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user with roles and permissions from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user has required permission
    if (requiredPermission && !hasPermission(user, requiredPermission)) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add user to request for use in handler
    const req = request as AuthenticatedRequest;
    req.user = user;

    return handler();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 