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
  customer_since: string;
};

type LifecycleData = {
  sample_data: Customer[];
  total_customers: number;
  lifecycle: string;
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

export default function LifecyclePage() {
  const [data, setData] = useState<LifecycleData | null>(null);
  const [activeTab, setActiveTab] = useState<"sample" | "total" | "lifecycle">(
    "sample"
  );
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isClient = localStorage.getItem("access") == "client";

    console.log(localStorage);
    if (!isLoggedIn) {
      router.push("/login");
    }

    if (!isClient) {
      alert("you are not client financial institution");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetch(`${backendApiUrl}/api/client/lifecycle/`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load lifecycle data:", err));
  }, [backendApiUrl]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Customer Lifecycle Analysis</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "sample" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("sample")}
        >
          Sample Customers
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "total" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("total")}
        >
          Total Customers
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "lifecycle" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("lifecycle")}
        >
          Lifecycle Strategy
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === "sample" && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 border">Customer ID</th>
                  <th className="text-left p-2 border">Age</th>
                  <th className="text-left p-2 border">Income</th>
                  <th className="text-left p-2 border">Account Open Date</th>
                </tr>
              </thead>
              <tbody>
                {data.sample_data.map((customer) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                    <td className="p-2 border">{customer.customer_id}</td>
                    <td className="p-2 border">{customer.age}</td>
                    <td className="p-2 border">{customer.income_category}</td>
                    <td className="p-2 border">{customer.customer_since}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && activeTab === "total" && (
          <div className="text-lg font-semibold text-gray-800">
            Total Customers:{" "}
            <span className="text-blue-600">{data.total_customers}</span>
          </div>
        )}

        {data && activeTab === "lifecycle" && (
          <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
            {/* <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.lifecycle}
            </ReactMarkdown> */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {data.lifecycle}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
