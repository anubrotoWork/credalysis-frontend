"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// Define authFetch here or import from a shared lib
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('email');
    localStorage.removeItem('access');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return response;
}

// Type Definitions (making some fields nullable as they might not always be present)
type RiskAssessment = {
  assessment_id: string;
  customer_id: string;
  assessment_date: string | null;
  credit_risk_score: number | null;
  fraud_risk_score: number | null;
  default_risk_score: number | null;
  overall_risk_score: number | null;
  risk_level: string | null;
  credit_score: number | null; // This might be redundant if also in CreditReport, but present in schema
  credit_utilization_percent: number | null;
  debt_to_income_ratio: number | null;
  products_count: number | null;
  transaction_frequency: number | null;
  average_transaction_amount: number | null;
  recommendation: string | null;
  next_review_date: string | null;
};

type CreditReport = {
  report_id: string;
  customer_id: string;
  report_date: string | null;
  credit_bureau: string | null;
  credit_score: number | null;
  credit_rating: string | null;
  payment_history_percent: number | null;
  credit_utilization_percent: number | null;
  total_accounts: number | null;
  open_accounts: number | null;
  credit_age_months: number | null;
  hard_inquiries: number | null;
  public_records: number | null;
  collections: number | null;
  total_debt: number | null;
  revolving_debt: number | null;
  installment_debt: number | null;
  mortgage_debt: number | null;
  available_credit: number | null;
};

type RiskAndLendingData = {
  risk: RiskAssessment | null;
  credit: CreditReport | null;
  analysis: string; // AI-generated analysis
};

const markdownComponents: Components = {
  table: (props) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-100" {...props} />,
  tbody: (props) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
  tr: (props) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
  th: (props) => <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider" {...props} />,
  td: (props) => <td className="px-4 py-3 whitespace-nowrap" {...props} />,
};

const formatDate = (dateString: string | null | undefined) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
const formatCurrency = (amount: number | null | undefined, precision = 2) => amount != null ? `$${amount.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}` : 'N/A';
const formatPercent = (value: number | null | undefined) => value != null ? `${(value * 100).toFixed(1)}%` : 'N/A';
const formatNumber = (value: number | null | undefined, precision = 0) => value != null ? value.toFixed(precision) : 'N/A';

// Helper component for displaying data items
const DataItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`bg-gray-50 p-3 sm:p-4 rounded-lg shadow border border-gray-200 ${className}`}>
      <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm sm:text-base font-semibold text-gray-800 mt-1 truncate" title={typeof value === 'string' ? value : undefined}>{value || 'N/A'}</p>
    </div>
);


