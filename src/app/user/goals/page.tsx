'use client';
import React from 'react';
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

interface AgentResponse {
  email: string;
  question_asked?: string;
  answer?: string;
  advice?: string;
  scenario_description?: string;
  analysis?: string;
}

// Response formatting helper functions
const formatReviewResponse = (text: string): React.JSX.Element => {
  return <p className="text-gray-700">{text}</p>;
};

const formatAdviceResponse = (text: string): React.JSX.Element => {
  // Parse headings, paragraphs and bullet points
  const sections = text.split('\n\n');
  
  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        if (section.trim().startsWith('*')) {
          // This is a bullet list
          const items = section.split('*').filter(item => item.trim());
          return (
            <ul key={i} className="list-disc pl-5 space-y-2">
              {items.map((item, j) => (
                <li key={j} className="text-gray-700">{item.trim()}</li>
              ))}
            </ul>
          );
        } else if (section.startsWith('Hi') || section.includes('Clarence')) {
          // Greeting section
          return <p key={i} className="text-gray-700 font-medium">{section}</p>;
        } else {
          // Regular paragraph
          return <p key={i} className="text-gray-700">{section}</p>;
        }
      })}
    </div>
  );
};

const formatScenarioResponse = (text: string): React.JSX.Element => {
  // Split the text by sections (marked by **)
  const parts = text.split(/\*\*(.*?)\*\*/);
  const elements: React.JSX.Element[] = [];
  
  // Process each part
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    
    if (i % 2 === 1) {
      // This is a heading (was between ** **)
      elements.push(
        <h3 key={`heading-${i}`} className="font-bold text-lg text-indigo-700 mt-4 mb-2">
          {part}
        </h3>
      );
    } else {
      // This is content
      const paragraphs = part.split('\n\n').filter(p => p.trim());
      
      paragraphs.forEach((paragraph, pIndex) => {
        if (paragraph.includes('*')) {
          // This might be a bullet list
          const listItems = paragraph
            .split(/\*\s+/)
            .filter(item => item.trim())
            .map((item, lIndex) => (
              <li key={`item-${i}-${pIndex}-${lIndex}`} className="ml-2 py-1">
                {item.trim()}
              </li>
            ));
          
          if (listItems.length) {
            elements.push(
              <ul key={`list-${i}-${pIndex}`} className="list-disc pl-5 py-2">
                {listItems}
              </ul>
            );
          }
        } else if (paragraph.trim()) {
          elements.push(
            <p key={`para-${i}-${pIndex}`} className="my-2 text-gray-700">
              {paragraph.trim()}
            </p>
          );
        }
      });
    }
  }
  
  return <div className="space-y-1">{elements}</div>;
};

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({});
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'review' | 'advice' | 'scenario'>('review');
  const [apiLoading, setApiLoading] = useState(false);

  const email = typeof window !== 'undefined' ? localStorage.getItem("email") || "" : "";

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/users/goals/${email}`);
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

  const handleAddGoal = async () => {
    if (!newGoal.goal_name || !newGoal.target_amount) {
      alert("Please fill in required fields");
      return;
    }

    try {
      await fetch("http://127.0.0.1:8000/users/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newGoal, customer_email: email }),
      });
      setNewGoal({});
      await fetchGoals();
    } catch (error) {
      console.error("Failed to add goal:", error);
      alert("Failed to add goal");
    }
  };

  const handleUpdateGoal = async (goal: Goal, index: number) => {
    try {
      await fetch(`http://127.0.0.1:8000/users/goals/${index + 1}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...goal, customer_email: email }),
      });
      setEditIndex(null);
      await fetchGoals();
    } catch (error) {
      console.error("Failed to update goal:", error);
      alert("Failed to update goal");
    }
  };

  const callGoalReview = async () => {
    setApiLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/users/goals/agent/review/${email}?user_question=${encodeURIComponent(userQuestion)}`);
      const data: AgentResponse = await res.json();
      setAgentResponse(data);
      setActiveTab('review');
    } catch (error) {
      console.error("Failed to get goal review:", error);
      alert("Failed to get goal review");
    } finally {
      setApiLoading(false);
    }
  };

  const callGoalAdvice = async () => {
    setApiLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/users/goals/agent/advice/${email}`);
      const data: AgentResponse = await res.json();
      setAgentResponse(data);
      setActiveTab('advice');
    } catch (error) {
      console.error("Failed to get goal advice:", error);
      alert("Failed to get goal advice");
    } finally {
      setApiLoading(false);
    }
  };

  const callGoalScenario = async () => {
    if (!scenarioDescription || scenarioDescription.length < 10) {
      alert("Please provide a more detailed scenario description (minimum 10 characters)");
      return;
    }
    
    setApiLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/users/goals/agent/scenario/${email}?scenario_description=${encodeURIComponent(scenarioDescription)}`);
      const data: AgentResponse = await res.json();
      setAgentResponse(data);
      setActiveTab('scenario');
    } catch (error) {
      console.error("Failed to analyze scenario:", error);
      alert("Failed to analyze scenario");
    } finally {
      setApiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-yellow-500";
    if (progress < 75) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Financial Goal Tracker</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Goals Management */}
        <div className="md:col-span-1 space-y-6">
          {/* ADD NEW GOAL FORM */}
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Goal</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g., New Car, Vacation"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  value={newGoal.goal_name || ''}
                  onChange={e => setNewGoal({ ...newGoal, goal_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Target Amount ($)</label>
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  value={newGoal.target_amount || ''}
                  onChange={e => setNewGoal({ ...newGoal, target_amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Current Amount ($)</label>
                <input
                  type="number"
                  placeholder="1000"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  value={newGoal.current_amount || ''}
                  onChange={e => setNewGoal({ ...newGoal, current_amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                <select
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  value={newGoal.priority || ''}
                  onChange={e => setNewGoal({ ...newGoal, priority: e.target.value })}
                >
                  <option value="">Select Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <button
                onClick={handleAddGoal}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              >
                Add Goal
              </button>
            </div>
          </div>

          {/* EXISTING GOALS LIST */}
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">My Goals</h2>
            {goals.length === 0 ? (
              <p className="text-gray-500 italic">No goals yet. Add one above to get started!</p>
            ) : (
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{goal.goal_name}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${goal.on_track ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {goal.on_track ? 'On Track' : 'Off Track'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-600 flex justify-between">
                        <span>Progress: {goal.progress_percent}%</span>
                        <span>
                          ${goal.current_amount} / ${goal.target_amount}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`${getProgressColor(goal.progress_percent)} h-2 rounded-full`}
                          style={{ width: `${goal.progress_percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                        <span>Priority: {goal.priority}</span>
                      </div>
                    </div>
                    {editIndex === index ? (
                      <div className="mt-3 space-y-2">
                        <input
                          className="w-full border p-1 rounded text-sm"
                          value={goal.goal_name}
                          onChange={e => {
                            const updated = [...goals];
                            updated[index].goal_name = e.target.value;
                            setGoals(updated);
                          }}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateGoal(goal, index)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditIndex(null)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditIndex(index)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit Goal
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Tools */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-800">
              Financial Intelligence Assistant
            </h2>
            
            {/* Tabs for different agent functions */}
            <div className="flex border-b mb-4">
              <button 
                onClick={() => setActiveTab('review')}
                className={`px-4 py-2 ${activeTab === 'review' 
                  ? 'border-b-2 border-indigo-500 text-indigo-700 font-medium' 
                  : 'text-gray-600'}`}
              >
                Goal Review
              </button>
              <button 
                onClick={() => setActiveTab('advice')}
                className={`px-4 py-2 ${activeTab === 'advice' 
                  ? 'border-b-2 border-indigo-500 text-indigo-700 font-medium' 
                  : 'text-gray-600'}`}
              >
                Get Advice
              </button>
              <button 
                onClick={() => setActiveTab('scenario')}
                className={`px-4 py-2 ${activeTab === 'scenario' 
                  ? 'border-b-2 border-indigo-500 text-indigo-700 font-medium' 
                  : 'text-gray-600'}`}
              >
                What-If Scenarios
              </button>
            </div>
            
            {/* Tab content */}
            <div className="mt-4">
              {activeTab === 'review' && (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Ask specific questions about your financial goals
                  </p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="How many goals are on track?"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      className="flex-1 p-2 border rounded focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    />
                    <button
                      onClick={callGoalReview}
                      disabled={apiLoading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition duration-200 flex items-center"
                    >
                      {apiLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      ) : null}
                      Review
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'advice' && (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Get personalized advice on how to optimize your goals
                  </p>
                  <button
                    onClick={callGoalAdvice}
                    disabled={apiLoading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition duration-200 flex items-center"
                  >
                    {apiLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    ) : null}
                    Get Financial Advice
                  </button>
                </div>
              )}
              
              {activeTab === 'scenario' && (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Explore how different scenarios might impact your financial goals
                  </p>
                  <textarea
                    placeholder="What if I want to buy a car? What if I increase my contribution by $100?"
                    value={scenarioDescription}
                    onChange={(e) => setScenarioDescription(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-300 focus:outline-none h-24"
                  />
                  <button
                    onClick={callGoalScenario}
                    disabled={apiLoading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition duration-200 flex items-center"
                  >
                    {apiLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    ) : null}
                    Simulate Scenario
                  </button>
                </div>
              )}
            </div>
            
            {/* Agent Response Section */}
            {agentResponse && (
              <div className="mt-6 bg-white p-5 rounded-lg shadow-inner">
                <h3 className="font-semibold text-lg mb-3 text-gray-800 border-b pb-2">
                  {activeTab === 'review' && 'Goal Review'}
                  {activeTab === 'advice' && 'Financial Advice'}
                  {activeTab === 'scenario' && 'Scenario Analysis'}
                </h3>
                
                <div className="prose max-w-none">
                  {activeTab === 'review' && agentResponse.answer && formatReviewResponse(agentResponse.answer)}
                  {activeTab === 'advice' && agentResponse.advice && formatAdviceResponse(agentResponse.advice)}
                  {activeTab === 'scenario' && agentResponse.analysis && formatScenarioResponse(agentResponse.analysis)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}