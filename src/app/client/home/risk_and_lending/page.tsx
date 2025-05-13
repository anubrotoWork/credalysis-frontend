'use client';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type RiskAndLendingData = {
  risk_count: number;
  credit_count: number;
  analysis: string;
};

export default function RiskAndLendingPage() {
  const [data, setData] = useState<RiskAndLendingData | null>(null);
  const [activeTab, setActiveTab] = useState<'counts' | 'analysis'>('counts');

  useEffect(() => {
    fetch('http://34.9.145.33:8000/api/client/risk_and_lending/')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load risk and lending data:', err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Risk and Lending Analysis</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'counts' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('counts')}
        >
          Counts
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === 'counts' && (
          <div className="space-y-4 text-lg font-semibold text-gray-800">
            <p>Total Risk Assessments: <span className="text-blue-600">{data.risk_count}</span></p>
            <p>Total Credit Reports: <span className="text-blue-600">{data.credit_count}</span></p>
          </div>
        )}

        {data && activeTab === 'analysis' && (
          <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.analysis}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
