// src/app/user/goals/page.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// authFetch function (keep as is or import from lib)
async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  // Corrected Content-Type logic for JSON body
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    // If options.body is a string, it cannot be FormData.
    // The instanceof check was redundant here and caused a type error.
    try {
      JSON.parse(options.body); // Check if body is valid JSON string
      headers.append("Content-Type", "application/json");
    } catch (_e) {
      // Changed 'e' to '_e' as it's not used (Fix for ESLint error)
      // Not a JSON string, do not set Content-Type: application/json
      console.warn(
        `authFetch: Body provided but not valid JSON. Content-Type not set to application/json. ${_e}`
      );
    }
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("email");
      localStorage.removeItem("access");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }
  return response;
}

interface Goal {
  goal_id: string;
  goal_name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number | null;
  target_date: string;
  start_date?: string; // Added start_date as it's used in handleAddGoal payload
  required_monthly_contribution: number | null;
  actual_monthly_contribution: number | null;
  on_track: boolean;
  status: string;
  priority: string;
  last_updated: string;
  customer_id?: string;
}

interface AgentResponse {
  email?: string;
  question_asked?: string;
  answer?: string;
  advice?: string;
  scenario_description?: string;
  analysis?: string;
}

// Removed unused 'formatResponse' function (Fix for ESLint error)
// const formatResponse = (text: string | undefined): React.JSX.Element =>
//   text ? (
//     <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
//   ) : (
//     <></>
//   );

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [newGoal, setNewGoal] = useState<
    Partial<
      Omit<
        Goal,
        "goal_id" | "progress_percent" | "last_updated" | "on_track" | "status"
      >
    >
  >({
    goal_type: "General",
    priority: "Medium",
    current_amount: 0,
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editGoal, setEditGoal] = useState<Partial<Goal>>({});

  const [userQuestion, setUserQuestion] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"review" | "advice" | "scenario">(
    "review"
  );

  const [crudApiLoading, setCrudApiLoading] = useState(false);
  const [agentApiLoading, setAgentApiLoading] = useState(false);

  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "user") {
      alert("You do not have permission to access this page.");
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchGoals = useCallback(async () => {
    if (!backendApiUrl) {
      alert("API URL not configured.");
      setLoadingGoals(false);
      return;
    }
    setLoadingGoals(true);
    try {
      const res = await authFetch(`${backendApiUrl}/users/my-goals`);
      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ detail: "Failed to fetch goals" }));
        throw new Error(errData.detail);
      }
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error("Fetch goals error:", error);
      alert(
        `Failed to load goals: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setGoals([]);
    } finally {
      setLoadingGoals(false);
    }
  }, [backendApiUrl]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken && backendApiUrl) {
      fetchGoals();
    }
  }, [fetchGoals, backendApiUrl]);

  const handleAddGoal = async () => {
    if (!newGoal.goal_name || !newGoal.target_amount || !newGoal.target_date) {
      alert("Goal Name, Target Amount, and Target Date are required.");
      return;
    }
    if (!backendApiUrl) {
      alert("API URL not configured.");
      return;
    }
    setCrudApiLoading(true);

    const payload = {
      goal_name: newGoal.goal_name,
      goal_type: newGoal.goal_type || "General",
      target_amount: Number(newGoal.target_amount),
      current_amount: Number(newGoal.current_amount || 0),
      target_date: newGoal.target_date,
      priority: newGoal.priority || "Medium",
      // start_date is now part of Goal interface, so newGoal.start_date is valid
      ...(newGoal.start_date && { start_date: newGoal.start_date }),
      ...(newGoal.required_monthly_contribution && {
        required_monthly_contribution: Number(
          newGoal.required_monthly_contribution
        ),
      }),
      ...(newGoal.actual_monthly_contribution && {
        actual_monthly_contribution: Number(
          newGoal.actual_monthly_contribution
        ),
      }),
      // Removed on_track and status from payload as they are Omitted from newGoal type
      // and are typically backend-calculated fields for new goals.
      // ...(newGoal.on_track !== undefined && { on_track: newGoal.on_track }),
      // ...(newGoal.status && { status: newGoal.status }),
    };

    try {
      const res = await authFetch(`${backendApiUrl}/users/my-goals`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: "Failed to add goal" }));
        throw new Error(errorData.detail);
      }
      setNewGoal({
        goal_type: "General",
        priority: "Medium",
        current_amount: 0,
      });
      await fetchGoals();
    } catch (error) {
      console.error("Failed to add goal:", error);
      alert(
        `Failed to add goal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCrudApiLoading(false);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditIndex(goals.findIndex((g) => g.goal_id === goal.goal_id));
    setEditGoal({ ...goal });
  };

  const handleUpdateGoal = async () => {
    if (editIndex === null || !editGoal.goal_id || !editGoal.goal_name) {
      alert("Goal ID or name is missing for update.");
      return;
    }
    if (!backendApiUrl) {
      alert("API URL not configured.");
      return;
    }
    setCrudApiLoading(true);

    // Prefixed unused destructured variables with '_' (Fix for ESLint errors)
    const {
      goal_id,
      // customer_id: _customer_id,
      // last_updated: _last_updated,
      // progress_percent: _progress_percent,
      ...updatePayload
    } = editGoal;

    try {
      const res = await authFetch(
        `${backendApiUrl}/users/my-goals/${goal_id}`,
        {
          method: "PUT",
          body: JSON.stringify(updatePayload),
        }
      );
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: "Failed to update goal" }));
        throw new Error(errorData.detail);
      }
      setEditIndex(null);
      setEditGoal({});
      await fetchGoals();
    } catch (error) {
      console.error("Failed to update goal:", error);
      alert(
        `Failed to update goal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCrudApiLoading(false);
    }
  };

  const handleDeleteGoal = async (goalIdToDelete: string) => {
    if (!window.confirm("Are you sure?")) return;
    if (!backendApiUrl) {
      alert("API URL not configured.");
      return;
    }
    setCrudApiLoading(true);
    try {
      const res = await authFetch(
        `${backendApiUrl}/users/my-goals/${goalIdToDelete}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok && res.status !== 204) {
        const errorData = await res
          .json()
          .catch(() => ({ detail: "Failed to delete goal" }));
        throw new Error(errorData.detail);
      }
      await fetchGoals();
    } catch (error) {
      console.error("Failed to delete goal:", error);
      alert(
        `Failed to delete goal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCrudApiLoading(false);
    }
  };

  const callAgentApi = useCallback(
    async (agentType: "review" | "advice" | "scenario") => {
      if (!backendApiUrl) {
        alert("API URL not configured.");
        return;
      }
      setAgentApiLoading(true);
      setAgentResponse(null);
      // setActiveTab is handled by the button click itself before calling this

      let url = "";
      const queryParams = new URLSearchParams();
      switch (agentType) {
        case "review":
          url = `${backendApiUrl}/users/my-goals/agent/review`;
          if (userQuestion.trim())
            queryParams.append("user_question", userQuestion.trim());
          break;
        case "advice":
          url = `${backendApiUrl}/users/my-goals/agent/advice`;
          break;
        case "scenario":
          if (!scenarioDescription || scenarioDescription.trim().length < 10) {
            alert("Scenario description (min 10 characters).");
            setAgentApiLoading(false);
            return;
          }
          url = `${backendApiUrl}/users/my-goals/agent/scenario`;
          queryParams.append(
            "scenario_description",
            scenarioDescription.trim()
          );
          break;
        default:
          setAgentApiLoading(false);
          return;
      }
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      try {
        const res = await authFetch(url);
        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ detail: `Failed to call ${agentType} agent` }));
          throw new Error(errorData.detail);
        }
        const data: AgentResponse = await res.json();
        setAgentResponse(data);
      } catch (error) {
        console.error(`Failed to get ${agentType}:`, error);
        alert(
          `Failed to get ${agentType}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setAgentResponse({
          analysis: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      } finally {
        setAgentApiLoading(false);
      }
    },
    [backendApiUrl, userQuestion, scenarioDescription]
  );

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Conditional rendering for initial loading state
  if (loadingGoals && goals.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-gray-600">Loading your financial goals...</p>
      </div>
    );
  }

  // getProgressColor function is fine
  const getProgressColor = (progress: number | null | undefined): string => {
    const p = progress || 0;
    if (p < 25) return "bg-red-500";
    if (p < 50) return "bg-yellow-500";
    if (p < 75) return "bg-blue-500";
    return "bg-green-500";
  };

  const simplifiedFormatResponse = (
    text: string | undefined
  ): React.JSX.Element =>
    text ? (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    ) : (
      <></>
    );
  // Note: The original simplifiedFormatResponse used <pre>. Switched to ReactMarkdown
  // as it's likely intended for markdown content and was used in the (now removed) formatResponse.
  // If pre-formatted text is desired, <pre className="whitespace-pre-wrap text-sm">{text}</pre> is fine.
  // The provided code had <pre> but the issue comment suggested markdown. This uses markdown.

  // JSX return starts here
  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">
            Financial Goal Tracker
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column: Goals Management */}
          <div className="md:col-span-1 space-y-6">
            {/* ADD NEW GOAL FORM */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-indigo-700">
                Add New Goal
              </h2>
              <div className="space-y-3">
                {/* Goal Name */}
                <div>
                  <label
                    htmlFor="goalNameAdd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Goal Name
                  </label>
                  <input
                    id="goalNameAdd"
                    type="text"
                    placeholder="e.g., Vacation"
                    className="goal-input"
                    value={newGoal.goal_name || ""}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, goal_name: e.target.value })
                    }
                  />
                </div>
                {/* Target Amount */}
                <div>
                  <label
                    htmlFor="targetAmountAdd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Target Amount ($)
                  </label>
                  <input
                    id="targetAmountAdd"
                    type="number"
                    placeholder="5000"
                    className="goal-input"
                    value={newGoal.target_amount || ""}
                    onChange={(e) =>
                      setNewGoal({
                        ...newGoal,
                        target_amount: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                {/* Current Amount */}
                <div>
                  <label
                    htmlFor="currentAmountAdd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Amount ($)
                  </label>
                  <input
                    id="currentAmountAdd"
                    type="number"
                    placeholder="1000"
                    className="goal-input"
                    value={newGoal.current_amount || ""}
                    onChange={(e) =>
                      setNewGoal({
                        ...newGoal,
                        current_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                {/* Target Date */}
                <div>
                  <label
                    htmlFor="targetDateAdd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Target Date
                  </label>
                  <input
                    id="targetDateAdd"
                    type="date"
                    title="Target Date"
                    className="goal-input"
                    value={newGoal.target_date || ""}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, target_date: e.target.value })
                    }
                  />
                </div>
                {/* Start Date (Optional) - Added form field based on Goal interface update */}
                <div>
                  <label
                    htmlFor="startDateAdd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date (Optional)
                  </label>
                  <input
                    id="startDateAdd"
                    type="date"
                    title="Start Date"
                    className="goal-input"
                    value={newGoal.start_date || ""}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, start_date: e.target.value })
                    }
                  />
                </div>
                {/* Priority */}
                <div>
                  <label
                    htmlFor="priorityAdd"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Priority
                  </label>
                  <select
                    id="priorityAdd"
                    className="goal-input"
                    value={newGoal.priority || "Medium"}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, priority: e.target.value })
                    }
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <button
                  onClick={handleAddGoal}
                  disabled={crudApiLoading}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {crudApiLoading ? "Adding..." : "Add Goal"}
                </button>
              </div>
            </div>

            {/* EXISTING GOALS LIST */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-indigo-700">
                My Goals
              </h2>
              {loadingGoals && goals.length === 0 && (
                <p className="text-gray-600">Loading goals...</p>
              )}
              {!loadingGoals && goals.length === 0 && (
                <p className="text-gray-600 italic">
                  No goals yet! Add one to get started.
                </p>
              )}

              {goals.length > 0 && (
                <div className="space-y-4 max-h-[30rem] overflow-y-auto custom-scrollbar pr-2">
                  {" "}
                  {/* Added max-height and overflow */}
                  {goals.map((goal, index) => (
                    <div
                      key={goal.goal_id}
                      className="bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {goal.goal_name}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            goal.on_track
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {goal.on_track ? "On Track" : "Off Track"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <span>
                          Progress:{" "}
                          {goal.progress_percent
                            ? goal.progress_percent.toFixed(0)
                            : 0}
                          %
                        </span>
                        <span className="float-right">
                          ${goal.current_amount.toLocaleString()} / $
                          {goal.target_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`${getProgressColor(
                            goal.progress_percent
                          )} h-2.5 rounded-full transition-all duration-500 ease-out`}
                          style={{ width: `${goal.progress_percent || 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                        <span>
                          Target:{" "}
                          {goal.target_date
                            ? new Date(
                                goal.target_date.replace(/-/g, "/") // Robust date parsing
                              ).toLocaleDateString()
                            : "-"}
                        </span>{" "}
                        {goal.start_date && (
                          <span>
                            Start:{" "}
                            {new Date(
                              goal.start_date.replace(/-/g, "/")
                            ).toLocaleDateString()}
                          </span>
                        )}
                        <span>Priority: {goal.priority}</span>
                      </div>

                      {editIndex === index ? (
                        <div className="mt-4 space-y-2 border-t pt-3">
                          <input
                            value={editGoal.goal_name || ""}
                            onChange={(e) =>
                              setEditGoal({
                                ...editGoal,
                                goal_name: e.target.value,
                              })
                            }
                            placeholder="Goal Name"
                            className="goal-input"
                          />
                          <input
                            type="number"
                            value={editGoal.target_amount || ""}
                            onChange={(e) =>
                              setEditGoal({
                                ...editGoal,
                                target_amount:
                                  parseFloat(e.target.value) || undefined,
                              })
                            }
                            placeholder="Target Amount"
                            className="goal-input"
                          />
                          <input
                            type="number"
                            value={editGoal.current_amount || ""}
                            onChange={(e) =>
                              setEditGoal({
                                ...editGoal,
                                current_amount: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Current Amount"
                            className="goal-input"
                          />
                          <input
                            type="date"
                            value={editGoal.target_date || ""}
                            onChange={(e) =>
                              setEditGoal({
                                ...editGoal,
                                target_date: e.target.value,
                              })
                            }
                            placeholder="Target Date"
                            className="goal-input"
                          />
                          {/* Edit Start Date Field */}
                          <input
                            type="date"
                            value={editGoal.start_date || ""}
                            onChange={(e) =>
                              setEditGoal({
                                ...editGoal,
                                start_date: e.target.value,
                              })
                            }
                            placeholder="Start Date"
                            className="goal-input"
                            title="Start Date"
                          />
                          <select
                            value={editGoal.priority || ""}
                            onChange={(e) =>
                              setEditGoal({
                                ...editGoal,
                                priority: e.target.value,
                              })
                            }
                            className="goal-input"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleUpdateGoal}
                              disabled={crudApiLoading}
                              className="flex-1 btn-success disabled:opacity-50"
                            >
                              {crudApiLoading && editIndex === index
                                ? "Saving..."
                                : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditIndex(null);
                                setEditGoal({});
                              }}
                              className="flex-1 btn-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEditGoal(goal)}
                            className="flex-1 btn-primary-outline text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.goal_id)}
                            disabled={crudApiLoading}
                            className="flex-1 btn-danger-outline text-sm disabled:opacity-50"
                          >
                            {crudApiLoading ? "..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Agent Assistant */}
          {/* Right Column: Agent Assistant */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-indigo-700">
                AI Goal Assistant
              </h2>
              <div className="flex space-x-2 mb-4 border-b border-gray-200 pb-3">
                {(["review", "advice", "scenario"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50"
                    }`}
                    onClick={() => {
                      setActiveTab(tab);
                      setAgentResponse(null); // Clear previous response when switching tabs
                      // Removed the automatic callAgentApi for the 'advice' tab here
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === "review" && (
                <div>
                  <label
                    htmlFor="userQuestionInput"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Ask a question about your goals:
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="userQuestionInput"
                      type="text"
                      className="flex-grow goal-input"
                      placeholder="e.g., Am I on track for my retirement?"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          callAgentApi("review");
                        }
                      }}
                    />
                    <button
                      onClick={() => callAgentApi("review")}
                      disabled={agentApiLoading || !userQuestion.trim()}
                      className="btn-primary px-4 py-2 text-sm mb-0 disabled:opacity-50"
                    >
                      {agentApiLoading && activeTab === "review"
                        ? "Asking..."
                        : "Ask"}
                    </button>
                  </div>
                  {agentApiLoading && activeTab === "review" && (
                    <p className="text-sm text-gray-600 italic mt-2">
                      AI is thinking...
                    </p>
                  )}
                  {agentResponse?.answer &&
                    activeTab === "review" &&
                    !agentApiLoading && (
                      <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                        {simplifiedFormatResponse(agentResponse.answer)}
                      </div>
                    )}
                </div>
              )}
              {activeTab === "advice" && (
                <div>
                  <p className="text-sm text-gray-700 mb-3">
                    Get personalized advice based on your current goals.
                  </p>
                  <button
                    onClick={() => callAgentApi("advice")} // This button now solely triggers the advice API call
                    disabled={agentApiLoading}
                    className="btn-primary px-4 py-2 text-sm mb-2 disabled:opacity-50"
                  >
                    {agentApiLoading && activeTab === "advice"
                      ? "Loading Advice..."
                      : "Get Advice"}
                  </button>
                  {agentApiLoading &&
                    activeTab === "advice" &&
                    !agentResponse?.advice && ( // Show "AI is thinking..." only when loading and no advice yet
                      <p className="text-sm text-gray-600 italic mt-2">
                        AI is thinking...
                      </p>
                    )}
                  {agentResponse?.advice &&
                    activeTab === "advice" &&
                    !agentApiLoading && (
                      <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                        {simplifiedFormatResponse(agentResponse.advice)}
                      </div>
                    )}
                </div>
              )}
              {activeTab === "scenario" && (
                <div>
                  <label
                    htmlFor="scenarioDescInput"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Describe your scenario:
                  </label>
                  <textarea
                    id="scenarioDescInput"
                    className="w-full goal-input"
                    placeholder="e.g., What if I increase my monthly savings by $200?"
                    rows={3}
                    value={scenarioDescription}
                    onChange={(e) => setScenarioDescription(e.target.value)}
                  />
                  <button
                    onClick={() => callAgentApi("scenario")}
                    disabled={agentApiLoading || !scenarioDescription.trim()}
                    className="btn-primary px-4 py-2 text-sm mt-2 mb-2 disabled:opacity-50"
                  >
                    {agentApiLoading && activeTab === "scenario"
                      ? "Analyzing..."
                      : "Analyze Scenario"}
                  </button>
                  {agentApiLoading && activeTab === "scenario" && (
                    <p className="text-sm text-gray-600 italic mt-2">
                      AI is analyzing scenario...
                    </p>
                  )}
                  {agentResponse?.analysis &&
                    activeTab === "scenario" &&
                    !agentApiLoading && (
                      <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                        {simplifiedFormatResponse(agentResponse.analysis)}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .goal-input {
          @apply w-full bg-white text-gray-900 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder-gray-500 text-sm;
        }
        .btn-primary {
          @apply bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-150 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium;
        }
        .btn-primary-outline {
          @apply border border-indigo-600 text-indigo-600 py-1 px-3 rounded hover:bg-indigo-100 transition duration-150 focus:ring-2 focus:ring-indigo-400 focus:outline-none font-medium;
        }
        .btn-success {
          @apply bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition duration-150 focus:ring-2 focus:ring-green-500 focus:outline-none font-medium;
        }
        .btn-danger-outline {
          @apply border border-red-500 text-red-500 py-1 px-3 rounded hover:bg-red-100 transition duration-150 focus:ring-2 focus:ring-red-400 focus:outline-none font-medium;
        }
        .btn-secondary {
          @apply bg-gray-200 text-gray-800 py-1 px-3 rounded hover:bg-gray-300 transition duration-150 focus:ring-2 focus:ring-gray-400 focus:outline-none font-medium;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb; /* Tailwind gray-50 */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; /* Tailwind gray-300 */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; /* Tailwind gray-400 */
        }
        /* For Firefox */
        textarea.custom-scrollbar,
        div.custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f9fafb;
        }
        /* Ensure prose styles from react-markdown apply correctly */
        .prose {
          @apply max-w-none;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose p,
        .prose ul,
        .prose ol,
        .prose li,
        .prose blockquote,
        .prose pre,
        .prose code,
        .prose table,
        .prose a {
          /* Add any specific overrides if Tailwind's preflight is too aggressive or if you need custom markdown styling */
          /* Example: */
          /* font-size: inherit; */
          /* color: inherit; */
        }
        .prose code::before,
        .prose code::after {
          content: ""; /* Reset default quotes for inline code if not desired */
        }
      `}</style>
    </div>
  );
}
