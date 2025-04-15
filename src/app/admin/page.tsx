import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { Role, Permission, hasPermission } from '@/types/auth';
import { UserManagement } from '@/components/admin/UserManagement';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Garden Logbook',
  description: 'Manage users and their permissions',
};

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      permissions: true,
    },
  });
  return users;
}

async function updateUser(userId: string, data: any) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update user');
  }

  return response.json();
}

export default async function AdminPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
      permissions: true,
    },
  });

  if (!currentUser || !hasPermission({ ...session.user, ...currentUser } as any, Permission.MANAGE_USERS)) {
    redirect('/');
  }

  const users = await getUsers();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">User Management</h1>
      <UserManagement users={users} onUpdateUser={updateUser} />
    </div>
  );
} 