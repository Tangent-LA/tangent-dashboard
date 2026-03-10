import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tangent - Project Management Dashboard',
  description: 'Ultra-luxury project management dashboard for Tangent Landscape Architecture',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {/* Background animation */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-[#0f1419] to-[#0a1628]" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-tangent-blue/10 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-tangent-blue/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
