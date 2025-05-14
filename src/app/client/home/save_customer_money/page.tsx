"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Insight = {
  customer_id: string;
  insight_date: string;
  total_income: number;
  total_expenses: number;
  savings_rate: number;
  financial_health_score: number;
};

type SaveCustomerMoneyData = {
  insights_sample: Insight[];
  suggestions: string;
};

export default function SaveCustomerMoneyPage() {
  const [data, setData] = useState<SaveCustomerMoneyData | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "suggestions">(
    "insights"
  );
  
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
    fetch("http://34.9.145.33:8000/api/client/save_customer_money/")
      .then((res) => res.json())
      .then(setData)
      .catch((err) =>
        console.error("Failed to load save customer money data:", err)
      );
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Save Customer Money Strategies
      </h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "insights" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("insights")}
        >
          Top 5 Insights
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "suggestions"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("suggestions")}
        >
          Suggestions
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === "insights" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Top 5 Insights</h2>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2 border">Customer ID</th>
                    <th className="text-left p-2 border">Insight Date</th>
                    <th className="text-left p-2 border">Income</th>
                    <th className="text-left p-2 border">Expenses</th>
                    <th className="text-left p-2 border">Savings Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.insights_sample.map((insight) => (
                    <tr key={insight.customer_id} className="hover:bg-gray-50">
                      <td className="p-2 border">{insight.customer_id}</td>
                      <td className="p-2 border">{insight.insight_date}</td>
                      <td className="p-2 border">{insight.total_income}</td>
                      <td className="p-2 border">{insight.total_expenses}</td>
                      <td className="p-2 border">{insight.savings_rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && activeTab === "suggestions" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Suggestions</h2>
            <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.suggestions}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
