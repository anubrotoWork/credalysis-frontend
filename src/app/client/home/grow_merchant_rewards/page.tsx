'use client';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from "next/navigation";

// type RewardTransaction = {
//   transaction_id: string;
//   customer_id: string;
//   merchant_name: string;
//   primary_category: string;
// };

type MerchantRewardsData = {
  reward_transactions: number;
  analysis: string;
};

export default function ClientMerchantRewardsPage() {
  const [data, setData] = useState<MerchantRewardsData | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'analysis'>('transactions');

  const router = useRouter();
    useEffect(() => {
      const isLoggedIn = localStorage.getItem("auth") === "true";
      const isClient = localStorage.getItem("access") == "client";
  
      console.log(localStorage);
      if (!isLoggedIn) {
        router.push("/login");
      }
  
      if(!isClient) {
        alert("you are not client financial institution");
        router.push("/login");
      }
    }, [router]);

  useEffect(() => {
    fetch('http://34.9.145.33:8000/api/client/grow_merchant_rewards/')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load merchant rewards data:', err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Grow Merchant Rewards</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('transactions')}
        >
          Reward Transactions
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('analysis')}
        >
          Reward Analysis
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === 'transactions' && (
          <div className="text-lg font-semibold text-gray-800">
            Reward Transactions: <span className="text-blue-600">{data.reward_transactions}</span>
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
