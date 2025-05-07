// frontend/credalysis-frontend/src/app/home/layout.tsx
import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Credalysis',
  description: 'AI-Powered Financial Intelligence',
};

export default function InnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <nav className="w-64 h-screen bg-gray-800 text-white fixed">
        <ul className="p-6 space-y-4">
          <li><a href="/admin/dashboard" className="hover:underline">Dashboard</a></li>
          <li><a href="/admin/analytics" className="hover:underline">Analytics</a></li>
          <li><a href="/admin/recommendations" className="hover:underline">Recommendations</a></li>
        </ul>
      </nav>
      <main className="ml-64 p-6 w-full min-h-screen bg-gray-100">{children}</main>
    </div>
  );
}