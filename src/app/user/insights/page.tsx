'use client';

import { useEffect, useState } from "react";

type InsightResponse = {
  email: string;
  analysis: string;
};

const formatTextToHTML = (text: string) => {
  if (!text) return '';
  
  let formattedText = text;

  // Handle bold text (i.e., text wrapped in `**`)
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Handle unordered lists (i.e., lines that start with "*")
  formattedText = formattedText.replace(/^\* (.*?)$/gm, '<li>$1</li>');

  // Wrap list items in <ul> (only if there are list items)
  formattedText = formattedText.replace(/(<li>.*?<\/li>)/g, '<ul class="list-nested-1">$1</ul>');

  // Handle headers (e.g., text that starts with numbers followed by a dot)
  formattedText = formattedText.replace(/^(\d+\.)(.*?)$/gm, (match, p1, p2) => {
    return `<h3 class="text-lg font-semibold">${p2.trim()}</h3>`;
  });

  // Wrap paragraphs
  formattedText = formattedText.replace(/\n\n/g, '</p><p class="mb-4">');
  formattedText = `<p class="mb-4">${formattedText}</p>`;

  return formattedText;
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

  const backendApiUrl = "http://34.9.145.33:8000";

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
      const res = await fetch(`${backendApiUrl}/users/insights/agent/${endpointMap[type]}/${email}`);
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
                <div
                  className="mt-4 whitespace-pre-wrap text-sm text-gray-200"
                  dangerouslySetInnerHTML={{ __html: formatTextToHTML(insights.spending) }}
                />
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
                <div
                  className="mt-4 whitespace-pre-wrap text-sm text-gray-200"
                  dangerouslySetInnerHTML={{ __html: formatTextToHTML(insights.savings) }}
                />
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
                <div
                  className="mt-4 whitespace-pre-wrap text-sm text-gray-200"
                  dangerouslySetInnerHTML={{ __html: formatTextToHTML(insights.budget) }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
