import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NotificationsList from './NotificationsList';

// Define Notification type - This will be passed to NotificationsList
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  meta?: { inviteId?: string, gardenId?: string, gardenName?: string, roomId?: string, roomName?: string, zoneId?: string, zoneName?: string, plantId?: string, plantName?: string };
  read: boolean;
  createdAt: string;
}

interface PendingInvite {
  id: string;
  gardenId: string;
  email: string;
  invitedAt: string;
  accepted: boolean;
  garden: { id: string; name: string };
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return <div className="p-8 text-center text-red-500">You must be signed in to view notifications.</div>;
  }
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  // Fetch pending invites for this user
  const invites = await prisma.gardenInvite.findMany({
    where: { email: session.user.email, accepted: false },
    include: { garden: { select: { id: true, name: true } } },
    orderBy: { invitedAt: 'desc' },
  });
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <NotificationsList notifications={notifications} userEmail={session.user.email} pendingInvites={invites} />
    </div>
  );
} 