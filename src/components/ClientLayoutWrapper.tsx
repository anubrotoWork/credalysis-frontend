// src/app/components/ClientLayoutWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

// Import the client component dynamically to avoid SSR issues
const ClientLayout = dynamic(() => import('./ClientLayout'), {
  ssr: false,
});

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}