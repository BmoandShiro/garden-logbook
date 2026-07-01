'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { BasePathFetchPatch } from '@/components/BasePathFetchPatch';
import { basePath } from '@/lib/paths';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath={`${basePath}/api/auth`}>
      <QueryClientProvider client={queryClient}>
        <UserPreferencesProvider>
          <BasePathFetchPatch />
          {children}
        </UserPreferencesProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
} 