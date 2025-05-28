// src/app/user/profile/page.tsx

"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback, FormEvent } from "react";
import {
  Loader2,
  AlertTriangle,
  UserCircle,
  Save,
  CalendarDays,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Landmark,
  UserCheck,
  BarChartBig,
} from "lucide-react";

// Interface for profile data (matches backend GET response fields)
interface ProfileData {
  customer_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  date_of_birth: string | null;
  age: number | null;
  gender: string;
  employment_type: string;
  annual_income: number | null;
  income_category: string;
  credit_score: number | null;
  credit_rating: string;
  customer_since: string | null;
  risk_score: number | null;
}

// Type for the payload sent on PUT request
interface ProfileUpdatePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

// authFetch helper
async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  // Refined logic for Content-Type
  if (options.body) {
    if (typeof options.body === "string") {
      // If body is a string and Content-Type is not already set, assume JSON
      if (!headers.has("Content-Type")) {
        headers.append("Content-Type", "application/json");
      }
    }
    // Note: If options.body is FormData, fetch handles the Content-Type (multipart/form-data) automatically.
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.clear();
      if (window.location.pathname !== "/login")
        window.location.href = "/login?sessionExpired=true";
    }
    throw new Error("Session expired or unauthorized. Please log in again.");
  }
  return response;
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    date_of_birth: null,
    age: null,
    gender: "",
    employment_type: "",
    annual_income: null,
    income_category: "",
    credit_score: null,
    credit_rating: "",
    customer_since: null,
    risk_score: null,
  });
  const [initialEmail, setInitialEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();

  // Authentication Check
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "user" && userAccessLevel !== "client") {
      alert("You do not have permission to access this page.");
      localStorage.clear();
      router.push("/login");
      return;
    }
  }, [router]);

  // Fetch Profile Data
  const fetchProfileData = useCallback(async () => {
    if (!backendApiUrl) {
      setError("Backend API URL is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await authFetch(`${backendApiUrl}/users/profile/`);
      if (!response.ok) {
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) errorDetail = errorData.detail;
        } catch (jsonError) {
          console.warn("Could not parse error response JSON:", jsonError);
        }
        throw new Error(errorDetail);
      }
      const data: ProfileData = await response.json();
      setProfile({
        customer_id: data.customer_id || undefined,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip_code: data.zip_code || "",
        date_of_birth: data.date_of_birth || null,
        age: data.age === undefined ? null : Number(data.age),
        gender: data.gender || "",
        employment_type: data.employment_type || "",
        annual_income:
          data.annual_income === undefined ? null : Number(data.annual_income),
        income_category: data.income_category || "",
        credit_score:
          data.credit_score === undefined ? null : Number(data.credit_score),
        credit_rating: data.credit_rating || "",
        customer_since: data.customer_since || null,
        risk_score:
          data.risk_score === undefined ? null : Number(data.risk_score),
      });
      setInitialEmail(data.email || "");
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      if (err instanceof Error) setError(err.message);
      else if (typeof err === "string") setError(err);
      else setError("An unknown error occurred while fetching profile.");
    } finally {
      setLoading(false);
    }
  }, [backendApiUrl]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken && backendApiUrl) {
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendApiUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: type === "number" && val !== "" ? Number(val) : val,
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!backendApiUrl) {
      setError("Backend API URL is not configured. Cannot save.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload: ProfileUpdatePayload = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone_number: profile.phone_number,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code,
    };

    try {
      const response = await authFetch(`${backendApiUrl}/users/profile/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.detail || `HTTP error! status: ${response.status}`
        );
      }

      setSuccessMessage("Profile updated successfully!");
      if (responseData.email && responseData.email !== initialEmail) {
        localStorage.setItem("email", responseData.email);
        setInitialEmail(responseData.email);
        setProfile((prev) => ({ ...prev, email: responseData.email }));
        setSuccessMessage(
          `Profile updated! Your email has been changed to ${responseData.email}.`
        );
      }
      fetchProfileData();
    } catch (err) {
      console.error("Failed to update profile:", err);
      if (err instanceof Error) setError(err.message);
      else if (typeof err === "string") setError(err);
      else setError("An unknown error occurred while updating profile.");
    } finally {
      setSaving(false);
    }
  };

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return dateString.split("T")[0];
    } catch {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
          <div className="text-center mb-8">
            <UserCircle className="w-16 h-16 text-indigo-500 mx-auto mb-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              My Profile
            </h1>
            <p className="text-sm text-gray-500">
              View and update your personal details.
            </p>
          </div>

          {error && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6"
              role="alert"
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p className="font-semibold">
                  Error: <span className="font-normal">{error}</span>
                </p>
              </div>
            </div>
          )}
          {successMessage && (
            <div
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6"
              role="alert"
            >
              <p>{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Changing your email here will update your login email.
                </p>
              </div>
              <div>
                <label
                  htmlFor="phone_number"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="date_of_birth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date of Birth
                </label>
                <p className="form-display-text">
                  <CalendarDays className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {formatDateForDisplay(profile.date_of_birth)} (Age:{" "}
                  {profile.age ?? "N/A"})
                </p>
              </div>
              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Gender
                </label>
                <p className="form-display-text">
                  <UserCheck className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {profile.gender || "N/A"}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 my-6">
              Address
            </h2>
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Street Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={profile.address}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={profile.city}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  State / Province
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={profile.state}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div>
                <label
                  htmlFor="zip_code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ZIP / Postal Code
                </label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={profile.zip_code}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 my-6">
              Financial & Employment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="employment_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Employment Type
                </label>
                <p className="form-display-text">
                  <Briefcase className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {profile.employment_type || "N/A"}
                </p>
              </div>
              <div>
                <label
                  htmlFor="annual_income"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Annual Income
                </label>
                <p className="form-display-text">
                  <TrendingUp className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {formatCurrency(profile.annual_income)}
                </p>
              </div>
              <div>
                <label
                  htmlFor="income_category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Income Category
                </label>
                <p className="form-display-text">
                  <BarChartBig className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {profile.income_category || "N/A"}
                </p>
              </div>
              <div>
                <label
                  htmlFor="credit_score"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Credit Score
                </label>
                <p className="form-display-text">
                  <ShieldCheck className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {profile.credit_score ?? "N/A"} (
                  {profile.credit_rating || "N/A"})
                </p>
              </div>
              <div>
                <label
                  htmlFor="customer_since"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Customer Since
                </label>
                <p className="form-display-text">
                  <Landmark className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {formatDateForDisplay(profile.customer_since)}
                </p>
              </div>
              <div>
                <label
                  htmlFor="risk_score"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Risk Score
                </label>
                <p className="form-display-text">
                  {profile.risk_score ?? "N/A"}
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center bg-indigo-600 text-white px-4 py-2.5 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style jsx global>{`
        .form-input {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #d1d5db;
          background-color: white;
          color: #111827;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .form-input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);
        }
        .form-display-text {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #e5e7eb;
          background-color: #f9fafb;
          color: #374151;
          border-radius: 0.375rem;
          min-height: calc(0.625rem * 2 + 1.5rem);
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
