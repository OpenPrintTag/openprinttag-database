/// <reference types="vite/client" />
import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import * as React from 'react';

import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import appCss from '~/styles/global.css?url';
import { seo } from '~/utils/seo';

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
      <body>
        <div className="flex gap-4 border-b bg-gray-50 p-3 text-lg">
          <Link
            to="/brands"
            activeProps={{
              className: 'font-bold',
            }}
          >
            Brands
          </Link>
          <Link to="/containers" activeProps={{ className: 'font-bold' }}>
            Containers
          </Link>
          {/*<Link to="/devices/printers" activeProps={{ className: 'font-bold' }}>
            Printers
          </Link>
          <Link
            to="/devices/accessories"
            activeProps={{ className: 'font-bold' }}
          >
            Accessories
          </Link>
          <Link
            to="/print-sheet-types"
            activeProps={{ className: 'font-bold' }}
          >
            Print Sheet Types
          </Link>*/}
          <Link to="/enum" activeProps={{ className: 'font-bold' }}>
            Enum
          </Link>
        </div>
        <hr />
        <div className="page">{children}</div>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
