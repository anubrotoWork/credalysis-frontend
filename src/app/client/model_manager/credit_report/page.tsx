"use client";

import { useState, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";

type CreditReportFormType = {
  [key: string]: string;
  credit_score: string;
  payment_history_percent: string;
  credit_utilization_percent: string;
  total_accounts: string;
  open_accounts: string;
  credit_age_months: string;
  hard_inquiries: string;
  public_records: string;
  collections: string;
  total_debt: string;
  revolving_debt: string;
  installment_debt: string;
  mortgage_debt: string;
  available_credit: string;
};

// Helper function to convert snake_case to Title Case
const toTitleCase = (str: string) =>
  str
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

export default function CreditReportModelPage() {
  const router = useRouter();
  const backendApiUrl = "http://34.9.145.33:8000";

  // Tab state
  const [tab, setTab] = useState<"predict" | "performance" | "update">(
    "predict"
  );

  // Form state
  const [predictForm, setPredictForm] = useState<CreditReportFormType>({
    credit_score: "",
    payment_history_percent: "",
    credit_utilization_percent: "",
    total_accounts: "",
    open_accounts: "",
    credit_age_months: "",
    hard_inquiries: "",
    public_records: "",
    collections: "",
    total_debt: "",
    revolving_debt: "",
    installment_debt: "",
    mortgage_debt: "",
    available_credit: "",
  });

  type Metrics = {
    precision: number;
    recall: number;
    "f1-score": number;
    support: number;
  };

  // Result states
  const [predictResult, setPredictResult] = useState<string | null>(null);
  const [perfResult, setPerfResult] = useState<string | JSX.Element | null>(
    null
  );
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
  const handlePredictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPredictForm({ ...predictForm, [e.target.name]: e.target.value });
  };

  const handlePredictSubmit = async () => {
    setPredictResult("Loading...");
    try {
      const response = await fetch(
        `${backendApiUrl}/model/credit_report/predict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            Object.fromEntries(
              Object.entries(predictForm).map(([k, v]) => [
                k,
                v === "" ? null : isNaN(Number(v)) ? v : Number(v),
              ])
            )
          ),
        }
      );
      const result = await response.json();
      setPredictResult(
        result.predicted_credit_rating
          ? `Predicted Credit Rating: ${result.predicted_credit_rating}`
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

  const handlePerfSubmit = async () => {
    setPerfResult("Loading...");
    try {
      const response = await fetch(`${backendApiUrl}/model/credit_report/performance`, {
        method: "POST",
      });
      const result = await response.json();
  
      if (result.classification_report) {
        const classificationReport = result.classification_report;
  
        setPerfResult(
          <div className="overflow-x-auto bg-white p-4 rounded shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Model Performance
            </h3>
            <table className="min-w-full table-auto text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Precision</th>
                  <th className="px-4 py-2 text-left">Recall</th>
                  <th className="px-4 py-2 text-left">F1-Score</th>
                  <th className="px-4 py-2 text-left">Support</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(classificationReport).map(([category, metrics]) => {
                  // Assert that metrics is of type Metrics
                  const typedMetrics = metrics as Metrics;
  
                  // Only render rows for non-summary categories
                  return category !== "accuracy" &&
                    category !== "macro avg" &&
                    category !== "weighted avg" ? (
                    <tr key={category} className="border-t">
                      <td className="px-4 py-2 font-medium">{category}</td>
                      <td className="px-4 py-2">{typedMetrics.precision}</td>
                      <td className="px-4 py-2">{typedMetrics.recall}</td>
                      <td className="px-4 py-2">{typedMetrics["f1-score"]}</td>
                      <td className="px-4 py-2">{typedMetrics.support}</td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
  
            {/* Optionally, display accuracy and averages */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-700">
                Overall Performance
              </h4>
              <ul className="list-disc pl-6 text-sm text-gray-600">
                <li>
                  <strong>Accuracy:</strong> {classificationReport.accuracy}
                </li>
                <li>
                  <strong>Macro Avg - Precision:</strong>{" "}
                  {classificationReport["macro avg"].precision}
                </li>
                <li>
                  <strong>Macro Avg - Recall:</strong>{" "}
                  {classificationReport["macro avg"].recall}
                </li>
                <li>
                  <strong>Macro Avg - F1-Score:</strong>{" "}
                  {classificationReport["macro avg"]["f1-score"]}
                </li>
                <li>
                  <strong>Weighted Avg - Precision:</strong>{" "}
                  {classificationReport["weighted avg"].precision}
                </li>
                <li>
                  <strong>Weighted Avg - Recall:</strong>{" "}
                  {classificationReport["weighted avg"].recall}
                </li>
                <li>
                  <strong>Weighted Avg - F1-Score:</strong>{" "}
                  {classificationReport["weighted avg"]["f1-score"]}
                </li>
              </ul>
            </div>
          </div>
        );
      } else {
        setPerfResult(JSON.stringify(result));
      }
    } catch (error) {
      if (error instanceof Error) {
        setPerfResult("Error: " + error.message);
      } else {
        setPerfResult("An unknown error occurred.");
      }
    }
  };

  const handleUpdateSubmit = async () => {
    setUpdateResult("Loading...");
    try {
      const response = await fetch(
        `${backendApiUrl}/model/credit_report/update`,
        {
          method: "POST",
        }
      );
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

  const commonButtonClasses =
    "flex-1 py-3 px-3 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out focus:outline-none";
  const activeTabClasses = `${commonButtonClasses} bg-white text-indigo-600 shadow-lg hover:shadow-xl hover:bg-indigo-50 transform hover:-translate-y-1 hover:scale-105 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-white`;
  const inactiveTabClasses = `${commonButtonClasses} bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`;
  const actionButtonClasses =
    "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150";
  const resultContainerClasses =
    "mt-6 p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 break-words shadow-inner";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
        Credit Report Model Manager
      </h1>

      {/* Tabs */}
      <div className="flex w-full max-w-lg mb-8 gap-2">
        {" "}
        {/* Increased max-w slightly */}
        <button
          className={`${
            tab === "predict" ? activeTabClasses : inactiveTabClasses
          }`}
          onClick={() => setTab("predict")}
        >
          Predict Credit Rating
        </button>
        <button
          className={`${
            tab === "performance" ? activeTabClasses : inactiveTabClasses
          }`}
          onClick={() => setTab("performance")}
        >
          Model Performance
        </button>
        <button
          className={`${
            tab === "update" ? activeTabClasses : inactiveTabClasses
          }`}
          onClick={() => setTab("update")}
        >
          Update Model
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-8">
        {" "}
        {/* Increased max-w, padding and shadow */}
        {tab === "predict" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-300">
              Predict Credit Rating
            </h2>
            <div className="space-y-5 mb-6">
              {/* MODIFIED LINE: Removed the problematic cast. 'field' will be inferred as string. */}
              {Object.keys(predictForm).map((field) => (
                <div key={field}>
                  <label
                    htmlFor={field}
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    {toTitleCase(field)}
                  </label>
                  <input
                    id={field}
                    name={field}
                    type="number"
                    step="any"
                    placeholder={toTitleCase(field)}
                    value={predictForm[field]} // This is fine: field is string, predictForm[string] is string
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
              <div className={resultContainerClasses}>{predictResult}</div>
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
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              Evaluate Model
            </button>
            {perfResult && <div className="mt-4">{perfResult}</div>}
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
              <div className={resultContainerClasses}>{updateResult}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
