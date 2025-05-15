import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PendingInvitesWrapper from '../components/PendingInvitesWrapper';
import NotificationsList from './NotificationsList'; // Import the new client component

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

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div className="p-8 text-center text-red-500">You must be signed in to view notifications.</div>;
  }
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Pending Invites Dropdown */}
      <PendingInvitesWrapper />
      {/* Use the new client component to render the list */}
      <NotificationsList notifications={notifications} userEmail={session.user.email} />
    </div>
  );
} 