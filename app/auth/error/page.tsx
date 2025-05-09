"use client";
import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="text-lg text-red-500">
        {error ? decodeURIComponent(error) : "An unknown error occurred."}
      </p>
    </div>
  );
} 