"use client";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";

// type Trend = {
//   customer_id: string;
//   insight_date: string;
//   total_income: number;
//   total_expenses: number;
//   savings_rate: number;
//   financial_health_score: number;
// };

type TrendData = {
  data_points: number;
  trend_analysis: string;
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

export default function ClientTrendsPage() {
  const [data, setData] = useState<TrendData | null>(null);
  const [activeTab, setActiveTab] = useState<"trends" | "analysis">("trends");
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
    fetch(`${backendApiUrl}/api/client/trends/`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load trend data:", err));
  }, [backendApiUrl]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Client Financial Trends</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "trends" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("trends")}
        >
          Financial Trends
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "analysis" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("analysis")}
        >
          Trend Analysis
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === "trends" && (
          <div className="text-lg font-semibold text-gray-800">
            Total Data Points:{" "}
            <span className="text-blue-600">{data.data_points}</span>
          </div>
        )}

        {data && activeTab === "analysis" && (
          <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
            {/* <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.trend_analysis}
            </ReactMarkdown> */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {data.trend_analysis}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
