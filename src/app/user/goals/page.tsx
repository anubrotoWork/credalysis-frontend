'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Goal {
  goal_name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  target_date: string;
  required_monthly_contribution: number;
  actual_monthly_contribution: number;
  on_track: boolean;
  status: string;
  priority: string;
  last_updated: string;
}

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({});
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const email = typeof window !== 'undefined' ? localStorage.getItem("email") || "" : "";

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/users/goals/${email}`);
      const data = await res.json();
      setGoals(data.goals || []);
    } catch {
      alert("Failed to load goals.");
    } finally {
      setLoading(false);
    }
  }, [email]);
  
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isUser = localStorage.getItem("access") === "user";
  
    if (!isLoggedIn || !isUser) {
      alert("Access denied. Please login.");
      router.push("/login");
      return;
    }
  
    fetchGoals();
  }, [router, fetchGoals]);
  
  
  const handleAddGoal = () => {
    fetch("http://localhost:8000/users/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newGoal, customer_email: email }),
    })
      .then(res => res.json())
      .then(() => {
        setNewGoal({});
        fetchGoals();
      });
  };

  const handleUpdateGoal = (goal: Goal, index: number) => {
    fetch(`http://localhost:8000/users/goals/${index + 1}`, {  // assumes goal_id = index+1 for demo
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...goal, customer_email: email }),
    })
      .then(res => res.json())
      .then(() => {
        setEditIndex(null);
        fetchGoals();
      });
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Track My Goals</h1>

      {/* ADD NEW GOAL FORM */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Add New Goal</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Goal Name"
            className="border p-2 rounded"
            value={newGoal.goal_name || ''}
            onChange={e => setNewGoal({ ...newGoal, goal_name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Target Amount"
            className="border p-2 rounded"
            value={newGoal.target_amount || ''}
            onChange={e => setNewGoal({ ...newGoal, target_amount: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Current Amount"
            className="border p-2 rounded"
            value={newGoal.current_amount || ''}
            onChange={e => setNewGoal({ ...newGoal, current_amount: Number(e.target.value) })}
          />
          <button
            onClick={handleAddGoal}
            className="col-span-2 bg-blue-600 text-white py-2 px-4 rounded"
          >
            Add Goal
          </button>
        </div>
      </div>

      {/* GOAL TABLE */}
      <table className="min-w-full divide-y divide-gray-200 mb-10">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Goal</th>
            <th className="px-4 py-2 text-left">Target</th>
            <th className="px-4 py-2 text-left">Current</th>
            <th className="px-4 py-2 text-left">Progress</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {goals.map((goal, index) => (
            <tr key={index}>
              <td className="px-4 py-2">
                {editIndex === index ? (
                  <input
                    className="border p-1 rounded"
                    value={goal.goal_name}
                    onChange={e => {
                      const updated = [...goals];
                      updated[index].goal_name = e.target.value;
                      setGoals(updated);
                    }}
                  />
                ) : (
                  goal.goal_name
                )}
              </td>
              <td className="px-4 py-2">${goal.target_amount}</td>
              <td className="px-4 py-2">${goal.current_amount}</td>
              <td className="px-4 py-2">{goal.progress_percent}%</td>
              <td className="px-4 py-2">{goal.status}</td>
              <td className="px-4 py-2">
                {editIndex === index ? (
                  <button
                    onClick={() => handleUpdateGoal(goal, index)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => setEditIndex(index)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 