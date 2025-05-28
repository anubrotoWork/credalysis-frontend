"use client";

import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";

// Define authFetch here or import from a shared lib if you have one
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  // Automatically set Content-Type for JSON if not a FormData and body exists
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('email');
    localStorage.removeItem('access');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'; // Force redirect
    }
  }
  return response;
}


type Trend = {
  insight_date: string;
  total_income: number;
  total_expenses: number;
  savings_rate: number;
  financial_health_score: number;
};

type TrendsData = {
  trends: Trend[] | null;
  trend_analysis: string; // This will contain the AI-generated markdown
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
const formatPercent = (rate: number | null | undefined) => rate != null ? `${rate.toFixed(1)}%` : 'N/A'; // Assuming savings_rate is already a percentage
const formatScore = (score: number | null | undefined) => score != null ? score.toFixed(1) : 'N/A';


export default function TrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"trends" | "analysis">("trends");
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

  // Function to fetch trends data
  const fetchTrendsData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // The backend now derives email from JWT, so no need to pass it in URL
      const response = await authFetch(
        `${backendApiUrl}/api/user/trends/`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch trends data" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: TrendsData = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to load trends data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [backendApiUrl]); // router is not needed here as auth is handled by authFetch/first useEffect

  // Effect to call fetchTrendsData when component mounts and user is authenticated
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    // Ensure user is authenticated and authorized before fetching
    if (authToken && userAccessLevel === "user") {
      fetchTrendsData();
    }
    // If not authenticated/authorized, the first useEffect would have redirected.
    // If still here and conditions not met, it implies a state where redirection might be pending or an edge case.
    // Or, if user logs out on another tab, this ensures we don't try to fetch.
    else if (!authToken || userAccessLevel !== "user") {
        setLoading(false); // Stop loading if auth conditions are no longer met
    }
  }, [fetchTrendsData]); // Only depends on fetchTrendsData

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[300px] p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-gray-600">Loading financial trends...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold text-lg">Error:</p>
          <p className="text-gray-700 my-2">{error}</p>
          <button
            onClick={fetchTrendsData}
            className="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    if (!data || (!data.trends?.length && !data.trend_analysis)) {
        return <div className="text-center py-10 text-gray-500 italic">No trends data or analysis available at this time.</div>;
    }

    switch (activeTab) {
      case "trends":
        if (!data.trends || data.trends.length === 0) {
            return <p className="text-gray-500 italic p-4">No historical trend data found.</p>;
        }
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Historical Trends</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Income</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Expenses</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Savings Rate</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Financial Health Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.trends.map((trend, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(trend.insight_date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{formatCurrency(trend.total_income)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{formatCurrency(trend.total_expenses)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{formatPercent(trend.savings_rate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{formatScore(trend.financial_health_score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "analysis":
        if (!data.trend_analysis) {
            return <p className="text-gray-500 italic p-4">No AI analysis available for your trends.</p>;
        }
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">AI-Powered Trend Analysis</h2>
            <div className="prose max-w-none prose-sm sm:prose-base p-4 bg-gray-50 rounded-lg border custom-scrollbar">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents} // Using the enhanced markdown components
              >
                {data.trend_analysis}
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
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">Financial Trends & Insights</h1>
        <p className="text-md text-gray-600 mt-1">
            Review your financial journey and get AI-driven analysis of your trends.
        </p>
      </header>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b border-gray-300 pb-3">
        <button
          onClick={() => setActiveTab("trends")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "trends"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Historical Trends
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "analysis"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          AI Analysis
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl min-h-[400px]">
        {renderTabContent()}
      </div>
      <style jsx global>{`
        /* Custom scrollbar for AI analysis content if it gets long */
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f7fafc; /* Tailwind gray-100 */ border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; /* Tailwind gray-400 */ border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a0aec0; /* Tailwind gray-500 */ }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e0 #f7fafc; }
      `}</style>
    </div>
  );
}