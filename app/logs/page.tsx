import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LogsDisplay from './components/LogsDisplay';

export default async function LogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <div className="bg-dark-bg-secondary shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-dark-text-primary">Logs</h1>
        </div>
      </div>
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <LogsDisplay userId={session.user.id} />
        </div>
      </main>
    </div>
  );
} 