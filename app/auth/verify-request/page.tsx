'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !token) {
      setError("Email or token is missing.");
      return;
    }

    const res = await signIn('email', {
      email,
      token,
      redirect: false,
      callbackUrl: '/',
    });

    if (res?.error) {
      setError("The code you entered is incorrect. Please try again.");
    } else if (res?.url) {
      window.location.href = res.url;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg-primary">
      <Card className="w-full max-w-sm bg-dark-bg-secondary border-dark-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-100">Check your email</CardTitle>
          <CardDescription className="text-dark-text-secondary">
            We sent a 6-digit code to {email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your 6-digit code"
              className="text-center text-lg tracking-[0.5em]"
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full">
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-dark-bg-primary">
        <Card className="w-full max-w-sm bg-dark-bg-secondary border-dark-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-emerald-100">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyRequestContent />
    </Suspense>
  );
} 