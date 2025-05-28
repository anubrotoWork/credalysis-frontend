// src/app/login/page.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!backendApiUrl) {
        setError("API URL is not configured. Please contact support.");
        setLoading(false);
        return;
    }

    try {
      // For OAuth2PasswordRequestForm, data should be form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', email); // 'username' is the standard field name for email/user ID
      formData.append('password', password);
      // You might need to append 'scope' if your backend /token endpoint uses it,
      // but for simple username/password, this is often enough.
      // formData.append('scope', ''); 

      const res = await fetch(`${backendApiUrl}/token`, { // Changed to /token
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded" // Correct header for form data
        },
        body: formData.toString(), // Send as URL-encoded string
      });

      const data = await res.json();

      if (res.ok && data.access_token) { // Check for res.ok and the actual access_token
        localStorage.setItem("authToken", data.access_token); // Store the JWT
        localStorage.setItem("email", data.email);       // Store email (from token response)
        localStorage.setItem("access", data.access);     // Store access level (from token response)
        
        // Optionally remove old "auth" flag if you used it previously
        localStorage.removeItem("auth"); 

        // Redirect based on access level
        if (data.access === "admin") {
          router.push("/admin/home"); 
        } else if (data.access === "client") {
          router.push("/client/home"); 
        } else if (data.access === "user") {
          router.push("/user/home");   
        } else {
            setError("Unknown user role received from server.");
            // Clear stored items if role is unknown to prevent partial login state
            localStorage.removeItem("authToken");
            localStorage.removeItem("email");
            localStorage.removeItem("access");
        }
      } else {
        // Use error detail from backend if available, otherwise a generic message
        setError(data.detail || "Invalid credentials or login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      // Check if err is an Error instance to access err.message safely
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(`Login failed: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // ... (JSX form remains the same - I'll include it for completeness)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Login</h2>
        <input
          className="border border-gray-300 bg-gray-200 text-gray-900 placeholder-gray-500 w-full mb-3 px-3 py-2 rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border border-gray-300 bg-gray-200 text-gray-900 placeholder-gray-500 w-full mb-3 px-3 py-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          className={`w-full text-white py-2 rounded ${loading ? "bg-indigo-500" : "bg-indigo-600 hover:bg-indigo-700"}`}
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
                <path // Using a more complete spinner path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V8H8V4a8 8 0 00-8 8h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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