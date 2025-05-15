import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WeatherGardenList } from './WeatherGardenList';

export default async function WeatherPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div className="p-8 text-center text-red-500">You must be signed in to view weather status.</div>;
  }

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
      weatherStatus: true,
      description: true,
      zipcode: true,
      plants: {
        select: { id: true, name: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <WeatherGardenList gardens={gardens} userId={session.user.id} userEmail={session.user.email} />
      </main>
    </div>
  );
} 