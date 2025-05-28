"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Define authFetch here or import from a shared lib/authFetch.ts
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) { // Unauthorized
    if (typeof window !== 'undefined') {
      console.warn("authFetch: Received 401 Unauthorized. Clearing token and redirecting to login.");
      localStorage.removeItem('authToken');
      localStorage.removeItem('email');
      localStorage.removeItem('access');
      if (window.location.pathname !== '/login') { // Avoid redirect loop
        window.location.href = '/login';
      }
    }
  }
  return response;
}


interface CreditReport {
  report_id: string;
  report_date: string;
  credit_bureau: string;
  credit_score: number;
  credit_rating: string;
  payment_history_percent: number;
  credit_utilization_percent: number;
  total_accounts: number;
  open_accounts: number;
  credit_age_months: number;
  hard_inquiries: number;
  public_records: number;
  collections: number;
  total_debt: number;
  revolving_debt: number;
  installment_debt: number;
  mortgage_debt: number;
  available_credit: number;
}

export default function CreditReportsPage() { // Renamed component for clarity
  const router = useRouter();
  const [reports, setReports] = useState<CreditReport[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);

  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchReports = useCallback(async () => { // Email parameter removed
    if (!backendApiUrl) {
      console.error("Backend API URL is not configured.");
      setLoadingReports(false);
      setReports([]);
      alert("Application error: API URL missing.");
      return;
    }
    setLoadingReports(true);
    try {
      // Email is now derived from the token on the backend
      const res = await authFetch( // Use authFetch
        `${backendApiUrl}/user/credit-reports/customer/reports` // Updated path (assuming credit_reports.py router is included at /credit-reports)
                                                            // Adjust if your main.py includes it differently
      );
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to fetch reports: ${res.status} ${res.statusText} - ${errorText}`
        );
        setReports([]);
        throw new Error(`Failed to fetch reports: ${res.statusText}`);
      }
      const data: CreditReport[] = await res.json();
      setReports(
        data.sort(
          (a, b) =>
            new Date(b.report_date).getTime() -
            new Date(a.report_date).getTime()
        )
      );
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, [backendApiUrl]); // backendApiUrl is a dependency

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    // const email = localStorage.getItem("email"); // No longer need to pass email to fetchReports

    if (!authToken) {
      router.push("/login");
      return;
    }

    if (userAccessLevel !== "user") {
      alert("You do not have permission to access this page.");
      router.push("/login");
      return;
    }
    // Call fetchReports without email, as it's derived from token by backend
    fetchReports(); 
    
  }, [router, fetchReports]);

  const handleAnalyze = async () => {
    // const email = localStorage.getItem("email"); // No longer need to send email in body
    const authToken = localStorage.getItem("authToken");

    if (!authToken) { // Check token presence for auth context
      alert("User session invalid. Please log in again.");
      router.push("/login");
      return;
    }
    if (reports.length === 0) {
      alert("No credit report data available to analyze.");
      return;
    }
    if (!backendApiUrl) {
      alert("Application error: API URL missing.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysis("");
    try {
      const res = await authFetch(`${backendApiUrl}/user/credit-reports/analyze/my-credit`, { // Updated path
        method: "POST",
        // No body needed if the backend derives user from token and analyzes their latest report
        // If your backend still requires some body (e.g., specific report_id to analyze), add it here.
        // For this example, assuming it analyzes the latest for the authenticated user.
        // body: JSON.stringify({}), // Send empty JSON object if POST requires a body but no specific data
      });
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: "Analysis request failed due to server error." }));
        console.error(
          `Failed to analyze: ${res.status} ${res.statusText}`,
          errorData
        );
        alert(`Error during analysis: ${errorData.detail || res.statusText}`);
        throw new Error("Failed to analyze");
      }
      const result = await res.json();
      setAnalysis(result.analysis);
    } catch (err) {
      console.error("Error during analysis:", err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const latestReport = reports.length > 0 ? reports[0] : null;

  // ... (Rest of your JSX for rendering remains the same) ...
  if (loadingReports && reports.length === 0 && !latestReport) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-gray-700">Loading your credit data...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl lg:max-w-3xl mx-auto">
        <div className="w-full flex justify-end mb-6">
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors duration-150 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:outline-none"
          >
            Logout
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-indigo-600 border-b border-gray-300 pb-4 text-center">
          Credit Report Dashboard
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">
            Your Latest Credit Report
          </h2>
          {loadingReports && reports.length === 0 ? ( 
            <p className="text-gray-600 text-center py-4">
              Fetching your latest credit report...
            </p>
          ) : latestReport ? (
            <div className="space-y-3 text-sm">
              <p><strong className="font-medium text-gray-800">Date:</strong> <span className="text-gray-700">{new Date(latestReport.report_date).toLocaleDateString()}</span></p>
              <p><strong className="font-medium text-gray-800">Bureau:</strong> <span className="text-gray-700">{latestReport.credit_bureau}</span></p>
              <p>
                <strong className="font-medium text-gray-800">Score:</strong>{" "}
                <span className="font-semibold text-2xl text-indigo-600">{latestReport.credit_score}</span>{" "}
                <span className="text-gray-500">({latestReport.credit_rating})</span>
              </p>
              <p><strong className="font-medium text-gray-800">Credit Utilization:</strong> <span className="text-gray-700">{latestReport.credit_utilization_percent}%</span></p>
              <p><strong className="font-medium text-gray-800">Payment History:</strong> <span className="text-gray-700">{latestReport.payment_history_percent}%</span></p>
              <p><strong className="font-medium text-gray-800">Total Debt:</strong> <span className="text-gray-700">${latestReport.total_debt.toLocaleString()}</span></p>
              <p><strong className="font-medium text-gray-800">Available Credit:</strong> <span className="text-gray-700">${latestReport.available_credit.toLocaleString()}</span></p>
            </div>
          ) : (
            <p className="text-gray-600 italic text-center py-4">
              No credit reports found for your account.
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-indigo-700 mb-4">
            AI Credit Health Analysis
          </h2>
          <button
            onClick={handleAnalyze}
            disabled={analysisLoading || loadingReports || !latestReport}
            className="mb-4 w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition duration-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {analysisLoading ? "Analyzing Your Credit..." : "Analyze with AI"}
          </button>
          {analysisLoading && (
            <p className="text-sm text-gray-600 text-center mt-2">
              Please wait while the AI processes your credit information...
            </p>
          )}
          {analysis && !analysisLoading && (
            <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200 prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysis}
              </ReactMarkdown>
            </div>
          )}
          {!analysis && !analysisLoading && (
            <p className="text-sm text-gray-600 text-center mt-4">
              {latestReport
                ? "Click the button above to get your personalized AI credit health analysis."
                : "Load your credit report to enable AI analysis."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}