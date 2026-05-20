/// <reference types="vite/client" />
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
} from '@tanstack/react-router';
import * as React from 'react';
import { Toaster } from 'sonner';

import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary';
import {
  GlobalSearch,
  GlobalSearchTrigger,
  useGlobalSearch,
} from '~/components/global-search';
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
        href: `${import.meta.env.BASE_URL}apple-touch-icon.png`,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: `${import.meta.env.BASE_URL}favicon.svg`,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        href: `${import.meta.env.BASE_URL}favicon-96x96.png`,
      },
      {
        rel: 'manifest',
        href: `${import.meta.env.BASE_URL}site.webmanifest`,
      },
      { rel: 'icon', href: `${import.meta.env.BASE_URL}favicon.ico` },
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
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen, open, close } = useGlobalSearch();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/brands" className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}logo.svg`}
                alt="Prusa Logo"
                className="h-8"
              />
            </Link>
            <div className="hidden items-center gap-6 sm:flex">
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
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="https://openprinttag.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-sm transition-opacity hover:opacity-80 md:inline"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              More about OpenPrintTag →
            </a>
            <GlobalSearchTrigger onClick={open} />
            {/* Mobile hamburger */}
            <button
              className="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-gray-100 sm:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div
            className="border-t px-4 py-3 sm:hidden"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            <div className="flex flex-col gap-3">
              <Link
                to="/brands"
                activeProps={{
                  className: 'font-semibold',
                  style: { color: 'hsl(var(--primary))' },
                }}
                className="text-base transition-colors hover:opacity-80"
                style={{ color: 'hsl(var(--foreground))' }}
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
              >
                Enum
              </Link>
              <a
                href="https://openprinttag.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-opacity hover:opacity-80 md:hidden"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                More about OpenPrintTag →
              </a>
            </div>
          </div>
        )}
      </nav>
      {/* Main Content */}
      <div className="mx-auto min-h-screen w-full max-w-7xl p-4 sm:p-6">
        {children}
      </div>
      {/* Global Search Modal */}
      <GlobalSearch isOpen={isOpen} onClose={close} />
    </>
  );
}
