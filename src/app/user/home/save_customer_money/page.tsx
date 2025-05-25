"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type FinancialInsight = {
  insight_id: string;
  customer_id: string;
  insight_date: string;
  total_income: number;
  total_expenses: number;
  savings_rate: number;
  monthly_income: number;
  monthly_expenses: number;
  monthly_cash_flow: number;
  recurring_expenses: number;
  top_spending_categories: string;
  spending_insight: string;
  saving_insight: string;
  budget_insight: string;
  financial_health_score: number;
};

type SaveMoneyResponse = {
  insights: FinancialInsight | null;
  suggestions: string;
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

export default function SaveCustomerMoneyPage() {
  const [data, setData] = useState<SaveMoneyResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"insight" | "suggestions">(
    "insight"
  );
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isUser = localStorage.getItem("access") === "user";
    const email = localStorage.getItem("email");

    if (!isLoggedIn || !isUser || !email) {
      router.push("/login");
      return;
    }

    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/save_customer_money/?email=${email}`
    )
      .then((res) => res.json())
      .then(setData)
      .catch((err) =>
        console.error("Failed to fetch saving suggestions:", err)
      );
  }, [router]);

  if (!data) return <p className="p-6">Loading saving suggestions...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Save Customer Money</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("insight")}
          className={`px-4 py-2 font-medium ${
            activeTab === "insight"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Insight
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`px-4 py-2 font-medium ${
            activeTab === "suggestions"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          AI Suggestions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "insight" && (
        <section>
          {data.insights ? (
            <div className="space-y-2">
              <p>
                <strong>Date:</strong>{" "}
                {new Date(data.insights.insight_date).toLocaleDateString()}
              </p>
              <p>
                <strong>Total Income:</strong> $
                {data.insights.total_income.toFixed(2)}
              </p>
              <p>
                <strong>Total Expenses:</strong> $
                {data.insights.total_expenses.toFixed(2)}
              </p>
              <p>
                <strong>Savings Rate:</strong>{" "}
                {data.insights.savings_rate * 100}%
              </p>
              <p>
                <strong>Monthly Income:</strong> $
                {data.insights.monthly_income.toFixed(2)}
              </p>
              <p>
                <strong>Monthly Expenses:</strong> $
                {data.insights.monthly_expenses.toFixed(2)}
              </p>
              <p>
                <strong>Monthly Cash Flow:</strong> $
                {data.insights.monthly_cash_flow.toFixed(2)}
              </p>
              <p>
                <strong>Recurring Expenses:</strong> $
                {data.insights.recurring_expenses.toFixed(2)}
              </p>
              <p>
                <strong>Top Spending Categories:</strong>{" "}
                {data.insights.top_spending_categories}
              </p>
              <p>
                <strong>Spending Insight:</strong>{" "}
                {data.insights.spending_insight}
              </p>
              <p>
                <strong>Saving Insight:</strong> {data.insights.saving_insight}
              </p>
              <p>
                <strong>Budget Insight:</strong> {data.insights.budget_insight}
              </p>
              <p>
                <strong>Financial Health Score:</strong>{" "}
                {data.insights.financial_health_score}
              </p>
            </div>
          ) : (
            <p>No financial insight found.</p>
          )}
        </section>
      )}

      {activeTab === "suggestions" && (
        <section className="prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {data.suggestions}
          </ReactMarkdown>
        </section>
      )}
    </div>
  );
}
