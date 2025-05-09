'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Type definitions
interface RiskAssessment {
  customer_id: string;
  overall_risk_score: number;
}

interface FinancialGoal {
  goal_name: string;
  progress_percent: number;
  target_date: string;
}

// Utility function to parse and format the text received from the backend
const formatTextToHTML = (text: string) => {
  if (!text) return '';
  
  let formattedText = text;

  // Handle bold text (i.e., text wrapped in `**`)
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Handle unordered lists (i.e., lines that start with "*")
  formattedText = formattedText.replace(/^\* (.*?)$/gm, '<li>$1</li>');

  // Wrap list items in <ul>
  formattedText = formattedText.replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>');

  // Handle headers (e.g., text that starts with numbers followed by a dot)
  formattedText = formattedText.replace(/^(\d+\.)(.*?)$/gm, (match, p1, p2) => {
    return `<h3 class="text-lg font-semibold">${p2.trim()}</h3>`;
  });

  // Wrap paragraphs
  formattedText = formattedText.replace(/\n\n/g, '</p><p class="mb-4">');
  formattedText = `<p class="mb-4">${formattedText}</p>`;

  return formattedText;
};

export default function DashboardPage() {
  const [riskData, setRiskData] = useState<RiskAssessment[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [goalsTrend, setGoalsTrend] = useState<string>('');
  const [riskTrend, setRiskTrend] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'charts' | 'analysis'>('charts');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [analysisLoading, setAnalysisLoading] = useState<{
    goals: boolean;
    risk: boolean;
  }>({ goals: false, risk: false });
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isClient = localStorage.getItem("access") === "client";

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!isClient) {
      alert("You are not a client of a financial institution");
      router.push("/login");
    }
  }, [router]);

  // Fetch chart data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const resRisk = await fetch('http://34.55.216.204:8000/risk_assessments');
        const resGoals = await fetch('http://34.55.216.204:8000/financial_goals');
        
        if (!resRisk.ok || !resGoals.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        setRiskData(await resRisk.json());
        setGoals(await resGoals.json());
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch analysis data for goals
  const fetchGoalsAnalysis = async () => {
    try {
      setAnalysisLoading(prev => ({ ...prev, goals: true }));
      const response = await fetch('http://34.55.216.204:8000/financial_goals/agent/analyze_trends');
      
      if (!response.ok) {
        throw new Error('Failed to fetch goals analysis');
      }
      
      const data = await response.json();
      setGoalsTrend(data.answer);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unknown error occurred.');
      }
    } finally {
      setAnalysisLoading(prev => ({ ...prev, goals: false }));
    }
  };

  // Fetch analysis data for risk
  const fetchRiskAnalysis = async () => {
    try {
      setAnalysisLoading(prev => ({ ...prev, risk: true }));
      const response = await fetch('http://34.55.216.204:8000/risk_assessments/agent/analyze_trends');
      
      if (!response.ok) {
        throw new Error('Failed to fetch risk analysis');
      }
      
      const data = await response.json();
      setRiskTrend(data.answer);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unknown error occurred.');
      }
    } finally {
      setAnalysisLoading(prev => ({ ...prev, risk: false }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Financial Dashboard</h1>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg shadow-sm" role="group">
          <button
            type="button"
            className={`px-6 py-3 text-sm font-medium rounded-l-lg focus:z-10 focus:ring-2 ${
              activeTab === 'charts'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('charts')}
          >
            Charts & Data
          </button>
          <button
            type="button"
            className={`px-6 py-3 text-sm font-medium rounded-r-lg focus:z-10 focus:ring-2 ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('analysis')}
          >
            Trend Analysis
          </button>
        </div>
      </div>

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
          <p className="ml-4 text-lg text-gray-700">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Charts & Data View */}
          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Risk Score Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskData}>
                    <XAxis dataKey="customer_id" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}`, 'Risk Score']} />
                    <Bar dataKey="overall_risk_score" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Financial Goals Progress</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 text-left">Goal</th>
                        <th className="py-3 px-4 text-left">Progress</th>
                        <th className="py-3 px-4 text-left">Target Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goals.map((goal, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-3 px-4">{goal.goal_name}</td>
                          <td className="py-3 px-4 w-1/2">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                                <div
                                  className={`h-4 rounded-full ${
                                    goal.progress_percent >= 75
                                      ? 'bg-green-500'
                                      : goal.progress_percent >= 40
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${goal.progress_percent}%` }}
                                ></div>
                              </div>
                              <span className="text-sm whitespace-nowrap">{goal.progress_percent}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{goal.target_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analysis View */}
          {activeTab === 'analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Financial Goals Analysis */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Financial Goals Analysis</h2>
                  <button
                    onClick={fetchGoalsAnalysis}
                    disabled={analysisLoading.goals}
                    className={`px-4 py-2 rounded-md text-white ${
                      analysisLoading.goals ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
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
                      'Get Analysis'
                    )}
                  </button>
                </div>

                {goalsTrend ? (
                  <div
                    className="text-gray-700 prose"
                    dangerouslySetInnerHTML={{ __html: formatTextToHTML(goalsTrend) }}
                  />
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Click &quot;Get Analysis&quot; to fetch the latest financial goals trend analysis
                  </div>
                )}
              </div>

              {/* Risk Assessment Analysis */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Risk Assessment Analysis</h2>
                  <button
                    onClick={fetchRiskAnalysis}
                    disabled={analysisLoading.risk}
                    className={`px-4 py-2 rounded-md text-white ${
                      analysisLoading.risk ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
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
                      'Get Analysis'
                    )}
                  </button>
                </div>

                {riskTrend ? (
                  <div
                    className="text-gray-700 prose"
                    dangerouslySetInnerHTML={{ __html: formatTextToHTML(riskTrend) }}
                  />
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Click &quot;Get Analysis&quot; to fetch the latest risk assessment trend analysis
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}