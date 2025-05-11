'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { backendApiUrl } from "@/utils/env";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const backendApiUrl = "http://34.9.145.33:8000";
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${backendApiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.status?.includes("Authenticated")) {
        localStorage.setItem("auth", "true");
        localStorage.setItem("email", email);
        localStorage.setItem("access", data.access);
        if (data.access === "admin") {
          router.push("/admin/home");
        } else if (data.access === "client") {
          router.push("/client/home");
        } else if (data.access === "user") {
          router.push("/user/home");
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900"> {/* Changed bg */}
      <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded shadow-md w-96"> {/* Changed bg */}
        <h2 className="text-2xl font-bold mb-4 text-gray-100">Login</h2> {/* Added text color */}
        <input
          className="border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 w-full mb-3 px-3 py-2 rounded" // Changed border, bg, text, placeholder
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 w-full mb-3 px-3 py-2 rounded" // Changed border, bg, text, placeholder
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>} {/* Changed text color */}
        <button
          type="submit"
          className={`w-full text-white py-2 rounded ${
            loading ? "bg-indigo-800" : "bg-indigo-600 hover:bg-indigo-700" // Changed button colors
          }`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 text-white mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Logging in...
            </div>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}