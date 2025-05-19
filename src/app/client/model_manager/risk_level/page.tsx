"use client";

import { useState, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";

// Type for the prediction form
type PredictFormType = {
  [key: string]: string;
  credit_risk_score: string;
  fraud_risk_score: string;
  default_risk_score: string;
  overall_risk_score: string;
  credit_score: string;
  credit_utilization_percent: string;
  debt_to_income_ratio: string;
  products_count: string;
  transaction_frequency: string;
  average_transaction_amount: string;
};

// Helper function to convert snake_case to Title Case
const toTitleCase = (str: string) =>
  str
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

export default function RiskLevelPage() {
  const router = useRouter();
  const backendApiUrl = "http://34.9.145.33:8000";

  // Tab state
  const [tab, setTab] = useState<"predict" | "performance" | "update">("predict");

  // Form state
  const [predictForm, setPredictForm] = useState<PredictFormType>({
    credit_risk_score: "",
    fraud_risk_score: "",
    default_risk_score: "",
    overall_risk_score: "",
    credit_score: "",
    credit_utilization_percent: "",
    debt_to_income_ratio: "",
    products_count: "",
    transaction_frequency: "",
    average_transaction_amount: ""
  });

  // Result states
  const [predictResult, setPredictResult] = useState<string | null>(null);
  const [perfResult, setPerfResult] = useState<string | JSX.Element | null>(null);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isClient = localStorage.getItem("access") === "client";
    if (!isLoggedIn || !isClient) {
      alert("You are not authorized.");
      router.push("/login");
    }
  }, [router]);

  // --- Handlers for tabs ---

  // 1. Predict Risk Level
  const handlePredictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPredictForm({ ...predictForm, [e.target.name]: e.target.value });
  };

  const handlePredictSubmit = async () => {
    setPredictResult("Loading...");
    try {
      const response = await fetch(`${backendApiUrl}/model/risk_level/testing`, { // Kept /testing as in original
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.fromEntries(
            Object.entries(predictForm).map(([k, v]) => [
              k,
              v === "" ? null : isNaN(Number(v)) ? v : Number(v)
            ])
          )
        ),
      });
      const result = await response.json();
      setPredictResult(
        result.predicted_risk_level // Changed from predicted_credit_rating
          ? `Predicted Risk Level: ${result.predicted_risk_level}`
          : JSON.stringify(result)
      );
    } catch (error) {
      if (error instanceof Error) {
        setPredictResult("Error: " + error.message);
      } else {
        setPredictResult("An unknown error occurred.");
      }
    }
  };

  // 2. Model Performance
  const handlePerfSubmit = async () => {
    setPerfResult("Loading...");
    try {
      const response = await fetch(`${backendApiUrl}/model/risk_level/performance`, {
        method: "POST",
      });
      const result = await response.json();
      setPerfResult(
        result.classification_report
          ? <pre className="text-xs overflow-auto bg-white p-2 rounded shadow-inner">{JSON.stringify(result.classification_report, null, 2)}</pre>
          : JSON.stringify(result)
      );
    } catch (error) {
      if (error instanceof Error) {
        setPerfResult("Error: " + error.message);
      } else {
        setPerfResult("An unknown error occurred.");
      }
    }
  };

  // 3. Model Update
  const handleUpdateSubmit = async () => {
    setUpdateResult("Loading...");
    try {
      const response = await fetch(`${backendApiUrl}/model/risk_level/update`, {
        method: "POST",
      });
      const result = await response.json();
      setUpdateResult(result.message ? result.message : JSON.stringify(result));
    } catch (error) {
      if (error instanceof Error) {
        setUpdateResult("Error: " + error.message);
      } else {
        setUpdateResult("An unknown error occurred.");
      }
    }
  };

  // --- UI Styling Constants (from the beautified Credit Report example) ---
  const commonButtonClasses = "flex-1 py-3 px-3 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out focus:outline-none";
  const activeTabClasses = `${commonButtonClasses} bg-white text-indigo-600 shadow-lg hover:shadow-xl hover:bg-indigo-50 transform hover:-translate-y-1 hover:scale-105 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-white`;
  const inactiveTabClasses = `${commonButtonClasses} bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`;
  const actionButtonClasses = "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150";
  const resultContainerClasses = "mt-6 p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 break-words shadow-inner";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
        Risk Level Model Manager
      </h1>

      {/* Tabs */}
      <div className="flex w-full max-w-lg mb-8 gap-2">
        <button
          className={`${tab === "predict" ? activeTabClasses : inactiveTabClasses}`}
          onClick={() => setTab("predict")}
        >
          Predict Risk Level
        </button>
        <button
          className={`${tab === "performance" ? activeTabClasses : inactiveTabClasses}`}
          onClick={() => setTab("performance")}
        >
          Model Performance
        </button>
        <button
          className={`${tab === "update" ? activeTabClasses : inactiveTabClasses}`}
          onClick={() => setTab("update")}
        >
          Update Model
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-8">
        {tab === "predict" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-300">
              Predict Risk Level
            </h2>
            <div className="space-y-5 mb-6">
              {Object.keys(predictForm).map((field) => (
                <div key={field}>
                  <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {toTitleCase(field)}
                  </label>
                  <input
                    id={field}
                    name={field}
                    type="number"
                    step="any"
                    placeholder={toTitleCase(field)}
                    value={predictForm[field as keyof PredictFormType]} // Accessing typed form
                    onChange={handlePredictChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handlePredictSubmit}
              className={actionButtonClasses}
            >
              Predict
            </button>
            {predictResult && (
              <div className={resultContainerClasses}>
                {predictResult}
              </div>
            )}
          </div>
        )}

        {tab === "performance" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-300">
              Model Performance
            </h2>
            <button
              onClick={handlePerfSubmit}
              className={actionButtonClasses}
            >
              Evaluate Model
            </button>
            {perfResult && (
              <div className={resultContainerClasses}>
                {perfResult}
              </div>
            )}
          </div>
        )}

        {tab === "update" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-300">
              Update Model
            </h2>
            <button
              onClick={handleUpdateSubmit}
              className={actionButtonClasses}
            >
              Retrain Model from Database
            </button>
            {updateResult && (
              <div className={resultContainerClasses}>
                {updateResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}