export default function RiskAndLendingPage() {
  const [data, setData] = useState<RiskAndLendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "risk" | "credit">(
    "analysis" // Default to AI analysis
  );
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "user") {
      alert("You do not have permission to access this page.");
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchRiskAndLendingData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(
        `${backendApiUrl}/api/user/risk_and_lending/`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch data" }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result: RiskAndLendingData = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to load risk/lending data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [backendApiUrl]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (authToken && userAccessLevel === "user") {
      fetchRiskAndLendingData();
    }
  }, [fetchRiskAndLendingData]);


  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px] p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-gray-600">Loading risk and lending profile...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 p-6">
          <p className="text-red-600 font-semibold text-lg">Error:</p>
          <p className="text-gray-700 my-2">{error}</p>
          <button
            onClick={fetchRiskAndLendingData}
            className="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          > Try Again </button>
        </div>
      );
    }
     if (!data || (!data.risk && !data.credit && !data.analysis)) {
      return <div className="text-center py-10 text-gray-500 italic">No risk and lending data available at this time.</div>;
    }

    switch (activeTab) {
      case "risk":
        const risk = data.risk;
        if (!risk) return <p className="text-gray-500 italic p-4">No risk assessment data available.</p>;
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Risk Assessment Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <DataItem label="Risk Level" value={risk.risk_level} />
              <DataItem label="Overall Risk Score" value={formatNumber(risk.overall_risk_score, 2)} />
              <DataItem label="Credit Risk Score" value={formatNumber(risk.credit_risk_score, 2)} />
              <DataItem label="Fraud Risk Score" value={formatNumber(risk.fraud_risk_score, 2)} />
              <DataItem label="Default Risk Score" value={formatNumber(risk.default_risk_score, 2)} />
              <DataItem label="Associated Credit Score" value={risk.credit_score} />
              <DataItem label="Credit Utilization" value={formatPercent(risk.credit_utilization_percent)} />
              <DataItem label="Debt-to-Income Ratio" value={formatPercent(risk.debt_to_income_ratio)} />
              <DataItem label="Number of Products" value={risk.products_count} />
              <DataItem label="Transaction Frequency" value={formatNumber(risk.transaction_frequency,1)} />
              <DataItem label="Avg. Transaction Amount" value={formatCurrency(risk.average_transaction_amount)} />
              <DataItem label="Assessment Date" value={formatDate(risk.assessment_date)} />
              <DataItem label="Next Review Date" value={formatDate(risk.next_review_date)} />
            </div>
             {risk.recommendation && (
                <div className="mt-6 bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
                    <h3 className="text-md font-semibold text-blue-700 mb-1">Recommendation</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{risk.recommendation}</p>
                </div>
            )}
          </div>
        );

      case "credit":
        const credit = data.credit;
        if (!credit) return <p className="text-gray-500 italic p-4">No credit report data available.</p>;
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Credit Report Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <DataItem label="Credit Bureau" value={credit.credit_bureau} />
              <DataItem label="Credit Score" value={credit.credit_score} />
              <DataItem label="Credit Rating" value={credit.credit_rating} />
              <DataItem label="Payment History" value={formatPercent(credit.payment_history_percent)} />
              <DataItem label="Credit Utilization" value={formatPercent(credit.credit_utilization_percent)} />
              <DataItem label="Total Accounts" value={credit.total_accounts} />
              <DataItem label="Open Accounts" value={credit.open_accounts} />
              <DataItem label="Credit Age (Months)" value={credit.credit_age_months} />
              <DataItem label="Hard Inquiries" value={credit.hard_inquiries} />
              <DataItem label="Public Records" value={credit.public_records} />
              <DataItem label="Collections" value={credit.collections} />
              <DataItem label="Total Debt" value={formatCurrency(credit.total_debt)} />
              <DataItem label="Revolving Debt" value={formatCurrency(credit.revolving_debt)} />
              <DataItem label="Installment Debt" value={formatCurrency(credit.installment_debt)} />
              <DataItem label="Mortgage Debt" value={formatCurrency(credit.mortgage_debt)} />
              <DataItem label="Available Credit" value={formatCurrency(credit.available_credit)} />
              <DataItem label="Report Date" value={formatDate(credit.report_date)} />
            </div>
          </div>
        );
      case "analysis":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">AI-Powered Analysis & Recommendations</h2>
            {data.analysis ? (
                <div className="prose max-w-none prose-sm sm:prose-base p-4 bg-gray-50 rounded-lg border custom-scrollbar">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                    >
                        {data.analysis}
                    </ReactMarkdown>
                </div>
            ) : (
                <p className="text-gray-500 italic">No AI analysis available at this time.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">Risk & Lending Profile</h1>
         <p className="text-md text-gray-600 mt-1">
            An overview of your risk assessment, credit report, and AI-driven insights.
        </p>
      </header>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 border-b border-gray-300 pb-3">
         <button
          onClick={() => setActiveTab("analysis")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "analysis"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          AI Analysis
        </button>
        <button
          onClick={() => setActiveTab("risk")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "risk"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Risk Assessment
        </button>
        <button
          onClick={() => setActiveTab("credit")}
          className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-colors duration-150 text-sm sm:text-base focus:outline-none ${
            activeTab === "credit"
              ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
              : "text-gray-500 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          Credit Report
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl min-h-[400px]">
        {renderTabContent()}
      </div>
       <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f7fafc; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5e0 #f7fafc; }
      `}</style>
    </div>
  );
}