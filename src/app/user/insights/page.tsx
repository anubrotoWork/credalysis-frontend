"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
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


type InsightResponse = {
  email: string; // Though not directly used in display, good for typing response
  analysis: string;
};

type InsightType = "spending" | "savings" | "budget";

// Custom components for ReactMarkdown (optional, but good for consistency if AI generates tables)
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
  // You can add more custom renderers for h1, h2, p, ul, li, etc. if needed
};


export default function InsightsPage() {
  // No longer need to store email from localStorage in component state for API calls
  // const [email, setEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InsightType>("spending");
  const [insights, setInsights] = useState<Record<InsightType, string>>({
    spending: "",
    savings: "",
    budget: "",
  });
  const [loading, setLoading] = useState<Record<InsightType, boolean>>({
    spending: false,
    savings: false,
    budget: false,
  });
  const [error, setError] = useState<Record<InsightType, string | null>>({
    spending: null,
    savings: null,
    budget: null,
  });

  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    // const storedEmail = localStorage.getItem("email"); // Not needed for API calls anymore

    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "user") {
      alert("You do not have permission to access this page.");
      router.push("/login");
      return;
    }
    // setEmail(storedEmail); // No longer setting email state here
  }, [router]);

  const fetchInsight = useCallback(async (type: InsightType) => {
    if (!backendApiUrl) {
      setError(prev => ({ ...prev, [type]: "API URL is not configured." }));
      return;
    }

    const endpointMap: Record<InsightType, string> = {
      spending: "spending-optimizer",
      savings: "savings-strategy",
      budget: "budget-health",
    };

    setLoading((prev) => ({ ...prev, [type]: true }));
    setError((prev) => ({ ...prev, [type]: null })); // Clear previous error for this tab
    setInsights((prev) => ({ ...prev, [type]: "" })); // Clear previous insight for this tab

    try {
      // Backend now derives email from JWT, so remove {email} from URL path
      const res = await authFetch(
        `${backendApiUrl}/users/insights/agent/${endpointMap[type]}/`
      );
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: `Failed to fetch ${type} insight. Server returned non-JSON error.` }));
        throw new Error(
          errorData.detail ||
            `Failed to fetch ${type} insight. Status: ${res.status}`
        );
      }
      const data: InsightResponse = await res.json();
      setInsights((prev) => ({ ...prev, [type]: data.analysis }));
    } catch (err) {
      console.error(`Error fetching ${type} insight:`, err);
      const errorMessage = err instanceof Error ? err.message : `An unknown error occurred while fetching ${type} insight.`;
      setError((prev) => ({ ...prev, [type]: errorMessage }));
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  }, [backendApiUrl]); // Removed email from dependencies

  const renderInsightContent = (type: InsightType) => {
    const currentError = error[type];
    const currentLoading = loading[type];
    const currentInsight = insights[type];

    return (
      <div className="mt-6">
        <button
          onClick={() => fetchInsight(type)}
          disabled={currentLoading}
          className="mb-4 w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-md hover:bg-indigo-700 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {currentLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : `Get ${type.charAt(0).toUpperCase() + type.slice(1)} Insights`}
        </button>

        {currentError && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-300 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{currentError}</p>
          </div>
        )}

        {currentInsight && !currentLoading && !currentError && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 prose max-w-none prose-sm sm:prose-base custom-scrollbar">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {currentInsight}
            </ReactMarkdown>
          </div>
        )}
         {!currentInsight && !currentLoading && !currentError && (
           <div className="mt-4 p-6 text-center text-gray-500 italic bg-gray-50 border rounded-lg">
                Click the button above to generate your {type} insights.
            </div>
         )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
          <header className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">
              AI Financial Advisor
            </h1>
            <p className="text-md text-gray-600 mt-1">
                Get personalized insights to optimize your finances.
            </p>
          </header>

          <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-gray-300 pb-4">
            {(["spending", "savings", "budget"] as InsightType[]).map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2.5 sm:px-6 font-semibold rounded-md transition-colors duration-150 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "spending" && "Spending Optimizer"}
                {tab === "savings" && "Savings Strategy"}
                {tab === "budget" && "Budget Health"}
              </button>
            ))}
          </div>

          {renderInsightContent(activeTab)}

        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; /* Tailwind gray-50 */ border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; /* Tailwind gray-300 */ border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; /* Tailwind gray-400 */ }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db #f9fafb; }
      `}</style>
    </div>
  );
}