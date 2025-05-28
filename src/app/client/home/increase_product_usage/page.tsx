// src/app/client/home/increase_product_usage/page.tsx

"use client";
import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";
import { Loader2, AlertTriangle, Lightbulb, ShoppingBag, Users } from "lucide-react"; // Import icons

// Updated type to match backend response keys
type ProductUsageData = {
  active_products_count: number;       // Changed from active_products
  accepted_recommendations_count: number; // Changed from recommendations
  suggestions: string;
};

// Custom components for ReactMarkdown (ensure this is consistent with other pages)
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
    <th className="border-b border-gray-300 px-3 py-2 sm:px-4 sm:py-2 text-left font-semibold text-gray-600" {...props} />
  ),
  td: (props) => <td className="border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-2" {...props} />,
};

// authFetch helper (ensure this is correctly defined, possibly in a shared lib)
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('email');
      localStorage.removeItem('access');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?sessionExpired=true';
      }
    }
    throw new Error('Session expired or unauthorized. Please log in again.');
  }
  return response;
}

export default function ClientIncreaseProductUsagePage() {
  const [data, setData] = useState<ProductUsageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active_products' | 'accepted_recommendations' | 'suggestions'>('suggestions'); // Default to suggestions

  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Authentication Check
  useEffect(() => {
    const authToken = localStorage.getItem("authToken"); // Standardized auth check
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
      const response = await authFetch(`${backendApiUrl}/api/client/increase_product_usage/`);
      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorDetail = errorData.detail;
          }
        } catch (jsonError) {
          console.warn("Could not parse error response JSON:", jsonError);
        }
        throw new Error(errorDetail);
      }
      const fetchedData: ProductUsageData = await response.json();
      setData(fetchedData);
    } catch (err) { // Type-safe error handling
      console.error("Failed to load product usage data:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("An unknown error occurred while fetching product usage data.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [backendApiUrl]);

  useEffect(() => {
     const authToken = localStorage.getItem("authToken");
     if (authToken && backendApiUrl) {
        fetchData();
    }
  }, [fetchData, backendApiUrl]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
          <p>Loading product usage insights...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow my-6" role="alert">
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

    if (!data) {
      return <p className="text-gray-500 text-center py-10">No data available to display.</p>;
    }

    if (activeTab === 'active_products') {
      return (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Active Products Overview</h2>
          <div className="text-lg text-gray-800 p-4 bg-indigo-50 rounded-md">
            Total Active Products (Institution-wide):{" "}
            <span className="font-bold text-indigo-600">{data.active_products_count !== undefined ? data.active_products_count : 'N/A'}</span>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            This count represents the total number of products currently active across all customers.
          </p>
        </div>
      );
    }

    if (activeTab === 'accepted_recommendations') {
      return (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Accepted Recommendations Overview</h2>
          <div className="text-lg text-gray-800 p-4 bg-green-50 rounded-md">
            Total Accepted Product Recommendations (Institution-wide):{" "}
            <span className="font-bold text-green-600">{data.accepted_recommendations_count !== undefined ? data.accepted_recommendations_count : 'N/A'}</span>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            This count reflects how many product recommendations have been accepted by customers.
          </p>
        </div>
      );
    }

    if (activeTab === 'suggestions') {
      return (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-1">AI-Generated Suggestions for Increasing Product Usage</h2>
          <div className="text-xs text-gray-500 mb-3">
            Analysis based on a sample of active products and accepted recommendations.
          </div>
          <div className="prose prose-sm max-w-none overflow-y-auto max-h-[70vh] bg-gray-50 p-4 rounded-md shadow-inner custom-scrollbar text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {data.suggestions || "No suggestions available at this time."}
            </ReactMarkdown>
          </div>
        </div>
      );
    }
    return null;
  };

  const TabButton: React.FC<{
    label: string;
    tabName: 'active_products' | 'accepted_recommendations' | 'suggestions';
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
          Strategies to Increase Product Usage
        </h1>
      </header>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8 border-b border-gray-200 pb-4">
        <TabButton label="AI Suggestions" tabName="suggestions" icon={Lightbulb} />
        <TabButton label="Active Products Count" tabName="active_products" icon={ShoppingBag} />
        <TabButton label="Accepted Recs Count" tabName="accepted_recommendations" icon={Users} />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
        {renderContent()}
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c7c7c7; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #c7c7c7 #f1f1f1; }
        .prose ul, .prose ol { margin-left: 1.25rem; }
        .prose h3 { margin-top: 1em; margin-bottom: 0.5em; }
        .prose p:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
}