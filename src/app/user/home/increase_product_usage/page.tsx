'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';

type Product = {
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

type Recommendation = {
  recommendation_id: number;
  product_name: string;
  match_score: number;
  status: string;
};

type IncreaseProductUsageData = {
  products: Product[] | null;
  recommendations: Recommendation[] | null;
  suggestions: string;
};

export default function IncreaseProductUsagePage() {
  const [data, setData] = useState<IncreaseProductUsageData | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'recommendations' | 'suggestions'>('products');
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('auth') === 'true';
    const isUser = localStorage.getItem('access') === 'user';
    const email = localStorage.getItem('email');

    if (!isLoggedIn || !isUser || !email) {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/increase_product_usage/?email=${email}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load product usage data:', err));
  }, [router]);

  const renderTabContent = () => {
    if (!data) return <p>Loading...</p>;

    switch (activeTab) {
      case 'products':
        return (
          <div>
            <h2 className="text-xl font-semibold">Active Products</h2>
            <table className="min-w-full border-collapse mt-4">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Product ID</th>
                  <th className="border px-4 py-2">Balance</th>
                  <th className="border px-4 py-2">Credit Limit</th>
                  <th className="border px-4 py-2">Interest Rate</th>
                  <th className="border px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.products?.map((product) => (
                  <tr key={product.customer_product_id}>
                    <td className="border px-4 py-2">{product.product_id}</td>
                    <td className="border px-4 py-2">{product.balance}</td>
                    <td className="border px-4 py-2">{product.credit_limit}</td>
                    <td className="border px-4 py-2">{product.interest_rate}%</td>
                    <td className="border px-4 py-2">{product.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'recommendations':
        return (
          <div>
            <h2 className="text-xl font-semibold">Product Recommendations</h2>
            <table className="min-w-full border-collapse mt-4">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Product Name</th>
                  <th className="border px-4 py-2">Match Score</th>
                </tr>
              </thead>
              <tbody>
                {data.recommendations?.map((recommendation) => (
                  <tr key={recommendation.recommendation_id}>
                    <td className="border px-4 py-2">{recommendation.product_name}</td>
                    <td className="border px-4 py-2">{recommendation.match_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'suggestions':
        return (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.suggestions}
            </ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Increase Product Usage</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'products' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'recommendations' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          Recommendations
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`pb-2 px-4 border-b-2 ${activeTab === 'suggestions' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'}`}
        >
          Suggestions
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
}
