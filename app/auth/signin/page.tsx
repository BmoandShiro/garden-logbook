import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SignInForm from './SignInForm';
import Link from 'next/link';

export default async function SignIn() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/');
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <h1 className="text-3xl font-bold tracking-tight text-garden-400">Garden Logbook</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-semibold leading-9 text-dark-text-primary">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-dark-text-secondary">
          Start tracking your garden&apos;s progress
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-dark-bg-secondary px-6 py-8 shadow-xl ring-1 ring-dark-border sm:rounded-lg sm:px-12">
          <SignInForm />
        </div>
      </div>
    </div>
  );
} 