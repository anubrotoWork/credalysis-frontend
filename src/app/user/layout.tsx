// frontend/credalysis-frontend/src/app/home/layout.tsx
import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Credalysis',
  description: 'AI-Powered Financial Intelligence',
};

export default function InnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <nav className="w-64 h-screen bg-gray-800 text-white fixed">
        <ul className="p-6 space-y-4">
          <li><a href="/user/profile" className="hover:underline">Profile</a></li>
          <li><a href="/user/home" className="hover:underline">Home</a></li>
          <li><a href="/user/transactions" className="hover:underline">Transactions</a></li>
          <li><a href="/user/goals" className="hover:underline">Goals</a></li>
          <li><a href="/user/loans" className="hover:underline">Loans</a></li>
          {/* <li><a href="/user/dashboard" className="hover:underline">Dashboard</a></li>
          <li><a href="/user/analytics" className="hover:underline">Analytics</a></li>
          <li><a href="/user/recommendations" className="hover:underline">Recommendations</a></li> */}
          <li><a href="/user/ask-ai" className="hover:underline">Get Help with AI</a></li>
        </ul>
      </nav>
      <main className="ml-64 p-6 w-full min-h-screen bg-gray-100">{children}</main>
    </div>
  );
}