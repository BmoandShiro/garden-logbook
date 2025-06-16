import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SensorDashboard } from './SensorDashboard';

export default async function SensorsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div className="p-8 text-center text-red-500">You must be signed in to view sensor status.</div>;
  }

  // Get user's gardens for sensor linking
  const gardens = await prisma.garden.findMany({
    where: {
      OR: [
        { creatorId: session.user.id },
        { members: { some: { userId: session.user.id } } }
      ]
    },
    select: {
      id: true,
      name: true,
      description: true,
      plants: {
        select: { id: true, name: true }
      },
      rooms: {
        select: { id: true, name: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Get user's Govee devices
  const devices = await prisma.goveeDevice.findMany({
    where: {
      userId: session.user.id
    },
    select: {
      id: true,
      deviceId: true,
      name: true,
      type: true,
      isOnline: true,
      lastState: true,
      lastStateAt: true,
      linkedEntity: true
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SensorDashboard 
          gardens={gardens} 
          devices={devices}
          userId={session.user.id} 
          userEmail={session.user.email || ""} 
        />
      </main>
    </div>
  );
} 