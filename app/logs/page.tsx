import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LogsView from './components/LogsView';

export default async function LogsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-100 mb-8">Logs</h1>
      <LogsView userId={session.user.id} />
    </div>
  );
} 