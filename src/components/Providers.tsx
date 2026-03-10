'use client';

import { ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
  const { theme } = useStore();

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#12121a',
            color: '#fff',
            border: '1px solid rgba(0, 174, 239, 0.15)',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#00c853',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff5252',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
