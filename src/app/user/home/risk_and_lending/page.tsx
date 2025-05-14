'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';

type RiskAndLendingData = {
  risk: Record<string, unknown> | null;
  credit: Record<string, unknown> | null;
  analysis: string;
};

export default function RiskAndLendingPage() {
  const [data, setData] = useState<RiskAndLendingData | null>(null);
  const [activeTab, setActiveTab] = useState<'risk' | 'credit' | 'analysis'>('risk');
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('auth') === 'true';
    const isUser = localStorage.getItem('access') === 'user';
    const email = localStorage.getItem('email');

    if (!isLoggedIn || !isUser || !email) {
      router.push('/login');
      return;
    }

    fetch(`http://34.9.145.33:8000/api/user/risk_and_lending/?email=${email}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load risk/lending data:', err));
  }, [router]);

  const renderTabContent = () => {
    if (!data) return <p>Loading...</p>;

    switch (activeTab) {
      case 'risk':
        return (
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(data.risk, null, 2)}
          </pre>
        );
      case 'credit':
        return (
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(data.credit, null, 2)}
          </pre>
        );
      case 'analysis':
        return (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.analysis}
            </ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Risk & Lending Profile</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('risk')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'risk' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          Risk Assessment
        </button>
        <button
          onClick={() => setActiveTab('credit')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'credit' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          Credit Report
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          LLM Analysis
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
}
