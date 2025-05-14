import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WeatherGardenList, WeatherGarden } from './WeatherGardenList';

export default async function WeatherPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div className="p-8 text-center text-red-500">You must be signed in to view weather status.</div>;
  }

  const gardens: WeatherGarden[] = await prisma.garden.findMany({
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

  // This function will be stringified and run on the client
  const runWeatherCheck = async () => {
    await fetch('/api/weather/test', { method: 'POST' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-100 mb-8">Weather Status</h1>
      <WeatherGardenList gardens={gardens} />
    </div>
  );
} 