"use client";

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
  const [activeTab, setActiveTab] = useState<"spending" | "savings" | "budget">(
    "spending"
  );
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
      setError("No user email found in localStorage. Please login again.");
      return;
    }
    setEmail(storedEmail);
  }, []);

  const fetchInsight = async (type: "spending" | "savings" | "budget") => {
    if (!email) {
      setError("Email not available. Cannot fetch insights.");
      return;
    }

    const endpointMap = {
      spending: "spending-optimizer",
      savings: "savings-strategy",
      budget: "budget-health",
    };

    setLoading((prev) => ({ ...prev, [type]: true }));
    setError(""); // Clear previous errors
    try {
      const res = await fetch(
        `${backendApiUrl}/users/insights/agent/${endpointMap[type]}/${email}`
      );
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: "Unknown error occurred" }));
        throw new Error(
          errorData.detail ||
            `Failed to fetch ${type} insight. Status: ${res.status}`
        );
      }
      const data: InsightResponse = await res.json();
      setInsights((prev) => ({ ...prev, [type]: data.analysis }));
    } catch (err) {
      // err is implicitly 'unknown' or you can type it: catch (err: unknown)
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || `Failed to fetch ${type} insight.`);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError(`An unknown error occurred while fetching ${type} insight.`);
      }
      setInsights((prev) => ({ ...prev, [type]: "" }));
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-700 text-center">
            AI Financial Insights
          </h2>

          <div className="flex space-x-2 mb-4 border-b border-gray-200 pb-3">
            <button
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "spending"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50"
              }`}
              onClick={() => setActiveTab("spending")}
            >
              Spending Optimizer
            </button>
            <button
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "savings"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50"
              }`}
              onClick={() => setActiveTab("savings")}
            >
              Savings Strategy
            </button>
            <button
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "budget"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50"
              }`}
              onClick={() => setActiveTab("budget")}
            >
              Budget Health
            </button>
          </div>

          {error && (
            <p className="text-red-600 mb-4 p-3 bg-red-50 border border-red-300 rounded-md">
              {error}
            </p>
          )}

          {activeTab === "spending" && (
            <div>
              <button
                onClick={() => fetchInsight("spending")}
                disabled={loading.spending || !email}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {loading.spending ? "Loading..." : "Run Spending Analysis"}
              </button>
              {insights.spending && !loading.spending && (
                <div
                  className="mt-4 prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: formatTextToHTML(insights.spending),
                  }}
                />
              )}
            </div>
          )}

          {activeTab === "savings" && (
            <div>
              <button
                onClick={() => fetchInsight("savings")}
                disabled={loading.savings || !email}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {loading.savings ? "Loading..." : "Run Savings Strategy"}
              </button>
              {insights.savings && !loading.savings && (
                <div
                  className="mt-4 prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: formatTextToHTML(insights.savings),
                  }}
                />
              )}
            </div>
          )}

          {activeTab === "budget" && (
            <div>
              <button
                onClick={() => fetchInsight("budget")}
                disabled={loading.budget || !email}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {loading.budget ? "Loading..." : "Run Budget Health Review"}
              </button>
              {insights.budget && !loading.budget && (
                <div
                  className="mt-4 prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: formatTextToHTML(insights.budget),
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
