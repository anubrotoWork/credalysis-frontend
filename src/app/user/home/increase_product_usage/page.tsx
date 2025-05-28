"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// Define authFetch here or import from a shared lib
// It's better to have this in a shared file (e.g., src/lib/authFetch.ts)
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('email');
    localStorage.removeItem('access');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'; // Or use router.push('/login')
    }
  }
  return response;
}


type Product = {
  customer_product_id: string;
  customer_id: string; // Assuming these are part of the backend response if needed
  product_id: string;
  balance: number;
  credit_limit: number | null; // Allow null for credit_limit
  start_date: string;
  end_date: string | null;
  status: string;
  payment_amount: number | null; // Allow null for payment_amount
  payment_frequency: string | null;
  interest_rate: number | null; // Allow null for interest_rate
  annual_fee: number | null; // Allow null for annual_fee
  // Add product_name if available from backend, it's more user-friendly than product_id
  product_name?: string;
};

type Recommendation = {
  recommendation_id: string; // Changed to string if it's a UUID
  product_name: string;
  match_score: number;
  status?: string; // Optional status for recommendation
  reason?: string; // Optional reason for recommendation
};

type IncreaseProductUsageData = {
  products: Product[] | null;
  recommendations: Recommendation[] | null;
  suggestions: string;
};

// Custom components for ReactMarkdown to enhance table styling
const markdownComponents: Components = {
  table: (props) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm">
      <table
        className="min-w-full divide-y divide-gray-200 text-sm"
        {...props}
      />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-100" {...props} />,
  tbody: (props) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
  tr: (props) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
  th: (props) => (
    <th
      className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider"
      {...props}
    />
  ),
  td: (props) => <td className="px-4 py-3 whitespace-nowrap" {...props} />,
};


export default function IncreaseProductUsagePage() {
  const [data, setData] = useState<IncreaseProductUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "recommendations" | "suggestions">(
    "products"
  );
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");

    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "user") {
      alert("You do not have permission to access this page.");
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchProductUsageData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${backendApiUrl}/api/user/increase_product_usage/` // Removed email query param
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch data" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: IncreaseProductUsageData = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to load product usage data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [backendApiUrl]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (authToken && userAccessLevel === "user") {
      fetchProductUsageData();
    }
  }, [fetchProductUsageData]);


  const renderTabContent = () => {
    if (loading) {
        return (
          <div className="flex justify-center items-center min-h-[300px] p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-gray-600">Loading product usage insights...</p>
          </div>
        );
    }
    if (error) {
        return (
            <div className="text-center py-10 p-6">
                <p className="text-red-600 font-semibold text-lg">Error:</p>
                <p className="text-gray-700 my-2">{error}</p>
                <button
                    onClick={fetchProductUsageData}
                    className="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }
    if (!data || (!data.products?.length && !data.recommendations?.length && !data.suggestions)) {
        return <div className="text-center py-10 text-gray-500 italic">No product usage data or suggestions available at this time.</div>;
    }

    switch (activeTab) {
      case "products":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Your Active Products</h2>
            {data.products && data.products.length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar shadow-md rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name/ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Credit Limit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Interest Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.products.map((product) => (
                      <tr key={product.customer_product_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name || product.product_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">${product.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {product.credit_limit !== null ? `$${product.credit_limit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {product.interest_rate !== null ? `${product.interest_rate.toFixed(2)}%` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
                                product.status?.toLowerCase() === 'closed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {product.status || 'N/A'}
                            </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">You have no active products listed.</p>
            )}
          </div>
        );
      case "recommendations":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Personalized Product Recommendations</h2>
            {data.recommendations && data.recommendations.length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar shadow-md rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Match Score</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.recommendations.map((rec) => (
                      <tr key={rec.recommendation_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{rec.product_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div
                                    className="bg-blue-500 h-2.5 rounded-full"
                                    style={{ width: `${Math.min(rec.match_score * 100, 100)}%` }} // Assuming match_score is 0-1
                                ></div>
                                </div>
                                {(rec.match_score * 100).toFixed(0)}%
                            </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{rec.reason || 'General recommendation'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No specific product recommendations for you at this time.</p>
            )}
          </div>
        );
      case "suggestions":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">AI-Powered Suggestions</h2>
            {data.suggestions ? (
                <div className="prose max-w-none prose-sm sm:prose-base p-4 bg-gray-50 rounded-lg border custom-scrollbar">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents} // Apply custom table styling if suggestions include tables
                    >
                        {data.suggestions}
                    </ReactMarkdown>
                </div>
            ) : (
                <p className="text-gray-500 italic">No AI suggestions available currently.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">Increase Product Engagement</h1>
        <p className="text-md text-gray-600 mt-1">
            Discover how to make the most of your products and find new opportunities.
        </p>
      </header>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b border-gray-300 pb-3">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "products"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          My Products
        </button>
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "recommendations"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Recommendations
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "suggestions"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          AI Suggestions
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl min-h-[400px]">
        {renderTabContent()}
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f7fafc; /* Tailwind gray-100 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0; /* Tailwind gray-400 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0; /* Tailwind gray-500 */
        }
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
      `}</style>
    </div>
  );
}