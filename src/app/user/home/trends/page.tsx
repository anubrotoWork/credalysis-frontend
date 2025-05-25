"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";

type Trend = {
  insight_date: string;
  total_income: number;
  total_expenses: number;
  savings_rate: number;
  financial_health_score: number;
};

type TrendsData = {
  trends: Trend[] | null;
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

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [activeTab, setActiveTab] = useState<"trends" | "analysis">("trends");
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isUser = localStorage.getItem("access") === "user";
    const email = localStorage.getItem("email");

    if (!isLoggedIn || !isUser || !email) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/trends/?email=${email}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load trends data:", err));
  }, [router]);

  const renderTabContent = () => {
    if (!data) return <p>Loading...</p>;

    switch (activeTab) {
      case "trends":
        return (
          <div>
            <h2 className="text-xl font-semibold">Trends Data</h2>
            <table className="min-w-full border-collapse mt-4">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Income</th>
                  <th className="border px-4 py-2">Expenses</th>
                  <th className="border px-4 py-2">Savings Rate</th>
                  <th className="border px-4 py-2">Financial Health Score</th>
                </tr>
              </thead>
              <tbody>
                {data.trends?.map((trend, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{trend.insight_date}</td>
                    <td className="border px-4 py-2">${trend.total_income}</td>
                    <td className="border px-4 py-2">
                      ${trend.total_expenses}
                    </td>
                    <td className="border px-4 py-2">{trend.savings_rate}%</td>
                    <td className="border px-4 py-2">
                      {trend.financial_health_score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "analysis":
        return (
          <div className="prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {data.trend_analysis}
            </ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Trends and Financial Insights</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("trends")}
          className={`pb-2 px-4 border-b-2 ${
            activeTab === "trends"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600"
          }`}
        >
          Trends Data
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`pb-2 px-4 border-b-2 ${
            activeTab === "analysis"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600"
          }`}
        >
          AI Analysis
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
}
