"use client";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
type OverviewData = {
  customer_count: number;
  insight_count: number;
  summary: string;
};

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState<"counts" | "summary">("counts");
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isClient = localStorage.getItem("access") == "client";

    console.log(localStorage);
    if (!isLoggedIn) {
      router.push("/login");
    }

    if (!isClient) {
      alert("you are not client financial institution");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetch(`${backendApiUrl}/api/client/overview/`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load overview data:", err));
  }, [backendApiUrl]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Client Financial Overview</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "counts" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("counts")}
        >
          Counts
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "summary" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        {!data && <p className="text-gray-500">Loading...</p>}

        {data && activeTab === "counts" && (
          <div className="space-y-4 text-lg font-semibold text-gray-800">
            <p>
              Total Customers:{" "}
              <span className="text-blue-600">{data.customer_count}</span>
            </p>
            <p>
              Total Insights:{" "}
              <span className="text-blue-600">{data.insight_count}</span>
            </p>
          </div>
        )}

        {data && activeTab === "summary" && (
          <div className="prose max-w-none overflow-y-auto max-h-[600px] whitespace-pre-wrap text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.summary}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
