// src/app/client/model_manager/risk_level/page.tsx (or your chosen path)

"use client";

import React, { useState, useEffect, JSX, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertTriangle,
  ShieldAlert,
  BarChart,
  RefreshCcw,
} from "lucide-react";

// Form state type
type PredictFormType = {
  [key: string]: string; // Allows string indexing
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

// Type for classification report metrics (same as CreditReportModelPage)
type Metrics = {
  precision: number;
  recall: number;
  "f1-score": number;
  support: number;
};

// Type for the full classification report structure (same as CreditReportModelPage)
type ClassificationReport = {
  [category: string]: Metrics | number;
  accuracy: number;
  "macro avg": Metrics;
  "weighted avg": Metrics;
};

const toTitleCase = (str: string) =>
  str
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  // Set Content-Type to application/json if:
  // 1. A body exists
  // 2. No Content-Type is already set by the caller
  // 3. The body is a string (implying it's likely a JSON.stringify-ed object)
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.append("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.clear();
      if (window.location.pathname !== "/login")
        window.location.href = "/login?sessionExpired=true";
    }
    throw new Error("Session expired or unauthorized. Please log in again.");
  }
  return response;
}

export default function RiskLevelModelManagerPage() {
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const [tab, setTab] = useState<"predict" | "performance" | "update">(
    "predict"
  );

  const initialFormState: PredictFormType = {
    credit_risk_score: "",
    fraud_risk_score: "",
    default_risk_score: "",
    overall_risk_score: "",
    credit_score: "",
    credit_utilization_percent: "",
    debt_to_income_ratio: "",
    products_count: "",
    transaction_frequency: "",
    average_transaction_amount: "",
  };
  const [predictForm, setPredictForm] =
    useState<PredictFormType>(initialFormState);

  const [predictResult, setPredictResult] = useState<string | null>(null);
  const [perfResult, setPerfResult] = useState<JSX.Element | string | null>(
    null
  );
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  const [loadingState, setLoadingState] = useState({
    predict: false,
    performance: false,
    update: false,
  });
  const [errorState, setErrorState] = useState({
    predict: null as string | null,
    performance: null as string | null,
    update: null as string | null,
  });

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "client") {
      alert("You do not have permission to access this model management page.");
      localStorage.clear();
      router.push("/login");
      return;
    }
  }, [router]);

  const handlePredictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPredictForm({ ...predictForm, [e.target.name]: e.target.value });
  };

  const isErrorWithMessage = (error: unknown): error is { message: string } => {
    return (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
    );
  };

  const handlePredictSubmit = useCallback(
    async (event?: FormEvent) => {
      if (event) event.preventDefault();
      if (!backendApiUrl) {
        setErrorState((prev) => ({
          ...prev,
          predict: "Backend API URL not configured.",
        }));
        return;
      }

      setLoadingState((prev) => ({ ...prev, predict: true }));
      setPredictResult(null);
      setErrorState((prev) => ({ ...prev, predict: null }));

      try {
        const payload = Object.fromEntries(
          Object.entries(predictForm).map(([k, v]) => [
            k,
            v === "" || v === null ? null : isNaN(Number(v)) ? v : Number(v),
          ])
        );
        const response = await authFetch(
          `${backendApiUrl}/model/risk_level/output`, // Kept /testing endpoint
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.detail ||
              result.error ||
              `HTTP ${response.status}: Failed to get prediction`
          );
        }
        setPredictResult(
          result.predicted_risk_level // Changed from predicted_credit_rating
            ? `Predicted Risk Level: ${result.predicted_risk_level}`
            : `Prediction successful. Response: ${JSON.stringify(result)}`
        );
      } catch (error: unknown) {
        console.error("Risk level prediction error:", error);
        if (isErrorWithMessage(error)) {
          setErrorState((prev) => ({ ...prev, predict: error.message }));
        } else if (typeof error === "string") {
          setErrorState((prev) => ({ ...prev, predict: error }));
        } else {
          setErrorState((prev) => ({
            ...prev,
            predict: "An unknown error occurred during prediction.",
          }));
        }
      } finally {
        setLoadingState((prev) => ({ ...prev, predict: false }));
      }
    },
    [backendApiUrl, predictForm]
  );

  const handlePerfSubmit = useCallback(async () => {
    if (!backendApiUrl) {
      setErrorState((prev) => ({
        ...prev,
        performance: "Backend API URL not configured.",
      }));
      return;
    }

    setLoadingState((prev) => ({ ...prev, performance: true }));
    setPerfResult(null);
    setErrorState((prev) => ({ ...prev, performance: null }));

    try {
      const response = await authFetch(
        `${backendApiUrl}/model/risk_level/performance`,
        { method: "POST" }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.error ||
            `HTTP ${response.status}: Failed to get performance metrics`
        );
      }

      if (result.classification_report) {
        const report = result.classification_report as ClassificationReport;
        // Reusing the same table rendering logic as CreditReportModelPage
        setPerfResult(
          <div className="overflow-x-auto bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
              Risk Level Model Performance
            </h3>
            <table className="min-w-full table-auto text-xs sm:text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "Category",
                    "Precision",
                    "Recall",
                    "F1-Score",
                    "Support",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 sm:px-4 sm:py-2 text-left font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(report)
                  .filter(
                    ([category]) =>
                      !["accuracy", "macro avg", "weighted avg"].includes(
                        category.toLowerCase()
                      )
                  )
                  .map(([category, metrics]) => {
                    const typedMetrics = metrics as Metrics;
                    return (
                      <tr key={category} className="hover:bg-gray-50">
                        <td className="px-3 py-2 sm:px-4 sm:py-2 font-medium">
                          {toTitleCase(category)}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-2">
                          {typedMetrics.precision?.toFixed(3) || "N/A"}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-2">
                          {typedMetrics.recall?.toFixed(3) || "N/A"}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-2">
                          {typedMetrics["f1-score"]?.toFixed(3) || "N/A"}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-2">
                          {typedMetrics.support}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-md sm:text-lg font-semibold text-gray-800 mb-2">
                Overall Summary
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-600">
                <li>
                  <strong>Accuracy:</strong>{" "}
                  {report.accuracy?.toFixed(3) || "N/A"}
                </li>
                {(["macro avg", "weighted avg"] as const).map((avgType) => {
                  const avgMetrics = report[avgType];
                  if (
                    avgMetrics &&
                    typeof avgMetrics === "object" &&
                    "precision" in avgMetrics
                  ) {
                    return (
                      <React.Fragment key={avgType}>
                        <li>
                          <strong>{toTitleCase(avgType)} - Precision:</strong>{" "}
                          {(avgMetrics as Metrics).precision?.toFixed(3) ||
                            "N/A"}
                        </li>
                        <li>
                          <strong>{toTitleCase(avgType)} - Recall:</strong>{" "}
                          {(avgMetrics as Metrics).recall?.toFixed(3) || "N/A"}
                        </li>
                        <li>
                          <strong>{toTitleCase(avgType)} - F1-Score:</strong>{" "}
                          {(avgMetrics as Metrics)["f1-score"]?.toFixed(3) ||
                            "N/A"}
                        </li>
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          </div>
        );
      } else {
        setPerfResult(`Performance data received: ${JSON.stringify(result)}`);
      }
    } catch (error: unknown) {
      console.error("Risk level performance evaluation error:", error);
      if (isErrorWithMessage(error)) {
        setErrorState((prev) => ({ ...prev, performance: error.message }));
      } else if (typeof error === "string") {
        setErrorState((prev) => ({ ...prev, performance: error }));
      } else {
        setErrorState((prev) => ({
          ...prev,
          performance:
            "An unknown error occurred during performance evaluation.",
        }));
      }
    } finally {
      setLoadingState((prev) => ({ ...prev, performance: false }));
    }
  }, [backendApiUrl]);

  const handleUpdateSubmit = useCallback(async () => {
    if (!backendApiUrl) {
      setErrorState((prev) => ({
        ...prev,
        update: "Backend API URL not configured.",
      }));
      return;
    }

    setLoadingState((prev) => ({ ...prev, update: true }));
    setUpdateResult(null);
    setErrorState((prev) => ({ ...prev, update: null }));

    try {
      const response = await authFetch(
        `${backendApiUrl}/model/risk_level/update`,
        { method: "POST" }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.error ||
            `HTTP ${response.status}: Failed to update model`
        );
      }
      setUpdateResult(
        result.message ||
          `Model update process initiated. Response: ${JSON.stringify(result)}`
      );
    } catch (error: unknown) {
      console.error("Risk level model update error:", error);
      if (isErrorWithMessage(error)) {
        setErrorState((prev) => ({ ...prev, update: error.message }));
      } else if (typeof error === "string") {
        setErrorState((prev) => ({ ...prev, update: error }));
      } else {
        setErrorState((prev) => ({
          ...prev,
          update: "An unknown error occurred during model update.",
        }));
      }
    } finally {
      setLoadingState((prev) => ({ ...prev, update: false }));
    }
  }, [backendApiUrl]);

  // --- UI Styling Constants (copied and adjusted if needed) ---
  const commonButtonClasses =
    "flex-1 py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white";
  const activeTabClasses = `${commonButtonClasses} bg-white text-indigo-700 shadow-lg transform scale-105 focus:ring-indigo-500`;
  const inactiveTabClasses = `${commonButtonClasses} bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-400`;

  const actionButtonClasses =
    "w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-60";
  const resultContainerClasses =
    "mt-6 p-4 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700 break-words shadow-inner";
  const errorContainerClasses =
    "mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-xs rounded-md";

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-gray-100 to-indigo-100 px-4 py-10 sm:py-16">
      <header className="mb-8 sm:mb-12 text-center">
        <ShieldAlert className="w-16 h-16 text-indigo-600 mx-auto mb-4" />{" "}
        {/* Changed Icon */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
          Risk Level Model Interface
        </h1>
        <p className="text-sm sm:text-md text-gray-500 mt-2">
          Predict risk levels, evaluate performance, and manage model updates.
        </p>
      </header>

      <div className="flex w-full max-w-xl mb-8 gap-2 p-1.5 bg-indigo-600 rounded-xl shadow-md">
        {(["predict", "performance", "update"] as const).map((tabName) => (
          <button
            key={tabName}
            className={`${
              tab === tabName ? activeTabClasses : inactiveTabClasses
            }`}
            onClick={() => setTab(tabName)}
          >
            {toTitleCase(tabName.replace("_", " "))}
          </button>
        ))}
      </div>

      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl p-6 sm:p-8">
        {tab === "predict" && (
          <form onSubmit={handlePredictSubmit}>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
              <ShieldAlert className="inline-block mr-2 w-6 h-6 text-indigo-500" />{" "}
              {/* Changed Icon */}
              Predict Risk Level
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 mb-6">
              {Object.keys(predictForm).map((field) => (
                <div key={field}>
                  <label
                    htmlFor={field}
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    {toTitleCase(field)}
                  </label>
                  <input
                    id={field}
                    name={field}
                    type="number"
                    step="any"
                    placeholder="Enter value"
                    value={predictForm[field as keyof PredictFormType]}
                    onChange={handlePredictChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={loadingState.predict}
              className={actionButtonClasses}
            >
              {loadingState.predict ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              {loadingState.predict
                ? "Predicting..."
                : "Get Risk Level Prediction"}
            </button>
            {errorState.predict && (
              <div className={errorContainerClasses}>
                <AlertTriangle className="inline w-4 h-4 mr-1" />{" "}
                {errorState.predict}
              </div>
            )}
            {predictResult && !errorState.predict && (
              <div className={resultContainerClasses}>{predictResult}</div>
            )}
          </form>
        )}

        {tab === "performance" && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
              <BarChart className="inline-block mr-2 w-6 h-6 text-indigo-500" />
              Risk Level Model Performance
            </h2>
            <button
              onClick={handlePerfSubmit}
              disabled={loadingState.performance}
              className={`${actionButtonClasses} mb-4`}
            >
              {loadingState.performance ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              {loadingState.performance
                ? "Evaluating..."
                : "Evaluate Model Performance"}
            </button>
            {errorState.performance && (
              <div className={errorContainerClasses}>
                <AlertTriangle className="inline w-4 h-4 mr-1" />{" "}
                {errorState.performance}
              </div>
            )}
            {perfResult && !errorState.performance && (
              <div className="mt-4">{perfResult}</div>
            )}
          </div>
        )}

        {tab === "update" && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
              <RefreshCcw className="inline-block mr-2 w-6 h-6 text-indigo-500" />
              Update & Retrain Risk Level Model
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This action will trigger the risk level model retraining process
              using the latest data. This process may take some time.
            </p>
            <button
              onClick={handleUpdateSubmit}
              disabled={loadingState.update}
              className={actionButtonClasses}
            >
              {loadingState.update ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              {loadingState.update
                ? "Updating..."
                : "Initiate Model Retraining"}
            </button>
            {errorState.update && (
              <div className={errorContainerClasses}>
                <AlertTriangle className="inline w-4 h-4 mr-1" />{" "}
                {errorState.update}
              </div>
            )}
            {updateResult && !errorState.update && (
              <div className={resultContainerClasses}>{updateResult}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
