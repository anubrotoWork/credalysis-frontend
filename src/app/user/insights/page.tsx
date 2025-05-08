'use client';

import { useEffect, useState } from "react";

type InsightResponse = {
  email: string;
  analysis: string;
};

export default function InsightsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"spending" | "savings" | "budget">("spending");
  const [insights, setInsights] = useState<Record<string, string>>({
    spending: "",
    savings: "",
    budget: "",
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    spending: false,
    savings: false,
    budget: false,
  });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (!storedEmail) {
      setError("No user email found in localStorage.");
      return;
    }
    setEmail(storedEmail);
  }, []);

  const fetchInsight = async (type: "spending" | "savings" | "budget") => {
    if (!email) return;

    const endpointMap = {
      spending: "spending-optimizer",
      savings: "savings-strategy",
      budget: "budget-health",
    };

    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await fetch(`http://34.55.216.204:8000/users/insights/agent/${endpointMap[type]}/${email}`);
      const data: InsightResponse = await res.json();
      setInsights(prev => ({ ...prev, [type]: data.analysis }));
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch ${type} insight.`);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-gray-700 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">AI Financial Insights</h2>

          <div className="flex space-x-2 mb-4">
            <button
              className={`px-3 py-2 rounded text-sm font-medium ${activeTab === 'spending' ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-200'}`}
              onClick={() => setActiveTab('spending')}
            >
              Spending Optimizer
            </button>
            <button
              className={`px-3 py-2 rounded text-sm font-medium ${activeTab === 'savings' ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-200'}`}
              onClick={() => setActiveTab('savings')}
            >
              Savings Strategy
            </button>
            <button
              className={`px-3 py-2 rounded text-sm font-medium ${activeTab === 'budget' ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-200'}`}
              onClick={() => setActiveTab('budget')}
            >
              Budget Health
            </button>
          </div>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          {activeTab === 'spending' && (
            <div>
              <button
                onClick={() => fetchInsight("spending")}
                disabled={loading.spending || !email}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading.spending ? "Loading..." : "Run Spending Analysis"}
              </button>
              {insights.spending && (
                <div className="mt-4 whitespace-pre-wrap text-sm text-gray-200">{insights.spending}</div>
              )}
            </div>
          )}

          {activeTab === 'savings' && (
            <div>
              <button
                onClick={() => fetchInsight("savings")}
                disabled={loading.savings || !email}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading.savings ? "Loading..." : "Run Savings Strategy"}
              </button>
              {insights.savings && (
                <div className="mt-4 whitespace-pre-wrap text-sm text-gray-200">{insights.savings}</div>
              )}
            </div>
          )}

          {activeTab === 'budget' && (
            <div>
              <button
                onClick={() => fetchInsight("budget")}
                disabled={loading.budget || !email}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading.budget ? "Loading..." : "Run Budget Health Review"}
              </button>
              {insights.budget && (
                <div className="mt-4 whitespace-pre-wrap text-sm text-gray-200">{insights.budget}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
