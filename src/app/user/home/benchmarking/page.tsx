"use client";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";

type Customer = {
  customer_id: string;
  age: number;
  income_category: string;
  state: string;
};

type BenchmarkingData = {
  customer: Customer;
  peer_count: number;
  benchmarking: string;
};

// Custom components for ReactMarkdown to enhance table styling
const markdownComponents: Components = {
  // Fixed: Properly handle parameters without using _node
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
  const [activeTab, setActiveTab] = useState<
    "customer" | "peers" | "benchmarking"
  >("customer");
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isUser = localStorage.getItem("access") === "user";

    if (!isLoggedIn) {
      router.push("/login");
    }

    if (!isUser) {
      alert("You are not authorized as a user.");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;

    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/benchmarking/?email=${email}`
    )
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load benchmarking data:", err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Financial Benchmarking</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "customer" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("customer")}
        >
          Your Profile
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "peers" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("peers")}
        >
          Peer Count
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "benchmarking"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("benchmarking")}
        >
          Benchmarking Insights
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === "customer" && (
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 border">Customer ID</th>
                  <th className="text-left p-2 border">Age</th>
                  <th className="text-left p-2 border">Income Category</th>
                  <th className="text-left p-2 border">State</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="p-2 border">{data.customer.customer_id}</td>
                  <td className="p-2 border">{data.customer.age}</td>
                  <td className="p-2 border">
                    {data.customer.income_category}
                  </td>
                  <td className="p-2 border">{data.customer.state}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {data && activeTab === "peers" && (
          <div className="text-lg font-semibold text-gray-800">
            Matching Peers:{" "}
            <span className="text-blue-600">{data.peer_count}</span>
          </div>
        )}

        {data && activeTab === "benchmarking" && (
          <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {data.benchmarking}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
