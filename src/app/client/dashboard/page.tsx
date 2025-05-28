// src/app/client/dashboard/page.tsx (or your chosen path)
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell, // For conditional bar colors if needed
} from "recharts";

// Type definitions
interface RiskAssessment {
  customer_id: string; // Still used for XAxis, consider changing if too many customers
  overall_risk_score: number;
  // Add other fields if you want to display them in tooltips or process them
}

interface FinancialGoal {
  goal_name: string;
  progress_percent: number;
  target_date: string; // Assuming date is pre-formatted or as string
  // Add other fields like 'status' or 'target_amount' if available and needed
}

// Utility function to parse and format the text received from the backend
// This is a simplified version. For complex markdown, consider a dedicated library.
const formatTextToHTML = (text: string): string => {
  if (!text || typeof text !== 'string') return "";

  let html = text;

  // 1. Escape HTML to prevent XSS if not already handled by AI or backend
  // For demonstration, assuming AI output is generally safe or sanitized.
  // const escapeHtml = (unsafe: string) =>
  //   unsafe
  //     .replace(/&/g, "&")
  //     .replace(/</g, "<")
  //     .replace(/>/g, ">")
  //     .replace(/"/g, """)
  //     .replace(/'/g, "'");
  // html = escapeHtml(html);


  // 2. Handle Headers (e.g., "1. My Header" or "## My Header")
  html = html.replace(/^(\d+\.|##)\s*(.*?)(\n|$)/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$2</h3>');

  // 3. Handle Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");


  // 4. Handle Unordered Lists (lines starting with * or -)
  // This regex tries to group consecutive list items.
  html = html.replace(/(?:^\s*[-*+]\s+.*\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\s*[-*+]\s+/, '').trim()}</li>`).join('');
    return `<ul class="list-disc list-inside my-2 pl-4">${items}</ul>`;
  });

  // 5. Handle Ordered Lists (lines starting with "1. ")
   html = html.replace(/(?:^\s*\d+\.\s+.*\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\s*\d+\.\s+/, '').trim()}</li>`).join('');
    return `<ol class="list-decimal list-inside my-2 pl-4">${items}</ol>`;
  });


  // 6. Handle Line Breaks and Paragraphs
  // Convert multiple newlines to paragraph breaks, single newlines to <br>
  // This is basic; real paragraph detection is complex.
  html = html
    .split(/\n\s*\n/) // Split by one or more empty lines to define paragraphs
    .map(paragraph => {
      if (paragraph.trim().startsWith('<ul') || paragraph.trim().startsWith('<ol') || paragraph.trim().startsWith('<h3')) {
        return paragraph.trim(); // Don't wrap lists/headings in <p>
      }
      // Convert single newlines within a paragraph to <br>
      return paragraph.trim() ? `<p class="mb-3">${paragraph.trim().replace(/\n/g, '<br />')}</p>` : '';
    })
    .join('');


  return html;
};


// Helper for authenticated fetch
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  // Ensure content type is set for POST/PUT if body is JSON
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) { // Unauthorized
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('email');
      localStorage.removeItem('access');
      // Redirect to login, but ensure it doesn't loop if already on login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?sessionExpired=true';
      }
    }
    // Throw an error to stop further processing in the calling function
    throw new Error('Session expired or unauthorized. Please log in again.');
  }
  return response;
}


