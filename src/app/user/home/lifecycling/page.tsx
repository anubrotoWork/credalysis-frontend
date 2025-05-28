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

// Type Definitions (making some fields nullable based on common scenarios)
type Goal = {
  goal_id: string; // Assuming goal_id is never null for existing goals
  customer_id: string;
  goal_type: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number | null;
  start_date: string | null;
  target_date: string;
  required_monthly_contribution: number | null;
  actual_monthly_contribution: number | null;
  on_track: number | boolean; // boolean is more typical for on_track
  status: string;
  priority: string;
  last_updated?: string; // Optional
};

type Product = {
  customer_product_id: string;
  customer_id: string;
  product_id: string;
  product_name?: string; // Add if available from backend
  balance: number;
  credit_limit: number | null;
  start_date: string;
  end_date: string | null;
  status: string;
  payment_amount: number | null;
  payment_frequency: string | null;
  interest_rate: number | null;
  annual_fee: number | null;
};

type LifecycleResponse = {
  goals: Goal[] | null;
  products: Product[] | null;
  lifecycle: string; // AI-generated lifecycle analysis
};

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

// Helper to format dates
const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch {
        return dateString; // Fallback to original string if parsing fails
    }
};

// Helper to format currency
const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


export default function LifecyclePage() {
  const [data, setData] = useState<LifecycleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"lifecycle" | "goals" | "products">(
    "lifecycle" // Default to lifecycle analysis
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

  const fetchLifecycleData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(
        `${backendApiUrl}/api/user/lifecycle/` // Removed email query param
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch data" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: LifecycleResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching lifecycle data:", err);
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
      fetchLifecycleData();
    }
  }, [fetchLifecycleData]);

  const getProgressColor = (progress: number | null | undefined): string => {
    const p = progress || 0;
    if (p < 25) return "bg-red-500";
    if (p < 50) return "bg-yellow-500";
    if (p < 75) return "bg-blue-500";
    return "bg-green-500";
  };


  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px] p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-gray-600">Loading lifecycle insights...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 p-6">
          <p className="text-red-600 font-semibold text-lg">Error:</p>
          <p className="text-gray-700 my-2">{error}</p>
          <button
            onClick={fetchLifecycleData}
            className="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    if (!data || (!data.goals?.length && !data.products?.length && !data.lifecycle)) {
      return <div className="text-center py-10 text-gray-500 italic">No lifecycle data available at this time.</div>;
    }

    switch (activeTab) {
      case "goals":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Your Financial Goals</h2>
            {data.goals && data.goals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {data.goals.map((goal) => (
                  <div
                    key={goal.goal_id || goal.goal_name} // Fallback key
                    className="p-4 bg-white rounded-lg shadow-md border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{goal.goal_name}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            goal.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' :
                            goal.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>{goal.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">Type: {goal.goal_type} ({goal.priority} Priority)</p>
                    <div className="my-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress: {goal.progress_percent?.toFixed(0) || 0}%</span>
                            <span>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                            className={`${getProgressColor(goal.progress_percent)} h-2.5 rounded-full`}
                            style={{ width: `${goal.progress_percent || 0}%` }}
                            ></div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">Target Date: {formatDate(goal.target_date)}</p>
                    {goal.required_monthly_contribution !== null && <p className="text-sm text-gray-600">Required Monthly: {formatCurrency(goal.required_monthly_contribution)}</p>}
                    {goal.actual_monthly_contribution !== null && <p className="text-sm text-gray-600">Actual Monthly: {formatCurrency(goal.actual_monthly_contribution)}</p>}
                    <p className={`text-sm font-medium ${goal.on_track ? 'text-green-600' : 'text-red-600'}`}>
                        {goal.on_track ? 'On Track' : 'Off Track'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No financial goals found.</p>
            )}
          </div>
        );
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Credit Limit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Interest Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.products.map((product) => (
                      <tr key={product.customer_product_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name || product.product_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                             <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
                                product.status?.toLowerCase() === 'closed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {product.status || 'N/A'}
                            </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(product.balance)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(product.credit_limit)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{product.interest_rate !== null ? `${product.interest_rate.toFixed(2)}%` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No active products found.</p>
            )}
          </div>
        );
      case "lifecycle":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Lifecycle Analysis & Insights</h2>
            {data.lifecycle ? (
                <div className="prose max-w-none prose-sm sm:prose-base p-4 bg-gray-50 rounded-lg border custom-scrollbar">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                    >
                        {data.lifecycle}
                    </ReactMarkdown>
                </div>
            ) : (
                <p className="text-gray-500 italic">No lifecycle analysis available.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">Customer Lifecycle Overview</h1>
         <p className="text-md text-gray-600 mt-1">
            Understand your financial journey with insights on your goals, products, and overall lifecycle stage.
        </p>
      </header>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b border-gray-300 pb-3">
        <button
          onClick={() => setActiveTab("lifecycle")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "lifecycle"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Lifecycle Analysis
        </button>
        <button
          onClick={() => setActiveTab("goals")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "goals"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          My Goals
        </button>
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