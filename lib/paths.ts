/** App subpath on the homelab host — always set even if env is missing at runtime. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/gardenlogbook';

export function withBasePath(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.startsWith(basePath)) return path;
  return `${basePath}${path === '/' ? '' : path}` || basePath;
}

export const homePath = withBasePath('/');
