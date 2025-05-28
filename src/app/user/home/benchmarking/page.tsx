"use client";
import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";

// Define authFetch here or import from a shared lib
// It's better to have this in a shared file (e.g., src/lib/authFetch.ts)
async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  // No need to set Content-Type for GET requests typically
  // if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
  //   headers.append('Content-Type', 'application/json');
  // }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("email");
    localStorage.removeItem("access");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login"; // Or use router.push('/login')
    }
  }
  return response;
}

type Customer = {
  customer_id: string;
  age: number;
  income_category: string;
  state: string;
  // Add any other fields returned by the backend for the customer object
};

type BenchmarkingData = {
  customer: Customer;
  peer_count: number;
  benchmarking: string;
};

const markdownComponents: Components = {
  table: (props) => (
    <div className="overflow-x-auto my-4">
      <table
        className="min-w-full border-collapse border border-gray-300 text-sm"
        {...props}
      />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-100" {...props} />,
  tbody: (props) => <tbody className="divide-y divide-gray-200" {...props} />,
  tr: (props) => <tr className="hover:bg-gray-50" {...props} />,
  th: (props) => (
    <th
      className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700"
      {...props}
    />
  ),
  td: (props) => <td className="border border-gray-300 px-4 py-2" {...props} />,
};

export default function BenchmarkingPage() {
  const [data, setData] = useState<BenchmarkingData | null>(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState<string | null>(null); // Added error state
  const [activeTab, setActiveTab] = useState<
    "customer" | "peers" | "benchmarking"
  >("customer");
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

  const fetchBenchmarkingData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Use authFetch. The email query parameter is no longer needed.
      const response = await authFetch(
        `${backendApiUrl}/api/user/benchmarking/` // Removed email query param
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to fetch data" }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }
      const result: BenchmarkingData = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to load benchmarking data:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [backendApiUrl]); // Removed email from dependencies

  useEffect(() => {
    // No longer need to get email from localStorage for the fetch call.
    // The auth token is handled by authFetch.
    // We just need to ensure the user is logged in (which the first useEffect does).
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");

    if (authToken) {
      // Fetch data only if authenticated
      fetchBenchmarkingData();
    }

    if (userAccessLevel !== "user") {
      alert("You do not have permission to access this page.");
      router.push("/login");
      return;
    }
  }, [router, fetchBenchmarkingData]); // Dependency is the memoized fetch function

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">
        Your Financial Benchmarking
      </h1>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b pb-4">
        <button
          className={`px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md font-medium transition-colors ${
            activeTab === "customer"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("customer")}
        >
          Your Profile
        </button>
        <button
          className={`px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md font-medium transition-colors ${
            activeTab === "peers"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("peers")}
        >
          Peer Comparison
        </button>
        <button
          className={`px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md font-medium transition-colors ${
            activeTab === "benchmarking"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("benchmarking")}
        >
          Benchmarking Insights
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl min-h-[300px]">
        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-gray-600">Loading benchmarking data...</p>
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-red-600 font-semibold">Error:</p>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={fetchBenchmarkingData}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && !data && (
          <div className="text-center py-10 text-gray-500">
            No benchmarking data available.
          </div>
        )}

        {!loading && !error && data && (
          <>
            {activeTab === "customer" && (
              <div>
                <h2 className="text-xl font-semibold text-indigo-700 mb-3">
                  Your Profile Summary
                </h2>
                <div className="overflow-x-auto mb-6 bg-gray-50 p-4 rounded-md border">
                  <table className="min-w-full">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 font-medium text-gray-600">
                          Customer ID
                        </td>
                        <td className="py-2 px-3 text-gray-800">
                          {data.customer.customer_id}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 font-medium text-gray-600">
                          Age
                        </td>
                        <td className="py-2 px-3 text-gray-800">
                          {data.customer.age}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 font-medium text-gray-600">
                          Income Category
                        </td>
                        <td className="py-2 px-3 text-gray-800">
                          {data.customer.income_category}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-gray-600">
                          State
                        </td>
                        <td className="py-2 px-3 text-gray-800">
                          {data.customer.state}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "peers" && (
              <div>
                <h2 className="text-xl font-semibold text-indigo-700 mb-3">
                  Peer Group Size
                </h2>
                <div className="text-lg font-semibold text-gray-800 p-4 bg-gray-50 rounded-md border">
                  Number of Matching Peers:{" "}
                  <span className="text-indigo-600 font-bold">
                    {data.peer_count}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    This is the count of customers similar to you based on age
                    (±5 years), income category, and state.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "benchmarking" && (
              <div>
                <h2 className="text-xl font-semibold text-indigo-700 mb-3">
                  Detailed Benchmarking Insights
                </h2>
                <div className="prose max-w-none overflow-y-auto max-h-[600px] p-4 bg-gray-50 rounded-md border custom-scrollbar">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {data.benchmarking}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f0f0f0; /* Light gray track */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c0c0c0; /* Medium gray thumb */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0a0a0; /* Darker gray thumb on hover */
        }
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #c0c0c0 #f0f0f0;
        }
      `}</style>
    </div>
  );
}
