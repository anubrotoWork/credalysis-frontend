"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown"; // For custom markdown components if needed later

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

// Type Definitions
type Customer = {
  customer_id: string;
  first_name?: string; // Optional, but good for personalization
  last_name?: string;  // Optional
  age: number | null;
  income_category: string | null;
  state: string | null;
  // Add other customer fields if returned by backend and useful for display
  annual_income?: number | null;
  employment_type?: string | null;
  credit_score?: number | null;
};

// More specific type for Financial Insights if possible,
// otherwise Record<string, unknown> is a fallback.
type FinancialInsightData = {
  monthly_cash_flow: number | null;
  savings_rate: number | null; // e.g., 0.15 for 15%
  monthly_income: number | null;
  monthly_expenses: number | null; // Renamed from 'expenses' for clarity
  recurring_expenses: number | null;
  financial_health_score: number | null; // Typically a score, e.g., 0-100 or 0-1000
  top_spending_categories: string | null; // Could be a string or string[]
  spending_insight: string | null;
  saving_insight: string | null;
  budget_insight: string | null;
  // Add any other insight fields your backend provides
};

type OverviewData = {
  customer: Customer;
  insights: FinancialInsightData | null; // Use the more specific type
  summary: string; // AI-generated summary
};

// Custom components for ReactMarkdown (if AI summary includes tables)
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
  // ... other table components if needed
};

// Helper to format currency
const formatCurrency = (amount: number | null | undefined, defaultVal: string = 'N/A') => {
    if (amount === null || amount === undefined) return defaultVal;
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to format percentage
const formatPercentage = (rate: number | null | undefined, defaultVal: string = 'N/A') => {
    if (rate === null || rate === undefined) return defaultVal;
    return `${(rate * 100).toFixed(1)}%`;
};


export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "customer" | "insights">(
    "summary" // Default to AI summary
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

  const fetchOverviewData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(
        `${backendApiUrl}/api/user/overview/` // Removed email query param
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch data" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: OverviewData = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to load overview data:", err);
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
      fetchOverviewData();
    }
  }, [fetchOverviewData]);


  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px] p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-gray-600">Loading your financial overview...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 p-6">
          <p className="text-red-600 font-semibold text-lg">Error:</p>
          <p className="text-gray-700 my-2">{error}</p>
          <button
            onClick={fetchOverviewData}
            className="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    if (!data) { // Handle case where data is null after loading (e.g. API returns empty or error not caught by fetch)
        return <div className="text-center py-10 text-gray-500 italic">No overview data available. This could be due to an issue fetching your information.</div>;
    }


    switch (activeTab) {
      case "customer":
        const customer = data.customer;
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Your Profile Information</h2>
            <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 border border-gray-200 space-y-3">
                { (customer.first_name || customer.last_name) &&
                    <p className="text-gray-700"><strong className="font-medium text-gray-600">Name:</strong> {customer.first_name} {customer.last_name}</p>
                }
                <p className="text-gray-700"><strong className="font-medium text-gray-600">Customer ID:</strong> {customer.customer_id}</p>
                <p className="text-gray-700"><strong className="font-medium text-gray-600">Age:</strong> {customer.age ?? 'N/A'}</p>
                <p className="text-gray-700"><strong className="font-medium text-gray-600">Income Category:</strong> {customer.income_category ?? 'N/A'}</p>
                {customer.annual_income && <p className="text-gray-700"><strong className="font-medium text-gray-600">Annual Income:</strong> {formatCurrency(customer.annual_income)}</p>}
                {customer.employment_type && <p className="text-gray-700"><strong className="font-medium text-gray-600">Employment:</strong> {customer.employment_type}</p>}
                <p className="text-gray-700"><strong className="font-medium text-gray-600">State:</strong> {customer.state ?? 'N/A'}</p>
                {customer.credit_score && <p className="text-gray-700"><strong className="font-medium text-gray-600">Credit Score:</strong> {customer.credit_score}</p>}
            </div>
          </div>
        );
      case "insights":
        const insights = data.insights;
        if (!insights) return <div className="text-center py-10 text-gray-500 italic">No detailed financial insights available at this moment.</div>;

        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Key Financial Insights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Key Metrics Cards */}
              {[
                { label: "Monthly Cash Flow", value: formatCurrency(insights.monthly_cash_flow), desc: "Income after expenses each month." },
                { label: "Savings Rate", value: formatPercentage(insights.savings_rate), desc: "Percentage of income saved." },
                { label: "Monthly Income", value: formatCurrency(insights.monthly_income), desc: "Your total income per month." },
                { label: "Monthly Expenses", value: formatCurrency(insights.monthly_expenses), desc: "Your total expenses per month." },
                { label: "Recurring Expenses", value: formatCurrency(insights.recurring_expenses), desc: "Regular, predictable monthly costs." },
                { label: "Financial Health Score", value: insights.financial_health_score?.toString() ?? 'N/A', desc: "Overall financial well-being indicator." },
              ].map(item => (
                <div key={item.label} className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow">
                  <h3 className="text-sm font-medium text-gray-500">{item.label}</h3>
                  <p className="text-xl sm:text-2xl font-semibold text-indigo-700 mt-1">{item.value}</p>
                  <p className="text-xs text-gray-500 mt-2">{item.desc}</p>
                </div>
              ))}
            </div>

            {insights.top_spending_categories && (
              <div className="mt-6 bg-white shadow-lg rounded-lg p-4 border border-gray-200">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Top Spending Categories</h3>
                <p className="text-gray-600 whitespace-pre-line">{insights.top_spending_categories}</p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {insights.spending_insight && <InsightCard title="Spending Insight" content={insights.spending_insight} color="blue" />}
              {insights.saving_insight && <InsightCard title="Saving Insight" content={insights.saving_insight} color="green" />}
              {insights.budget_insight && <InsightCard title="Budget Insight" content={insights.budget_insight} color="yellow" />}
            </div>
          </div>
        );
      case "summary":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">AI Financial Summary</h2>
            {data.summary ? (
                 <div className="prose max-w-none prose-sm sm:prose-base p-4 bg-gray-50 rounded-lg border custom-scrollbar">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents} // Apply custom table styling if summary includes tables
                    >
                        {data.summary}
                    </ReactMarkdown>
                </div>
            ) : (
                <p className="text-gray-500 italic">No AI summary available at this time.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  // Helper component for insight cards
  const InsightCard = ({ title, content, color }: { title: string, content: string, color: 'blue' | 'green' | 'yellow' }) => {
    const colors = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    };
    return (
        <div className={`${colors[color].bg} p-4 rounded-lg shadow-md border ${colors[color].border}`}>
            <h4 className={`font-semibold ${colors[color].text} mb-1`}>{title}</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{content}</p>
        </div>
    );
};

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">Your Financial Overview</h1>
        <p className="text-md text-gray-600 mt-1">
            A snapshot of your financial profile, key insights, and an AI-powered summary.
        </p>
      </header>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b border-gray-300 pb-3">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "summary"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          AI Summary
        </button>
        <button
          onClick={() => setActiveTab("customer")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "customer"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          My Profile
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "insights"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Key Insights
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