'use client';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Product = {
  product_id: string;
  customer_id: string;
  balance: number;
};

type WalletShareData = {
  sample_products: Product[];
  total_balance: number;
  analysis: string;
};

export default function WalletSharePage() {
  const [data, setData] = useState<WalletShareData | null>(null);
  const [activeTab, setActiveTab] = useState<'sample' | 'total' | 'analysis'>('sample');

  useEffect(() => {
    fetch('http://34.9.145.33:8000/api/client/wallet_share/')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load wallet share data:', err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Wallet Share Analysis</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'sample' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('sample')}
        >
          Sample Products
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'total' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('total')}
        >
          Total Balance
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('analysis')}
        >
          Cross-Sell Opportunities
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === 'sample' && (
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 border">Product ID</th>
                  <th className="text-left p-2 border">Customer ID</th>
                  <th className="text-left p-2 border">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.sample_products.map((product) => (
                  <tr key={`${product.product_id}-${product.customer_id}`} className="hover:bg-gray-50">
                    <td className="p-2 border">{product.product_id}</td>
                    <td className="p-2 border">{product.customer_id}</td>
                    <td className="p-2 border">{product.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && activeTab === 'total' && (
          <div className="text-lg font-semibold text-gray-800">
            Total Balance: <span className="text-blue-600">{data.total_balance}</span>
          </div>
        )}

        {data && activeTab === 'analysis' && (
          <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.analysis}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
