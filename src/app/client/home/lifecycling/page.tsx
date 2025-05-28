// src/app/client/home/lifecycle/page.tsx

"use client";
import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";
import { Loader2, AlertTriangle, Users, ListChecks, BarChart3 } from "lucide-react"; // Import icons

// Customer type for the sample data
type Customer = {
  customer_id: string;
  age: number;
  income_category: string;
  customer_since: string; // Assuming this is a date string
};

// Updated type to match backend response keys
type LifecycleData = {
  sample_data_for_prompt: Customer[]; // Changed from sample_data
  total_customers: number;
  lifecycle_analysis: string;       // Changed from lifecycle
};

// Custom components for ReactMarkdown (already good)
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

export default function ClientLifecyclePage() {
  const [data, setData] = useState<LifecycleData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "sample_data" | "total_stats">("analysis"); // Default to analysis

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
      const response = await authFetch(`${backendApiUrl}/api/client/lifecycle/`);
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
      const fetchedData: LifecycleData = await response.json();
      setData(fetchedData);
    } catch (err) { // Type-safe error handling
      console.error("Failed to load lifecycle data:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("An unknown error occurred while fetching lifecycle data.");
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch {
        return dateString; // Fallback if date is invalid
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
          <p>Loading customer lifecycle analysis...</p>
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
      return <p className="text-gray-500 text-center py-10">No lifecycle data available to display.</p>;
    }

    if (activeTab === 'sample_data') {
      return (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Customer Data Sample for AI Analysis
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Showing {data.sample_data_for_prompt?.length || 0} customers)
            </span>
          </h2>
          {data.sample_data_for_prompt && data.sample_data_for_prompt.length > 0 ? (
            <div className="overflow-x-auto max-h-[600px] shadow border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Since</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.sample_data_for_prompt.map((customer) => (
                    <tr key={customer.customer_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{customer.customer_id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{customer.age}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{customer.income_category}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(customer.customer_since)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No sample customer data to display.</p>
          )}
        </div>
      );
    }

    if (activeTab === 'total_stats') {
      return (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Overall Customer Base Size</h2>
          <div className="text-lg text-gray-800 p-4 bg-indigo-50 rounded-md">
            Total Customers in Database: <span className="font-bold text-indigo-600">{data.total_customers}</span>
          </div>
            <p className="mt-4 text-sm text-gray-600">
            The AI analysis for lifecycle stages is based on a sample of these customers.
          </p>
        </div>
      );
    }

    if (activeTab === 'analysis') {
      return (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-1">AI Customer Lifecycle Analysis</h2>
           <div className="text-xs text-gray-500 mb-3">
            Analysis based on a sample of {data.sample_data_for_prompt?.length || 0} from {data.total_customers} total customers.
          </div>
          <div className="prose prose-sm max-w-none overflow-y-auto max-h-[70vh] bg-gray-50 p-4 rounded-md shadow-inner custom-scrollbar text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {data.lifecycle_analysis || "No lifecycle analysis available."}
            </ReactMarkdown>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const TabButton: React.FC<{
    label: string;
    tabName: "analysis" | "sample_data" | "total_stats";
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
          Customer Lifecycle Analysis & Strategy
        </h1>
      </header>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8 border-b border-gray-200 pb-4">
        <TabButton label="Lifecycle AI Analysis" tabName="analysis" icon={ListChecks} />
        <TabButton label="Sample Data Used" tabName="sample_data" icon={BarChart3} />
        <TabButton label="Total Customer Base" tabName="total_stats" icon={Users} />
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