"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type Goal = {
  goal_id: string | null;
  customer_id: string;
  goal_type: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  start_date: string | null;
  target_date: string;
  required_monthly_contribution: number;
  actual_monthly_contribution: number;
  on_track: number;
  status: string;
  priority: string;
  last_updated: string;
};

type Product = {
  customer_product_id: string;
  customer_id: string;
  product_id: string;
  balance: number;
  credit_limit: number;
  start_date: string;
  end_date: string | null;
  status: string;
  payment_amount: number;
  payment_frequency: string | null;
  interest_rate: number;
  annual_fee: number;
};

type LifecycleResponse = {
  goals: Goal[];
  products: Product[];
  lifecycle: string;
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

export default function LifecyclePage() {
  const [data, setData] = useState<LifecycleResponse | null>(null);
  const [activeTab, setActiveTab] = useState<
    "goals" | "products" | "lifecycle"
  >("lifecycle");
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isUser = localStorage.getItem("access") === "user";
    const email = localStorage.getItem("email");

    if (!isLoggedIn || !isUser || !email) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/lifecycle/?email=${email}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error fetching lifecycle data:", err));
  }, [router]);

  if (!data) return <div className="p-4">Loading lifecycle data...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Lifecycle Overview</h1>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "goals" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("goals")}
        >
          Goals
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "products" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "lifecycle" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("lifecycle")}
        >
          Lifecycle Analysis
        </button>
      </div>

      {activeTab === "goals" && (
        <div className="space-y-4">
          {data.goals.map((goal) => (
            <div
              key={goal.goal_id || goal.goal_name}
              className="p-4 border rounded shadow"
            >
              <h2 className="text-xl font-semibold">{goal.goal_name}</h2>
              <p>Type: {goal.goal_type}</p>
              <p>
                Status: {goal.status} ({goal.priority})
              </p>
              <p>Progress: {goal.progress_percent}%</p>
              <p>Target Amount: ${goal.target_amount.toFixed(2)}</p>
              <p>Current Amount: ${goal.current_amount.toFixed(2)}</p>
              <p>
                Required Monthly Contribution: $
                {goal.required_monthly_contribution.toFixed(2)}
              </p>
              <p>
                Actual Monthly Contribution: $
                {goal.actual_monthly_contribution.toFixed(2)}
              </p>
              <p>Target Date: {goal.target_date}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          {data.products.map((product) => (
            <div
              key={product.customer_product_id}
              className="p-4 border rounded shadow"
            >
              <p>Product ID: {product.product_id}</p>
              <p>Status: {product.status}</p>
              <p>Balance: ${product.balance.toFixed(2)}</p>
              <p>Credit Limit: ${product.credit_limit.toFixed(2)}</p>
              <p>Start Date: {product.start_date}</p>
              <p>End Date: {product.end_date || "N/A"}</p>
              <p>
                Payment: ${product.payment_amount.toFixed(2)}{" "}
                {product.payment_frequency || ""}
              </p>
              <p>Interest Rate: {product.interest_rate}%</p>
              <p>Annual Fee: ${product.annual_fee}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "lifecycle" && (
        <div className="prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {data.lifecycle}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
