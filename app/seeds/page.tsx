import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SeedList from './components/SeedList';
import CreateSeedButton from './components/CreateSeedButton';

export const metadata: Metadata = {
  title: 'Seeds | Garden Logbook',
  description: 'Manage your seed collection',
};

export default async function SeedsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const seeds = await prisma.seed.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      createdBy: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-emerald-100">Seeds</h1>
        <CreateSeedButton />
      </div>
      <SeedList seeds={seeds} />
    </div>
  );
} 