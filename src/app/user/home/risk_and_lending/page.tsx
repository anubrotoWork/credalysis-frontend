"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";

type RiskAssessment = {
  assessment_id: string;
  customer_id: string;
  assessment_date: string;
  credit_risk_score: number;
  fraud_risk_score: number;
  default_risk_score: number;
  overall_risk_score: number;
  risk_level: string;
  credit_score: number;
  credit_utilization_percent: number;
  debt_to_income_ratio: number;
  products_count: number;
  transaction_frequency: number;
  average_transaction_amount: number;
  recommendation: string;
  next_review_date: string;
};

type CreditReport = {
  report_id: string;
  customer_id: string;
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
};

type RiskAndLendingData = {
  risk: RiskAssessment | null;
  credit: CreditReport | null;
  analysis: string;
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

export default function RiskAndLendingPage() {
  const [data, setData] = useState<RiskAndLendingData | null>(null);
  const [activeTab, setActiveTab] = useState<"risk" | "credit" | "analysis">(
    "risk"
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

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/risk_and_lending/?email=${email}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load risk/lending data:", err));
  }, [router]);

  const renderTabContent = () => {
    if (!data) return <p>Loading...</p>;

    switch (activeTab) {
      case "risk":
        const risk = data.risk;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              ["Risk Level", risk!.risk_level],
              ["Overall Score", risk!.overall_risk_score],
              ["Credit Risk", risk!.credit_risk_score],
              ["Fraud Risk", risk!.fraud_risk_score],
              ["Default Risk", risk!.default_risk_score],
              ["Credit Score", risk!.credit_score],
              ["Utilization (%)", risk!.credit_utilization_percent],
              ["DTI Ratio", risk!.debt_to_income_ratio],
              ["Products Count", risk!.products_count],
              ["Txn Frequency", risk!.transaction_frequency],
              [
                "Avg Txn Amount",
                `$${risk!.average_transaction_amount.toLocaleString()}`,
              ],
              ["Recommendation", risk!.recommendation],
              ["Assessment Date", risk!.assessment_date],
              ["Next Review", risk!.next_review_date],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-100 p-3 rounded">
                <p className="font-medium text-gray-700">{label}</p>
                <p className="text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        );

      case "credit":
        const credit = data.credit;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              ["Credit Bureau", credit!.credit_bureau],
              ["Credit Score", credit!.credit_score],
              ["Credit Rating", credit!.credit_rating],
              ["Payment History (%)", credit!.payment_history_percent],
              ["Utilization (%)", credit!.credit_utilization_percent],
              ["Total Accounts", credit!.total_accounts],
              ["Open Accounts", credit!.open_accounts],
              ["Credit Age (mo)", credit!.credit_age_months],
              ["Hard Inquiries", credit!.hard_inquiries],
              ["Public Records", credit!.public_records],
              ["Collections", credit!.collections],
              ["Total Debt", `$${credit!.total_debt.toLocaleString()}`],
              ["Revolving Debt", `$${credit!.revolving_debt.toLocaleString()}`],
              [
                "Installment Debt",
                `$${credit!.installment_debt.toLocaleString()}`,
              ],
              ["Mortgage Debt", `$${credit!.mortgage_debt.toLocaleString()}`],
              [
                "Available Credit",
                `$${credit!.available_credit.toLocaleString()}`,
              ],
              ["Report Date", credit!.report_date],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-100 p-3 rounded">
                <p className="font-medium text-gray-700">{label}</p>
                <p className="text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        );
      case "analysis":
        return (
          <div className="prose max-w-none">
            {/* <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.analysis}
            </ReactMarkdown> */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {data.analysis}
            </ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Risk & Lending Profile</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("risk")}
          className={`pb-2 px-4 border-b-2 ${
            activeTab === "risk"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600"
          }`}
        >
          Risk Assessment
        </button>
        <button
          onClick={() => setActiveTab("credit")}
          className={`pb-2 px-4 border-b-2 ${
            activeTab === "credit"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600"
          }`}
        >
          Credit Report
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`pb-2 px-4 border-b-2 ${
            activeTab === "analysis"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600"
          }`}
        >
          AI Analysis
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
}
