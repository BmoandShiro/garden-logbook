import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from './prisma';
import { Role, Permission } from '@prisma/client';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { roles: true }
  });

  return user;
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Admin role has all permissions
  if (user.roles.some(role => role === Role.ADMIN)) {
    return true;
  }

  // Check specific permissions based on roles
  // Add more role-based permission checks here as needed
  return false;
} 