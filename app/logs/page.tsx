"use client";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LogsDisplay from './components/LogsDisplay';

export default function LogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.id) {
      router.replace('/auth/signin');
    }
  }, [session, status, router]);

  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-bg-primary">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LogsDisplay userId={session.user.id} />
      </main>
    </div>
  );
} 