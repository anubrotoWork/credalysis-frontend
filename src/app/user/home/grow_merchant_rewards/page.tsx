"use client";

import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
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


type RewardTransaction = {
  transaction_id: string;
  customer_id: string; // Assuming these are part of the backend response if needed
  merchant_id: string;  // Assuming these are part of the backend response if needed
  amount: number;
  date: string; // Consider using a more specific date type if available from backend
  category: string;
  merchant_name: string;
  primary_category: string;
};

type GrowMerchantRewardsResponse = {
  rewards: RewardTransaction[];
  analysis: string;
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

export default function GrowMerchantRewardsPage() {
  const [data, setData] = useState<GrowMerchantRewardsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "analysis">(
    "transactions"
  );
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    // Initial authentication and authorization check
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
    // If checks pass, the data fetching effect will run
  }, [router]);

  const fetchMerchantRewardsData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured. Please contact support.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Use authFetch. The email query parameter is no longer needed.
      const response = await authFetch(
        `${backendApiUrl}/api/user/grow_merchant_rewards/` // Removed email query param
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch data" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: GrowMerchantRewardsResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to load merchant rewards data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching rewards data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [backendApiUrl]);

  useEffect(() => {
    // Fetch data only if user is likely authenticated (token exists)
    // The first useEffect handles redirection if not properly authenticated/authorized.
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");

    if (authToken && userAccessLevel === "user") {
        fetchMerchantRewardsData();
    }
    // Note: The dependency on `router` from the previous snippet's second useEffect was incorrect.
    // The main auth check is in the first useEffect. This one just triggers fetch if auth seems okay.
  }, [fetchMerchantRewardsData]); // Depends on the memoized fetch function


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-6 bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Merchant Rewards...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-6 text-center bg-gray-50">
            <h2 className="text-2xl font-semibold text-red-600 mb-3">Error Fetching Rewards</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
                onClick={fetchMerchantRewardsData}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Try Again
            </button>
        </div>
    );
  }

  if (!data || data.rewards.length === 0) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-6 text-center bg-gray-50">
            <h1 className="text-3xl font-bold mb-4 text-indigo-700">Grow Merchant Rewards</h1>
            <p className="text-lg text-gray-600">No merchant reward opportunities or related transactions found at this time.</p>
             {data?.analysis && ( // Show analysis even if no rewards transactions, if analysis is present
                <div className="mt-8 w-full max-w-3xl">
                     <h2 className="text-2xl font-semibold text-indigo-600 mb-3">AI Analysis</h2>
                    <section className="prose max-w-none p-4 bg-white rounded-lg shadow-md border text-left">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {data.analysis}
                        </ReactMarkdown>
                    </section>
                </div>
            )}
        </div>
    );
  }


  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">Grow Merchant Rewards</h1>
        <p className="text-md text-gray-600 mt-1">
          Explore your transactions and get AI-powered insights to maximize rewards.
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b border-gray-300 pb-3">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "transactions"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Eligible Transactions
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "analysis"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          AI Analysis & Recommendations
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
        {activeTab === "transactions" && (
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">
              Your Reward-Related Transactions
            </h2>
            {data.rewards.length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Merchant
                      </th>
                      <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="border-b border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Merchant Primary Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.rewards.map((txn) => (
                      <tr key={txn.transaction_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {new Date(txn.date).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {txn.merchant_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                          ${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {txn.category}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {txn.primary_category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <p className="text-gray-600 italic">No specific reward-related transactions found for analysis.</p>
            )}
          </section>
        )}

        {activeTab === "analysis" && (
          <section>
             <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">
              AI Analysis & Recommendations
            </h2>
            <div className="prose max-w-none prose-sm sm:prose-base custom-scrollbar">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {data.analysis}
              </ReactMarkdown>
            </div>
          </section>
        )}
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