export default function ClientDashboardPage() {
  const [riskData, setRiskData] = useState<RiskAssessment[]>([]);
  const [goalsData, setGoalsData] = useState<FinancialGoal[]>([]); // Renamed for clarity
  const [goalsTrend, setGoalsTrend] = useState<string>("");
  const [riskTrend, setRiskTrend] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"charts" | "analysis">("charts");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [analysisLoading, setAnalysisLoading] = useState<{
    goals: boolean;
    risk: boolean;
  }>({ goals: false, risk: false });
  const router = useRouter();

  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Check authentication
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");

    if (!authToken) {
      router.push("/login");
      return;
    }

    if (userAccessLevel !== "client") {
      alert("You do not have permission to access this page.");
      localStorage.removeItem('authToken');
      localStorage.removeItem('email');
      localStorage.removeItem('access');
      router.push("/login");
      return;
    }
  }, [router]);

  // Fetch chart data
  useEffect(() => {
    if (!backendApiUrl) {
      setErrorMessage("Backend API URL is not configured. Please check environment variables.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Fetch risk data - ensure backend returns only customer_id and overall_risk_score or that your type is broad
        const resRisk = await authFetch(`${backendApiUrl}/risk-assessments`);
        // Fetch goals data - ensure this endpoint returns individual goals matching FinancialGoal interface
        const resGoals = await authFetch(`${backendApiUrl}/financial-goals/`); // UPDATED ENDPOINT

        if (!resRisk.ok) {
          const errorDataRisk = await resRisk.json().catch(() => ({detail: "Failed to fetch risk data"}));
          throw new Error(`Risk Data: ${resRisk.status} ${errorDataRisk.detail || resRisk.statusText}`);
        }
         if (!resGoals.ok) {
          const errorDataGoals = await resGoals.json().catch(() => ({detail: "Failed to fetch goals data"}));
          throw new Error(`Goals Data: ${resGoals.status} ${errorDataGoals.detail || resGoals.statusText}`);
        }

        const riskJson: RiskAssessment[] = await resRisk.json();
        const goalsJson: FinancialGoal[] = await resGoals.json();
        
        setRiskData(riskJson);
        setGoalsData(goalsJson);

      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unknown error occurred while fetching dashboard data.");
        }
        setRiskData([]); // Clear data on error
        setGoalsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [backendApiUrl]); // Removed router from dependencies as it's stable

  // Fetch analysis data for goals
  const fetchGoalsAnalysis = useCallback(async () => {
    if (!backendApiUrl) {
        setErrorMessage("Backend API URL is not configured.");
        return;
    }
    setAnalysisLoading((prev) => ({ ...prev, goals: true }));
    setErrorMessage(null);
    try {
      const response = await authFetch(
        `${backendApiUrl}/financial-goals/agent/analyze_trends`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({detail: "Failed to fetch goals analysis"}));
        throw new Error(`Goals Analysis: ${response.status} ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();
      setGoalsTrend(data.answer || "No analysis content received."); // Use "answer" key and provide fallback
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred fetching goals analysis.");
      }
      setGoalsTrend("");
    } finally {
      setAnalysisLoading((prev) => ({ ...prev, goals: false }));
    }
  }, [backendApiUrl]);

  // Fetch analysis data for risk
  const fetchRiskAnalysis = useCallback(async () => {
     if (!backendApiUrl) {
        setErrorMessage("Backend API URL is not configured.");
        return;
    }
    setAnalysisLoading((prev) => ({ ...prev, risk: true }));
    setErrorMessage(null);
    try {
      const response = await authFetch(
        `${backendApiUrl}/risk-assessments/agent/analyze_trends`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({detail: "Failed to fetch risk analysis"}));
        throw new Error(`Risk Analysis: ${response.status} ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();
      setRiskTrend(data.answer || "No analysis content received."); // Use "answer" key
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred fetching risk analysis.");
      }
      setRiskTrend("");
    } finally {
      setAnalysisLoading((prev) => ({ ...prev, risk: false }));
    }
  }, [backendApiUrl]);

  const getRiskScoreColor = (score: number) => {
    if (score > 70) return "#EF4444"; // red-500 (High risk)
    if (score > 40) return "#F59E0B"; // amber-500 (Medium risk)
    return "#22C55E"; // green-500 (Low risk)
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
          Client Financial Dashboard
        </h1>
      </header>

      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium rounded-l-lg focus:z-10 focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 ${
              activeTab === "charts"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
            onClick={() => setActiveTab("charts")}
          >
            Charts & Data
          </button>
          <button
            type="button"
            className={`px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium rounded-r-lg focus:z-10 focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 ${
              activeTab === "analysis"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 border-l-0"
            }`}
            onClick={() => setActiveTab("analysis")}
          >
            Trend Analysis
          </button>
        </div>
      </div>

      {/* Loading Spinner for initial data */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-indigo-600 border-solid"></div>
          <p className="mt-4 text-base sm:text-lg text-gray-600">
            Loading dashboard data...
          </p>
        </div>
      ) : (
        <>
          {/* Charts & Data View */}
          {activeTab === "charts" && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">
                  Risk Score Distribution
                </h2>
                {riskData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={riskData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                      {/* Note: XAxis with 'customer_id' can be unreadable with many customers.
                          Consider backend aggregation or a different chart (e.g., histogram) for large datasets. */}
                      <XAxis dataKey="customer_id" tick={{ fontSize: 10 }} interval={riskData.length > 20 ? 'preserveStartEnd' : 0} angle={-30} textAnchor="end" height={50} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: number) => [`${value}`, "Risk Score"]}
                        labelFormatter={(label: string) => `Customer: ${label}`}
                        cursor={{fill: 'rgba(230, 230, 250, 0.5)'}}
                      />
                      <Bar
                        dataKey="overall_risk_score"
                        radius={[4, 4, 0, 0]}
                      >
                        {riskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getRiskScoreColor(entry.overall_risk_score)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-10">No risk data available to display.</p>
                )}
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">
                  Financial Goals Progress
                </h2>
                {goalsData.length > 0 ? (
                  <div className="overflow-x-auto max-h-[300px]"> {/* Added max-h for scrollability */}
                    <table className="min-w-full bg-white">
                      <thead className="sticky top-0 bg-gray-100 z-10">
                        <tr>
                          <th className="py-2 sm:py-3 px-3 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wider">Goal Name</th>
                          <th className="py-2 sm:py-3 px-3 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wider">Progress</th>
                          <th className="py-2 sm:py-3 px-3 sm:px-4 text-left text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wider">Target Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {goalsData.map((goal, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-sm text-gray-800 whitespace-nowrap">{goal.goal_name || 'N/A'}</td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-sm text-gray-700 w-2/5"> {/* Adjusted width */}
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mr-2">
                                  <div
                                    className={`h-3 sm:h-4 rounded-full transition-all duration-500 ease-out ${
                                      goal.progress_percent >= 75 ? "bg-green-500"
                                      : goal.progress_percent >= 40 ? "bg-yellow-500"
                                      : "bg-red-500"
                                    }`}
                                    style={{ width: `${goal.progress_percent || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                  {goal.progress_percent !== undefined ? `${goal.progress_percent}%` : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-sm text-gray-600 whitespace-nowrap">{goal.target_date || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-10">No financial goals data available to display.</p>
                )}
              </div>
            </section>
          )}

          {/* Analysis View */}
          {activeTab === "analysis" && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Financial Goals Analysis */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-0">
                    Financial Goals Analysis
                  </h2>
                  <button
                    onClick={fetchGoalsAnalysis}
                    disabled={analysisLoading.goals}
                    className={`px-4 py-2 text-sm rounded-md text-white transition-colors duration-150 ${
                      analysisLoading.goals
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    }`}
                  >
                    {analysisLoading.goals ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      "Get Goals Analysis"
                    )}
                  </button>
                </div>

                {goalsTrend ? (
                  <div
                    className="text-sm text-gray-700 prose prose-sm max-w-none max-h-96 overflow-y-auto custom-scrollbar" // Added max-h and overflow
                    dangerouslySetInnerHTML={{ __html: formatTextToHTML(goalsTrend) }}
                  />
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    {analysisLoading.goals ? 'Fetching analysis...' : 'Click "Get Goals Analysis" to view insights.'}
                  </div>
                )}
              </div>

              {/* Risk Assessment Analysis */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-0">
                    Risk Assessment Analysis
                  </h2>
                  <button
                    onClick={fetchRiskAnalysis}
                    disabled={analysisLoading.risk}
                     className={`px-4 py-2 text-sm rounded-md text-white transition-colors duration-150 ${
                      analysisLoading.risk
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    }`}
                  >
                    {analysisLoading.risk ? (
                       <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      "Get Risk Analysis"
                    )}
                  </button>
                </div>

                {riskTrend ? (
                  <div
                    className="text-sm text-gray-700 prose prose-sm max-w-none max-h-96 overflow-y-auto custom-scrollbar" // Added max-h and overflow
                    dangerouslySetInnerHTML={{ __html: formatTextToHTML(riskTrend) }}
                  />
                ) : (
                  <div className="text-gray-500 text-center py-8">
                     {analysisLoading.risk ? 'Fetching analysis...' : 'Click "Get Risk Analysis" to view insights.'}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
       <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c7c7c7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a3a3a3;
        }
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #c7c7c7 #f1f1f1;
        }
        .prose ul, .prose ol { margin-left: 1rem; } /* Ensure lists in prose have some margin */
      `}</style>
    </div>
  );
}