// File: app/client/products/[product_id]/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useRouter,
  useParams, // useParams is a Client Component hook
} from "next/navigation";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Tag,
  Percent,
  ShieldCheck,
  DollarSign,
  CalendarDays,
  CheckCircle,
  XCircle,
} from "lucide-react"; // Import icons

interface Product {
  product_id: string;
  product_name: string;
  product_type: string;
  description: string;
  interest_rate: number | null;
  min_credit_score: number | null;
  min_income: number | null;
  term_months: number | null;
  fee: number | null;
  is_active: number; // 0 or 1
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
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.clear();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?sessionExpired=true";
      }
    }
    throw new Error("Session expired or unauthorized. Please log in again.");
  }
  return response;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const product_id = Array.isArray(params?.product_id)
    ? params.product_id[0]
    : (params?.product_id as string | undefined);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Authentication check
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "client") {
      alert("You do not have permission to access this page.");
      localStorage.clear();
      router.push("/login");
      return;
    }
  }, [router]);

  // Fetch product details
  const fetchProductDetails = useCallback(async () => {
    if (!product_id) {
      setError("Product ID is missing or invalid for fetching."); // Error set if called without product_id
      setLoading(false);
      return;
    }
    if (!backendApiUrl) {
      setError("Backend API URL is not configured.");
      setLoading(false);
      return;
    }

    console.log(`Fetching details for product_id: ${product_id}`);
    setLoading(true);
    setError(null);
    setProduct(null);

    try {
      const response = await authFetch(
        `${backendApiUrl}/financial_products/${product_id}`
      );
      if (!response.ok) {
        let errorDetail = `Product not found or server error (Status: ${response.status})`;
        if (response.status === 404) {
          errorDetail =
            "Product not found. It may have been removed or the ID is incorrect.";
        } else {
          try {
            const errorData = await response.json();
            if (errorData && errorData.detail) errorDetail = errorData.detail;
          } catch (jsonError) {
            /* Stick with HTTP error */
            console.error("Failed to parse JSON:", jsonError);
          }
        }
        throw new Error(errorDetail);
      }
      const data: Product = await response.json();
      setProduct(data);
    } catch (err) {
      console.error("Failed to fetch product details:", err);
      if (err instanceof Error) setError(err.message);
      else if (typeof err === "string") setError(err);
      else
        setError("An unknown error occurred while fetching product details.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [product_id, backendApiUrl]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    // console.log(`useEffect for fetch: product_id=${product_id}, backendApiUrl=${!!backendApiUrl}, authToken=${!!authToken}`);

    if (authToken && product_id && backendApiUrl) {
      fetchProductDetails();
    } else if (!product_id && authToken && backendApiUrl) {
      // This condition means product_id is truly missing from params after initial render
      console.log("Product ID definitively missing, setting error.");
      setError("Product ID is missing from the URL. Cannot fetch details.");
      setLoading(false); // Stop loading indicator
    } else if (!backendApiUrl && authToken) {
      console.log("Backend API URL missing, setting error.");
      setError("Backend API URL is not configured.");
      setLoading(false);
    }
    // If authToken is missing, the other useEffect handles redirect, so no need to fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product_id, backendApiUrl]); // fetchProductDetails can be added if eslint insists,
  // but product_id & backendApiUrl are the core drivers.

  const renderDetailItem = (
    icon: React.ElementType,
    label: string,
    value: string | number | null | undefined,
    unit: string = ""
  ) => {
    const IconComponent = icon;
    const displayValue =
      value === null || value === undefined || String(value).trim() === ""
        ? "N/A"
        : `${value}${unit}`;
    return (
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg ring-1 ring-gray-200">
        <IconComponent className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-sm font-semibold text-gray-800">{displayValue}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">
          Error Loading Product
        </h2>
        <p className="text-red-600 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-orange-400 mb-4" />
        <h2 className="text-xl font-semibold text-orange-600 mb-2">
          Product Not Found
        </h2>
        <p className="text-orange-500 mb-6 max-w-md">
          The product you are looking for could not be found. It may have been
          removed or the ID is incorrect.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {product.product_name}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  product.is_active
                    ? "bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20"
                    : "bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20"
                }`}
              >
                {product.is_active ? (
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1.5" />
                )}
                {product.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Product ID: {product.product_id}
            </p>

            <div className="prose prose-sm max-w-none text-gray-700 mb-6">
              <h2 className="text-md font-semibold text-gray-800 mb-1">
                Description
              </h2>
              <p className="leading-relaxed">
                {product.description ||
                  "No detailed description available for this product."}
              </p>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-t pt-4">
              Product Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {renderDetailItem(Tag, "Product Type", product.product_type)}
              {renderDetailItem(
                Percent,
                "Interest Rate",
                product.interest_rate,
                product.interest_rate !== null ? "%" : ""
              )}
              {renderDetailItem(
                ShieldCheck,
                "Min. Credit Score",
                product.min_credit_score
              )}
              {renderDetailItem(
                DollarSign,
                "Min. Income",
                product.min_income?.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                }),
                ""
              )}
              {renderDetailItem(
                CalendarDays,
                "Term",
                product.term_months,
                product.term_months !== null ? " months" : ""
              )}
              {renderDetailItem(
                DollarSign,
                "Fee",
                product.fee?.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                }),
                ""
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
