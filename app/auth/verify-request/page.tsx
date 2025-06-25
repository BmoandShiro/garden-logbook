'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to get email from query param first
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else if (typeof window !== 'undefined') {
      // Fallback to sessionStorage
      const storedEmail = sessionStorage.getItem('pendingSignInEmail') || '';
      setEmail(storedEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !token) {
      setError("Email or token is missing.");
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        body: new URLSearchParams({
          email,
          token,
        }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = data.redirect || '/';
      } else {
        setError(data.error || "The code you entered is incorrect. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-dark-bg-primary">
      <Card className="w-full max-w-sm bg-dark-bg-secondary border-dark-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-100">Check your email</CardTitle>
          <CardDescription className="text-dark-text-secondary">
            We sent a 6-digit code to {email || 'your email'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!email && (
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            )}
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