'use client';

import { useEffect } from 'react';
import { basePath, withBasePath } from '@/lib/paths';

/** Paths owned by other apps on the same host — do not prefix these. */
const OTHER_APP_PREFIXES = ['/portfolio', '/Glog', '/health', '/assets'];

function shouldPrefix(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith(basePath)) return false;
  return !OTHER_APP_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Prefix absolute fetch + anchor navigation when served under /gardenlogbook */
export function BasePathFetchPatch() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string' && shouldPrefix(input)) {
        return originalFetch(withBasePath(input), init);
      }
      return originalFetch(input, init);
    };

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !shouldPrefix(href)) return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(withBasePath(href));
    };

    document.addEventListener('click', onClick, true);

    return () => {
      window.fetch = originalFetch;
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}
