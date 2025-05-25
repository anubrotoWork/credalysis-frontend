'use client';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from "next/navigation";
// type Product = {
//   customer_id: string;
//   product_id: string;
//   status: string;
// };

// type Recommendation = {
//   product_id: string;
//   match_score: number;
// };

type ProductUsageData = {
  active_products: number;
  recommendations: number;
  suggestions: string;
};

export default function ClientProductUsagePage() {
  const [data, setData] = useState<ProductUsageData | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'recommendations' | 'suggestions'>('products');
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
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
    fetch(`${backendApiUrl}/api/client/increase_product_usage/`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load product usage data:', err));
  }, [backendApiUrl]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Increase Product Usage</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('products')}
        >
          Active Products
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'recommendations' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Product Recommendations
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'suggestions' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === 'products' && (
          <div className="text-lg font-semibold text-gray-800">
            Active Products: <span className="text-blue-600">{data.active_products}</span>
          </div>
        )}

        {data && activeTab === 'recommendations' && (
          <div className="text-lg font-semibold text-gray-800">
            Recommendations: <span className="text-blue-600">{data.recommendations}</span>
          </div>
        )}

        {data && activeTab === 'suggestions' && (
          <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.suggestions}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
