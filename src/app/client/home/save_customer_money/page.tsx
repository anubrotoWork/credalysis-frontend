// src/app/client/home/save_customer_money/page.tsx

"use client";
import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";
import { Loader2, AlertTriangle, Lightbulb, BarChart4 } from "lucide-react"; // Import icons

// Type for individual insight (matches backend table structure)
type Insight = {
  customer_id: string;
  insight_date: string;
  total_income: number;
  total_expenses: number;
  savings_rate: number;
  financial_health_score: number; // Assuming this might be in the data
};

// Updated type assuming backend changes to return the sample
type SaveCustomerMoneyData = {
  insights_sample_for_prompt: Insight[]; // The sample of insights sent to LLM
  total_insights_considered?: number; // Total insights before sampling (optional, but good for context)
  suggestions: string; // AI-generated suggestions
};

// Custom components for ReactMarkdown
const markdownComponents: Components = {
  table: (props) => (
    <div className="overflow-x-auto my-4 shadow rounded-lg border border-gray-200">
      <table className="min-w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-100" {...props} />,
  tbody: (props) => <tbody className="divide-y divide-gray-200" {...props} />,
  tr: (props) => <tr className="hover:bg-gray-50" {...props} />,
  th: (props) => (
    <th
      className="border-b border-gray-300 px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-gray-600"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-2"
      {...props}
    />
  ),
};

// authFetch helper
async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.append("Content-Type", "application/json");
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.clear(); // Clear all auth related for safety
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?sessionExpired=true";
      }
    }
    throw new Error("Session expired or unauthorized. Please log in again.");
  }
  return response;
}

export default function ClientSaveCustomerMoneyPage() {
  const [data, setData] = useState<SaveCustomerMoneyData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Default to 'suggestions' as it's the primary output
  const [activeTab, setActiveTab] = useState<"suggestions" | "insights_sample">(
    "suggestions"
  );

  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Authentication Check
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "client") {
      alert("You do not have permission to access this page.");
      localStorage.clear();
      router.push("/login");
      return;
    }
  }, [router]);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("Backend API URL is not configured.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await authFetch(
        `${backendApiUrl}/api/client/save_customer_money/`
      );
      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) errorDetail = errorData.detail;
        } catch (jsonError) {
          console.warn("Could not parse error response JSON:", jsonError);
        }
        throw new Error(errorDetail);
      }
      const fetchedData: SaveCustomerMoneyData = await response.json();
      // Validate that insights_sample_for_prompt is an array, even if empty
      if (!Array.isArray(fetchedData.insights_sample_for_prompt)) {
        console.warn(
          "Received non-array for insights_sample_for_prompt, defaulting to empty array."
        );
        fetchedData.insights_sample_for_prompt = [];
      }
      setData(fetchedData);
    } catch (err) {
      console.error("Failed to load 'Save Customer Money' data:", err);
      if (err instanceof Error) setError(err.message);
      else if (typeof err === "string") setError(err);
      else setError("An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [backendApiUrl]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken && backendApiUrl) fetchData();
  }, [fetchData, backendApiUrl]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "N/A";
    return amount.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    }); // Adjust currency as needed
  };

  const formatPercentage = (rate: number | undefined | null) => {
    if (rate === undefined || rate === null) return "N/A";
    return `${(rate * 100).toFixed(1)}%`; // Assuming rate is a decimal like 0.1 for 10%
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
          <p>Loading savings strategies...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow my-6"
          role="alert"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 mr-3" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    if (!data)
      return (
        <p className="text-gray-500 text-center py-10">
          No data available for savings strategies.
        </p>
      );

    if (activeTab === "insights_sample") {
      return (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Sample of Latest Customer Insights Used for Analysis
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Showing {data.insights_sample_for_prompt?.length || 0} insights)
            </span>
          </h2>
          {data.insights_sample_for_prompt &&
          data.insights_sample_for_prompt.length > 0 ? (
            <div className="overflow-x-auto max-h-[600px] shadow border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Insight Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Income
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Expenses
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Savings Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.insights_sample_for_prompt.map((insight) => (
                    <tr
                      key={insight.customer_id + insight.insight_date}
                      className="hover:bg-gray-50"
                    >
                      {" "}
                      {/* Better key */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {insight.customer_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(insight.insight_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                        {formatCurrency(insight.total_income)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                        {formatCurrency(insight.total_expenses)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                        {formatPercentage(insight.savings_rate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                        {insight.financial_health_score?.toFixed(1) || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 p-4">
              No sample insight data available to display. The AI analysis is
              based on aggregated or unavailable raw samples.
            </p>
          )}
        </div>
      );
    }

    if (activeTab === "suggestions") {
      return (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-1">
            AI-Generated Savings Suggestions
          </h2>
          {data.total_insights_considered !== undefined && (
            <div className="text-xs text-gray-500 mb-3">
              Suggestions based on a sample from{" "}
              {data.total_insights_considered} latest customer insights.
            </div>
          )}
          <div className="prose prose-sm max-w-none overflow-y-auto max-h-[70vh] bg-gray-50 p-4 rounded-md shadow-inner custom-scrollbar text-gray-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {data.suggestions || "No savings suggestions available."}
            </ReactMarkdown>
          </div>
        </div>
      );
    }
    return null;
  };

  const TabButton: React.FC<{
    label: string;
    tabName: "suggestions" | "insights_sample";
    icon: React.ElementType;
  }> = ({ label, tabName, icon: Icon }) => (
    <button
      className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
        activeTab === tabName
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
      }`}
      onClick={() => setActiveTab(tabName)}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">
          Client Strategies: Help Customers Save Money
        </h1>
      </header>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8 border-b border-gray-200 pb-4">
        <TabButton
          label="AI Savings Suggestions"
          tabName="suggestions"
          icon={Lightbulb}
        />
        <TabButton
          label="Sample Insights Used"
          tabName="insights_sample"
          icon={BarChart4}
        />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
        {renderContent()}
      </div>
      <style jsx global>{`
        /* Custom Scrollbar Styles (same as previous examples) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7c7c7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a3a3a3;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #c7c7c7 #f1f1f1;
        }
        /* Prose Styles (same as previous examples) */
        .prose ul,
        .prose ol {
          margin-left: 1.25rem;
        }
        .prose h3 {
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .prose p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
