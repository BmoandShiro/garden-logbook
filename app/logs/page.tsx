import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LogsDisplay from './components/LogsDisplay';
import LogsHeader from './components/LogsHeader';

export default async function LogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <div className="bg-dark-bg-secondary shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <LogsHeader userId={session.user.id} />
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LogsDisplay userId={session.user.id} />
      </main>
    </div>
  );
} 