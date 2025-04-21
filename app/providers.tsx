'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <UserPreferencesProvider>
          {children}
        </UserPreferencesProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
} 