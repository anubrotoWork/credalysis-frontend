'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type RewardTransaction = {
  transaction_id: string;
  customer_id: string;
  merchant_id: string;
  amount: number;
  date: string;
  category: string;
  merchant_name: string;
  primary_category: string;
};

type GrowMerchantRewardsResponse = {
  rewards: RewardTransaction[];
  analysis: string;
};

export default function GrowMerchantRewardsPage() {
  const [data, setData] = useState<GrowMerchantRewardsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'analysis'>('transactions');
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('auth') === 'true';
    const isUser = localStorage.getItem('access') === 'user';
    const email = localStorage.getItem('email');

    if (!isLoggedIn || !isUser || !email) {
      router.push('/login');
      return;
    }

    fetch(`http://34.9.145.33:8000/api/user/grow_merchant_rewards/?email=${email}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to fetch merchant rewards:', err));
  }, [router]);

  if (!data) return <p className="p-6">Loading merchant rewards...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Grow Merchant Rewards</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'transactions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'analysis'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          AI Analysis
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' && (
        <section>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Merchant</th>
                  <th className="border px-4 py-2">Amount</th>
                  <th className="border px-4 py-2">Category</th>
                  <th className="border px-4 py-2">Primary Category</th>
                </tr>
              </thead>
              <tbody>
                {data.rewards.map((txn) => (
                  <tr key={txn.transaction_id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className="border px-4 py-2">{txn.merchant_name}</td>
                    <td className="border px-4 py-2">${txn.amount.toFixed(2)}</td>
                    <td className="border px-4 py-2">{txn.category}</td>
                    <td className="border px-4 py-2">{txn.primary_category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'analysis' && (
        <section className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {data.analysis}
          </ReactMarkdown>
        </section>
      )}
    </div>
  );
}
