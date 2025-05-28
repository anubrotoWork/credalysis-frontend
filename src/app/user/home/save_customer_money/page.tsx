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

// Type Definitions (making fields nullable as needed)
type FinancialInsight = {
  insight_id: string;
  customer_id: string;
  insight_date: string | null;
  total_income: number | null;
  total_expenses: number | null;
  savings_rate: number | null; // e.g., 0.15 for 15%
  monthly_income: number | null;
  monthly_expenses: number | null;
  monthly_cash_flow: number | null;
  recurring_expenses: number | null;
  top_spending_categories: string | null;
  spending_insight: string | null;
  saving_insight: string | null;
  budget_insight: string | null;
  financial_health_score: number | null; // Could be 0-100 or similar
};

type SaveMoneyResponse = {
  insights: FinancialInsight | null;
  suggestions: string; // AI-generated suggestions
};

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
const formatPercent = (rate: number | null | undefined) => rate != null ? `${(rate * 100).toFixed(1)}%` : 'N/A';
const formatScore = (score: number | null | undefined) => score != null ? score.toFixed(1) : 'N/A';

// Helper component for displaying insight data items
const InsightDataItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow ${className}`}>
      <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base sm:text-lg font-semibold text-indigo-700 mt-1">{value || 'N/A'}</p>
    </div>
);


export default function SaveCustomerMoneyPage() {
  const [data, setData] = useState<SaveMoneyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"suggestions" | "insight">(
    "suggestions" // Default to AI suggestions
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

  const fetchSaveMoneyData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(
        `${backendApiUrl}/api/user/save_customer_money/`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch data" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: SaveMoneyResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch saving suggestions:", err);
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
      fetchSaveMoneyData();
    }
  }, [fetchSaveMoneyData]);

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px] p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-gray-600">Loading money-saving insights...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 p-6">
          <p className="text-red-600 font-semibold text-lg">Error:</p>
          <p className="text-gray-700 my-2">{error}</p>
          <button
            onClick={fetchSaveMoneyData}
            className="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          > Try Again </button>
        </div>
      );
    }
    if (!data || (!data.insights && !data.suggestions)) {
      return <div className="text-center py-10 text-gray-500 italic">No money-saving insights or suggestions available at this time.</div>;
    }

    switch (activeTab) {
      case "insight":
        const insights = data.insights;
        if (!insights) return <p className="text-gray-500 italic p-4">No detailed financial insight data available.</p>;
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Your Financial Snapshot</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <InsightDataItem label="Insight Date" value={formatDate(insights.insight_date)} />
                <InsightDataItem label="Total Income" value={formatCurrency(insights.total_income)} />
                <InsightDataItem label="Total Expenses" value={formatCurrency(insights.total_expenses)} />
                <InsightDataItem label="Savings Rate" value={formatPercent(insights.savings_rate)} />
                <InsightDataItem label="Monthly Income" value={formatCurrency(insights.monthly_income)} />
                <InsightDataItem label="Monthly Expenses" value={formatCurrency(insights.monthly_expenses)} />
                <InsightDataItem label="Monthly Cash Flow" value={formatCurrency(insights.monthly_cash_flow)} />
                <InsightDataItem label="Recurring Expenses" value={formatCurrency(insights.recurring_expenses)} />
                <InsightDataItem label="Financial Health Score" value={formatScore(insights.financial_health_score)} />
            </div>
            {insights.top_spending_categories &&
                <div className="mt-6 bg-white p-4 rounded-lg shadow border border-gray-200">
                    <h3 className="text-md font-semibold text-gray-700 mb-1">Top Spending Categories</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{insights.top_spending_categories}</p>
                </div>
            }
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.spending_insight && <div className="bg-blue-50 p-3 rounded-lg shadow-sm border border-blue-200"><h4 className="font-semibold text-blue-700">Spending Insight</h4><p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{insights.spending_insight}</p></div>}
                {insights.saving_insight && <div className="bg-green-50 p-3 rounded-lg shadow-sm border border-green-200"><h4 className="font-semibold text-green-700">Saving Insight</h4><p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{insights.saving_insight}</p></div>}
                {insights.budget_insight && <div className="bg-yellow-50 p-3 rounded-lg shadow-sm border border-yellow-200"><h4 className="font-semibold text-yellow-700">Budget Insight</h4><p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{insights.budget_insight}</p></div>}
            </div>
          </div>
        );
      case "suggestions":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">AI-Powered Money-Saving Suggestions</h2>
            {data.suggestions ? (
                <div className="prose max-w-none prose-sm sm:prose-base p-4 bg-gray-50 rounded-lg border custom-scrollbar">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                    >
                        {data.suggestions}
                    </ReactMarkdown>
                </div>
            ) : (
                <p className="text-gray-500 italic">No AI suggestions available at this time.</p>
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
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">Unlock Savings</h1>
         <p className="text-md text-gray-600 mt-1">
            Explore your financial insights and get AI-driven suggestions to help you save money.
        </p>
      </header>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b border-gray-300 pb-3">
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
        <button
          onClick={() => setActiveTab("insight")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "insight"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Financial Snapshot
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