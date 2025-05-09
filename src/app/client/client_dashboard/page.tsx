'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { RiskAssessment, FinancialGoal } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [riskData, setRiskData] = useState<RiskAssessment[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isClient = localStorage.getItem("access") == "client";

    console.log(localStorage);
    if (!isLoggedIn) {
      router.push("/login");
    }

    if(!isClient) {
      alert("you are not client financial institution");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      const resRisk = await fetch('http://34.55.216.204:8000/risk_assessments');
      const resGoals = await fetch('http://34.55.216.204:8000/financial_goals');
      setRiskData(await resRisk.json());
      setGoals(await resGoals.json());
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Risk Score Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={riskData}>
            <XAxis dataKey="customer_id" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="overall_risk_score" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Financial Goals</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Goal</th>
                <th className="py-2 px-4 border-b">Progress</th>
                <th className="py-2 px-4 border-b">Target Date</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-4 border-b">{goal.goal_name}</td>
                  <td className="py-2 px-4 border-b w-1/2">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-500 h-4 rounded-full"
                        style={{ width: `${goal.progress_percent}%` }}
                      ></div>
                    </div>
                    <span className="text-sm ml-2">{goal.progress_percent}%</span>
                  </td>
                  <td className="py-2 px-4 border-b">{goal.target_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
