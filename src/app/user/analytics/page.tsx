//src/app/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { FinancialInsight, Loan } from '@/types';

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<'spending' | 'saving' | 'budget' | 'all'>('all');
  const router = useRouter();
  const backendApiUrl = "http://34.9.145.33:8000";

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isUser = localStorage.getItem("access") == "user";

    console.log(localStorage);
    if (!isLoggedIn) {
      router.push("/login");
    }

    if(!isUser) {
      alert("you are not user");
      router.push("/login");
    }
    
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      const insightsRes = await fetch(`${backendApiUrl}/insights/all`);
      const insightsJson = await insightsRes.json();
      
      const loansRes = await fetch(`${backendApiUrl}/customer_products`);
      
      setInsights(Array.isArray(insightsJson) ? insightsJson : []);
      setLoans(await loansRes.json());
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Behavioral Insights</h2>
        <select
          onChange={(e) => setFilter(e.target.value as 'spending' | 'saving' | 'budget' | 'all')}
          className="mb-4 p-2 border rounded"
        >
          <option value="all">All</option>
          <option value="spending">Spending</option>
          <option value="saving">Saving</option>
          <option value="budget">Budget</option>
        </select>

        {insights.map((i, idx) => {
          const show =
            filter === 'all' || 
            (filter === 'spending' && i.spending_insight) ||
            (filter === 'saving' && i.saving_insight) ||
            (filter === 'budget' && i.budget_insight);
          return show ? (
            <div key={idx} className="p-4 bg-white rounded shadow mb-2">
              {filter === 'all' || filter === 'spending' ? <p>{i.spending_insight}</p> : null}
              {filter === 'all' || filter === 'saving' ? <p>{i.saving_insight}</p> : null}
              {filter === 'all' || filter === 'budget' ? <p>{i.budget_insight}</p> : null}
            </div>
          ) : null;
        })}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Loan Products</h2>
        {loans.map((loan, idx) => (
          <div key={idx} className="p-4 bg-white rounded shadow mb-2">
            <p>Product ID: {loan.product_id}</p>
            <p>Balance: ${loan.balance}</p>
            <p>Status: {loan.status}</p>
            <button
              className="mt-2 text-blue-500 underline hover:text-blue-700"
              onClick={() => alert(JSON.stringify(loan, null, 2))}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
