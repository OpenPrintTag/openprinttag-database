/// <reference types="vite/client" />
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import * as React from 'react';
import { Toaster } from 'sonner';

import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary';
import {
  GlobalSearch,
  GlobalSearchTrigger,
  useGlobalSearch,
} from '~/components/GlobalSearch';
import { NotFound } from '~/components/NotFound';
import appCss from '~/styles/global.css?url';
import { seo } from '~/utils/seo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title: 'Open Material Database Editor',
        description: 'UI for editing material database data',
      }),
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: '/favicon-96x96.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body style={{ backgroundColor: 'hsl(var(--background))' }}>
        <QueryClientProvider client={queryClient}>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" richColors />
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
          <TanStackRouterDevtools position="bottom-right" />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen, open, close } = useGlobalSearch();

  return (
    <>
      {/* Navigation Bar */}
      <nav
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{
          backgroundColor: 'hsl(var(--card))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/brands" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Prusa Logo" className="h-8" />
            </Link>
            <div className="flex items-center gap-6">
              <Link
                to="/brands"
                activeProps={{
                  className: 'font-semibold',
                  style: { color: 'hsl(var(--primary))' },
                }}
                className="text-base transition-colors hover:opacity-80"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Brands
              </Link>
              <Link
                to="/containers"
                activeProps={{
                  className: 'font-semibold',
                  style: { color: 'hsl(var(--primary))' },
                }}
                className="text-base transition-colors hover:opacity-80"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Containers
              </Link>
              <Link
                to="/enum"
                activeProps={{
                  className: 'font-semibold',
                  style: { color: 'hsl(var(--primary))' },
                }}
                className="text-base transition-colors hover:opacity-80"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Enum
              </Link>
            </div>
          </div>
          <GlobalSearchTrigger onClick={open} />
        </div>
      </nav>
      {/* Main Content */}
      <div className="min-h-screen">{children}</div>
      {/* Global Search Modal */}
      <GlobalSearch isOpen={isOpen} onClose={close} />
    </>
  );
}
