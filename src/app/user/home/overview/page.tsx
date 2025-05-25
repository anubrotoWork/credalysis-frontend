"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";

type Customer = {
  customer_id: string;
  age: number;
  income_category: string;
  state: string;
};

type Insight = Record<string, unknown>;

type OverviewData = {
  customer: Customer;
  insights: Insight | null;
  summary: string;
};

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "customer" | "insights" | "summary"
  >("customer");
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isUser = localStorage.getItem("access") === "user";
    const email = localStorage.getItem("email");

    if (!isLoggedIn || !isUser || !email) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/overview/?email=${email}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load overview:", err));
  }, [router]);

  const renderTabContent = () => {
    if (!data) return <p>Loading...</p>;

    switch (activeTab) {
      case "customer":
        return (
          <div className="text-gray-700 space-y-1">
            <p>
              <strong>Customer ID:</strong> {data.customer.customer_id}
            </p>
            <p>
              <strong>Age:</strong> {data.customer.age}
            </p>
            <p>
              <strong>Income:</strong> {data.customer.income_category}
            </p>
            <p>
              <strong>State:</strong> {data.customer.state}
            </p>
          </div>
        );
      case "insights":
        const insights = data.insights;
        if (!insights) return <p>No insights available.</p>;

        return (
          <div className="space-y-4 text-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white shadow p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">
                  Monthly Cash Flow
                </h3>
                <p className="text-lg font-semibold">
                  {typeof insights.monthly_cash_flow === "number"
                    ? `$${insights.monthly_cash_flow.toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white shadow p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">
                  Savings Rate
                </h3>
                <p className="text-lg font-semibold">
                  {typeof insights.savings_rate === "number"
                    ? `${(insights.savings_rate * 100).toFixed(1)}%`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white shadow p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">
                  Monthly Income
                </h3>
                <p className="text-lg font-semibold">
                  {typeof insights.monthly_income === "number"
                    ? `$${insights.monthly_income.toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white shadow p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">
                  Monthly Expenses
                </h3>
                <p className="text-lg font-semibold">
                  {typeof insights.expenses === "number"
                    ? `$${insights.expenses.toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white shadow p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">
                  Recurring Expenses
                </h3>
                <p className="text-lg font-semibold">
                  {typeof insights.recurring_expenses === "number"
                    ? `$${insights.recurring_expenses.toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
              <div className="bg-white shadow p-4 rounded">
                <h3 className="text-sm font-medium text-gray-500">
                  Financial Health Score
                </h3>
                <p className="text-lg font-semibold">
                  {typeof insights.financial_health_score === "number"
                    ? `$${insights.financial_health_score.toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="bg-white shadow p-4 rounded">
              <h3 className="text-sm font-medium text-gray-500">
                Top Spending Categories
              </h3>
              <p className="text-base">
                {typeof insights.top_spending_categories === "string"
                  ? insights.top_spending_categories
                  : "N/A"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-semibold text-blue-700">
                  Spending Insight
                </h4>
                <p>
                  {typeof insights.spending_insight === "string"
                    ? insights.spending_insight
                    : "N/A"}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <h4 className="font-semibold text-green-700">Saving Insight</h4>
                <p>
                  {typeof insights.saving_insight === "string"
                    ? insights.saving_insight
                    : "N/A"}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <h4 className="font-semibold text-yellow-700">
                  Budget Insight
                </h4>
                <p>
                  {typeof insights.budget_insight === "string"
                    ? insights.budget_insight
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        );
      case "summary":
        return (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.summary}
            </ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Customer Overview</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("customer")}
          className={`pb-2 px-4 border-b-2 ${
            activeTab === "customer"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600"
          }`}
        >
          Customer Info
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`pb-2 px-4 border-b-2 ${
            activeTab === "insights"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600"
          }`}
        >
          Insights
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-2 px-4 border-b-2 ${
            activeTab === "summary"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600"
          }`}
        >
          AI Summary
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
}
