'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';

type Customer = {
  customer_id: string;
  age: number;
  income_category: string;
  state: string;
};

type Insight = Record<string, unknown>;

type OverviewData = {
  customer: Customer;
  insights: Insight | null;
  summary: string;
};

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState<'customer' | 'insights' | 'summary'>('customer');
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('auth') === 'true';
    const isUser = localStorage.getItem('access') === 'user';
    const email = localStorage.getItem('email');

    if (!isLoggedIn || !isUser || !email) {
      router.push('/login');
      return;
    }

    fetch(`http://34.9.145.33:8000/api/user/overview/?email=${email}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load overview:', err));
  }, [router]);

  const renderTabContent = () => {
    if (!data) return <p>Loading...</p>;

    switch (activeTab) {
      case 'customer':
        return (
          <div className="text-gray-700 space-y-1">
            <p><strong>Customer ID:</strong> {data.customer.customer_id}</p>
            <p><strong>Age:</strong> {data.customer.age}</p>
            <p><strong>Income:</strong> {data.customer.income_category}</p>
            <p><strong>State:</strong> {data.customer.state}</p>
          </div>
        );
      case 'insights':
        return (
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(data.insights, null, 2)}
          </pre>
        );
      case 'summary':
        return (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.summary}
            </ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Customer Overview</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('customer')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'customer' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          Customer Info
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'insights' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          Insights
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'summary' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          LLM Summary
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
}
