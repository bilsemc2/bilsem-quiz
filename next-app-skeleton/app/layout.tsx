import type { Metadata } from 'next';
import Link from 'next/link';

import { AppProviders } from '@/app-providers/AppProviders';
import { SITE_NAME, SITE_NAV_ITEMS } from '@/shared/config/site';

import './globals.css';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: 'Scalable Next.js skeleton for Bilsem Quiz migration.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <AppProviders>
          <div className="main-shell">
            <header className="site-header">
              <div className="container header-row">
                <Link className="brand" href="/home">
                  {SITE_NAME}
                </Link>
                <nav>
                  <ul className="nav-list">
                    {SITE_NAV_ITEMS.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href}>{item.label}</Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </header>

            <main className="container page">{children}</main>

            <footer className="container footer">
              <small>Next.js App Router skeleton | Feature-first architecture</small>
            </footer>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
