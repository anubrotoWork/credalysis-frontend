'use client';

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

export default function CreditReportModelPage() {
  const router = useRouter();
  const backendApiUrl = "http://34.9.145.33:8000";

  // Tab state
  const [tab, setTab] = useState<"predict" | "performance" | "update">("predict");

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
    available_credit: ""
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

  // 1. Predict Credit Rating
  const handlePredictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPredictForm({ ...predictForm, [e.target.name]: e.target.value });
  };

  const handlePredictSubmit = async () => {
    setPredictResult("Loading...");
    try {
      const response = await fetch(`${backendApiUrl}/model/credit_report/predict`, {
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

  // 2. Model Performance
  const handlePerfSubmit = async () => {
    setPerfResult("Loading...");
    try {
      const response = await fetch(`${backendApiUrl}/model/credit_report/performance`, {
        method: "POST",
      });
      const result = await response.json();
      setPerfResult(
        result.classification_report
          ? <pre className="text-xs overflow-auto">{JSON.stringify(result.classification_report, null, 2)}</pre>
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
      const response = await fetch(`${backendApiUrl}/model/credit_report/update`, {
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

  // --- UI ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 px-2">
      <h1 className="text-2xl font-bold text-blue-700 mb-2 text-center">
        Credit Report Model Manager
      </h1>

      {/* Tabs */}
      <div className="flex w-full max-w-md mb-4">
        <button
          className={`flex-1 py-2 rounded-tl rounded-bl ${tab === "predict" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}
          onClick={() => setTab("predict")}
        >
          Predict Credit Rating
        </button>
        <button
          className={`flex-1 py-2 ${tab === "performance" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}
          onClick={() => setTab("performance")}
        >
          Model Performance
        </button>
        <button
          className={`flex-1 py-2 rounded-tr rounded-br ${tab === "update" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}
          onClick={() => setTab("update")}
        >
          Update Model
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-md bg-white rounded shadow-md p-4">
        {tab === "predict" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Predict Credit Rating</h2>
            <div className="grid grid-cols-1 gap-2">
              {Object.keys(predictForm).map((field) => (
                <input
                  key={field}
                  name={field}
                  type="number"
                  step="any"
                  placeholder={field.replace(/_/g, " ")}
                  value={predictForm[field]}
                  onChange={handlePredictChange}
                  className="border rounded px-2 py-1"
                />
              ))}
            </div>
            <button
              onClick={handlePredictSubmit}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              Predict
            </button>
            {predictResult && (
              <div className="mt-2 text-center">{predictResult}</div>
            )}
          </div>
        )}

        {tab === "performance" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Model Performance</h2>
            <button
              onClick={handlePerfSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              Evaluate Model
            </button>
            {perfResult && (
              <div className="mt-2">{perfResult}</div>
            )}
          </div>
        )}

        {tab === "update" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Update Model</h2>
            <button
              onClick={handleUpdateSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              Retrain Model from Database
            </button>
            {updateResult && (
              <div className="mt-2 text-center">{updateResult}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
