'use client';

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

//   const handleLogout = () => {
//     localStorage.removeItem("auth");
//     localStorage.removeItem("email");
//     localStorage.removeItem("access");
//     router.push("/login");
//   };

  // --- Handlers for tabs ---

  // 1. Predict Risk Level
  const handlePredictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPredictForm({ ...predictForm, [e.target.name]: e.target.value });
  };

  const handlePredictSubmit = async () => {
    setPredictResult("Loading...");
    try {
      const response = await fetch(`${backendApiUrl}/model/risk_level/testing`, {
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
        result.predicted_risk_level
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

  // --- UI ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 px-2">
      <h1 className="text-2xl font-bold text-green-700 mb-2 text-center">
        Risk Level Model Manager
      </h1>
      {/* <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4"
      >
        Sign Out
      </button> */}

      {/* Tabs */}
      <div className="flex w-full max-w-md mb-4">
        <button
          className={`flex-1 py-2 rounded-tl rounded-bl ${tab === "predict" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}
          onClick={() => setTab("predict")}
        >
          Predict Risk Level
        </button>
        <button
          className={`flex-1 py-2 ${tab === "performance" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}
          onClick={() => setTab("performance")}
        >
          Model Performance
        </button>
        <button
          className={`flex-1 py-2 rounded-tr rounded-br ${tab === "update" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}
          onClick={() => setTab("update")}
        >
          Update Model
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-md bg-white rounded shadow-md p-4">
        {tab === "predict" && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Predict Risk Level</h2>
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
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
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
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
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
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
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
