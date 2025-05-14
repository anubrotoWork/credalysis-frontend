'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CustomerProduct = {
  customer_product_id: string;
  customer_id: string;
  product_id: string;
  balance: number;
  credit_limit: number;
  start_date: string;
  end_date: string | null;
  status: string;
  payment_amount: number;
  payment_frequency: string | null;
  interest_rate: number;
  annual_fee: number;
};

type WalletShareResponse = {
  products: CustomerProduct[];
  wallet_share: number;
  analysis: string;
};

export default function WalletSharePage() {
  const [data, setData] = useState<WalletShareResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'analysis'>('products');
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('auth') === 'true';
    const isUser = localStorage.getItem('access') === 'user';
    const email = localStorage.getItem('email');

    if (!isLoggedIn || !isUser || !email) {
      router.push('/login');
      return;
    }

    fetch(`http://34.9.145.33:8000/api/user/wallet_share/?email=${email}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Error fetching wallet share data:', err));
  }, [router]);

  if (!data) return <div className="p-4">Loading wallet share data...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Wallet Share Insights</h1>
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('products')}
        >
          Product Breakdown
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('analysis')}
        >
          Cross-sell Analysis
        </button>
      </div>

      {activeTab === 'products' && (
        <div>
          <p className="mb-2 font-semibold">Total Wallet Share: ${data.wallet_share.toLocaleString()}</p>
          <table className="min-w-full text-sm border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Product ID</th>
                <th className="p-2 border">Balance</th>
                <th className="p-2 border">Credit Limit</th>
                <th className="p-2 border">Interest Rate</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product.customer_product_id} className="border-t">
                  <td className="p-2 border">{product.product_id}</td>
                  <td className="p-2 border">${product.balance.toLocaleString()}</td>
                  <td className="p-2 border">${product.credit_limit.toLocaleString()}</td>
                  <td className="p-2 border">{product.interest_rate}%</td>
                  <td className="p-2 border">{product.status}</td>
                  <td className="p-2 border">{product.start_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.analysis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
