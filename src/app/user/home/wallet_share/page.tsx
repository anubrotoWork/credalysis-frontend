"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// Define authFetch here or import from a shared lib
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('email');
    localStorage.removeItem('access');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return response;
}

type CustomerProduct = {
  customer_product_id: string;
  customer_id: string; // Not typically displayed but good for type completeness
  product_id: string; // This is likely what's shown as "Product Name" or similar
  product_name?: string; // Added: The backend might join with financial_products to send this
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

// Custom components for ReactMarkdown to enhance table styling
const markdownComponents: Components = {
  table: (props) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-100" {...props} />,
  tbody: (props) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
  tr: (props) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
  th: (props) => <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider" {...props} />,
  td: (props) => <td className="px-4 py-3 whitespace-nowrap" {...props} />,
};

const formatDate = (dateString: string | null | undefined) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
const formatCurrency = (amount: number | null | undefined) => amount != null ? `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';
const formatPercent = (rate: number | null | undefined) => rate != null ? `${rate.toFixed(2)}%` : 'N/A';

export default function WalletSharePage() {
  const [data, setData] = useState<WalletShareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "analysis">("products");
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Effect for authentication and authorization check
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

  // Function to fetch wallet share data
  const fetchWalletShareData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Backend now derives email from JWT
      const response = await authFetch(
        `${backendApiUrl}/api/user/wallet_share/`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch wallet share data" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: WalletShareResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching wallet share data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [backendApiUrl]);

  // Effect to call fetchWalletShareData when component mounts and user is authenticated
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (authToken && userAccessLevel === "user") {
      fetchWalletShareData();
    } else if (!authToken || userAccessLevel !== "user") {
        setLoading(false);
    }
  }, [fetchWalletShareData]);

  const renderProductStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    let badgeClass = "bg-gray-100 text-gray-700"; // Default
    if (statusLower === "active") badgeClass = "bg-green-100 text-green-700";
    else if (statusLower === "closed" || statusLower === "paid off") badgeClass = "bg-blue-100 text-blue-700";
    else if (statusLower === "pending") badgeClass = "bg-yellow-100 text-yellow-700";
    else if (statusLower === "defaulted" || statusLower === "inactive") badgeClass = "bg-red-100 text-red-700";

    return (
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
            {status || 'N/A'}
        </span>
    );
  };


  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[300px] p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-gray-600">Loading wallet share insights...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold text-lg">Error:</p>
          <p className="text-gray-700 my-2">{error}</p>
          <button
            onClick={fetchWalletShareData}
            className="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    if (!data || (!data.products?.length && !data.analysis)) {
        return <div className="text-center py-10 text-gray-500 italic">No wallet share data or analysis available at this time.</div>;
    }

    switch (activeTab) {
      case "products":
        if (!data.products || data.products.length === 0) {
            return <p className="text-gray-500 italic p-4">You currently have no products contributing to your wallet share.</p>;
        }
        return (
          <div>
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200 shadow">
              <p className="text-lg font-semibold text-indigo-700">
                Total Wallet Share (Sum of Balances):
                <span className="ml-2 text-2xl font-bold">{formatCurrency(data.wallet_share)}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">This represents the total balance across all your active products with us.</p>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Your Product Breakdown</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Name/ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Balance</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Credit Limit</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Interest Rate</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Annual Fee</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.products.map((product) => (
                    <tr key={product.customer_product_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name || product.product_id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{formatCurrency(product.balance)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{formatCurrency(product.credit_limit)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{formatPercent(product.interest_rate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{formatCurrency(product.annual_fee)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{renderProductStatusBadge(product.status)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(product.start_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "analysis":
        if (!data.analysis) {
            return <p className="text-gray-500 italic p-4">No cross-sell analysis available at this time.</p>;
        }
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">AI-Powered Cross-Sell Analysis</h2>
            <div className="prose max-w-none prose-sm sm:prose-base p-4 bg-gray-50 rounded-lg border custom-scrollbar">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {data.analysis}
              </ReactMarkdown>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">Wallet Share & Opportunities</h1>
        <p className="text-md text-gray-600 mt-1">
          Understand your product engagement and discover potential opportunities.
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
          Product Breakdown
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "analysis"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Cross-Sell Analysis
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl min-h-[400px]">
        {renderTabContent()}
      </div>
       <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f7fafc; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e0 #f7fafc; }
      `}</style>
    </div>
  );
}