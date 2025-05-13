'use client';
// src/app/components/ClientLayout.tsx
import { useState, useEffect } from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check window size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Mobile menu toggle button */}
      {isMobile && (
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? 'Close' : 'Menu'}
        </button>
      )}

      {/* Sidebar navigation - fixed on desktop, slide-in on mobile */}
      <nav className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} z-40 transition-transform duration-300 ease-in-out`
          : 'w-64 min-h-screen'
        } 
        bg-gray-800 text-white`}
      >
        <ul className="p-6 space-y-4">
          <li className="mt-4 md:mt-0"><a href="/client/docs" className="block py-2 hover:underline">Docs</a></li>
          <li><a href="/client/dashboard" className="block py-2 hover:underline">Dashboard</a></li>
          <li><a href="/client/analytics" className="block py-2 hover:underline">Analytics</a></li>
          <li><a href="/client/recommendations" className="block py-2 hover:underline">Recommendations</a></li>
          <li><a href="/client/model_manager" className="block py-2 hover:underline">Model Manager</a></li>
        </ul>
      </nav>

      {/* Overlay to close mobile menu when clicking outside */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <main className={`flex-grow ${isMobile ? 'w-full' : 'ml-64'} bg-gray-100`}>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}