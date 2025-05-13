'use client';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// type Trend = {
//   customer_id: string;
//   insight_date: string;
//   total_income: number;
//   total_expenses: number;
//   savings_rate: number;
//   financial_health_score: number;
// };

type TrendData = {
  data_points: number;
  trend_analysis: string;
};

export default function ClientTrendsPage() {
  const [data, setData] = useState<TrendData | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'analysis'>('trends');

  useEffect(() => {
    fetch('http://34.9.145.33:8000/api/client/trends/')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load trend data:', err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Client Financial Trends</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'trends' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('trends')}
        >
          Financial Trends
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('analysis')}
        >
          Trend Analysis
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === 'trends' && (
          <div className="text-lg font-semibold text-gray-800">
            Total Data Points: <span className="text-blue-600">{data.data_points}</span>
          </div>
        )}

        {data && activeTab === 'analysis' && (
          <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.trend_analysis}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}