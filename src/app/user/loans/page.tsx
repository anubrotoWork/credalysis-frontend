"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react'; // Added useCallback

// Define authFetch here or import from a shared lib
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  // Automatically set Content-Type for JSON if not a FormData and body exists
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('email');
    localStorage.removeItem('access');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'; // Force redirect
    }
  }
  return response;
}


interface Loan {
  product_id: number; // Assuming this is a unique key for the product itself
  customer_product_id?: string; // If available from backend, better for key in map
  product_name: string;
  product_type?: string; // Make optional if not always present
  balance: number;
  credit_limit?: number; // Make optional
  start_date: string;
  end_date: string | null; // end_date can be null
  status: string;
  payment_amount?: number; // Make optional
  payment_frequency?: string; // Make optional
  interest_rate: number;
  annual_fee?: number; // Make optional
}

// Define the expected structure of the API response
interface LoansApiResponse {
    loans: Loan[]; // Assuming backend returns {"loans": [...]}
    // Add other potential top-level keys if your API returns more
}


export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [email, setEmail] = useState<string | null>(null); // No longer need to store email from localStorage for API call
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();

  useEffect(() => {
    // const storedEmail = localStorage.getItem('email'); // Not needed for API call
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
    // setEmail(storedEmail); // No longer needed
  }, [router]);


  const fetchLoans = useCallback(async () => {
    if (!backendApiUrl) {
        setError("API URL is not configured.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      // The backend now derives email from JWT, so the path is just /user/loans/
      const response = await authFetch(`${backendApiUrl}/user/loans/`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: LoansApiResponse = await response.json(); // Expecting {"loans": [...]}

      if (Array.isArray(data.loans)) {
        setLoans(data.loans);
      } else {
        console.warn("Loans data from API is not in the expected format (expected data.loans to be an array):", data);
        setLoans([]); // Set to empty array if format is wrong
        setError("Received invalid data format for loans.");
      }
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred while fetching loans.");
      setLoans([]); // Clear loans on error
    } finally {
      setLoading(false);
    }
  // Removed email from dependencies as it's no longer used in the fetch call
  }, [backendApiUrl]);


  useEffect(() => {
    // Fetch loans if authenticated and authorized, now independent of local email state
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (authToken && userAccessLevel === "user") {
        fetchLoans();
    } else if (!authToken || userAccessLevel !== "user") {
        setLoading(false); // Ensure loading stops if auth conditions aren't met
    }
  }, [fetchLoans]); // Depend only on fetchLoans


  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error(`Error formatting date '${dateString}':`, e);
      return dateString;
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return 'N/A'; // Check for null or undefined
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (rate: number | null | undefined) => {
    if (rate == null) return 'N/A';
    return `${rate.toFixed(2)}%`;
  };

  const renderStatusBadge = (status: string | null | undefined) => {
    const statusLower = status?.toLowerCase();
    let badgeClass = "bg-gray-100 text-gray-700"; // Default

    if (statusLower === 'active') badgeClass = 'bg-green-100 text-green-700';
    else if (statusLower === 'paid off' || statusLower === 'closed') badgeClass = 'bg-blue-100 text-blue-700';
    else if (statusLower === 'defaulted') badgeClass = 'bg-red-100 text-red-700';
    else if (statusLower === 'pending') badgeClass = 'bg-yellow-100 text-yellow-700';

    return (
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
            {status || 'N/A'}
        </span>
    );
};


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto"> {/* Increased max-width for wider table */}
        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
          <header className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">My Loans</h1>
            <p className="text-md text-gray-600 mt-1">
                Overview of your current and past loan products.
            </p>
          </header>

          {loading && ( // Centralized loading check
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="ml-3 text-gray-600">Loading your loans...</p>
            </div>
          )}

          {error && !loading && ( // Show error only if not loading
            <div className="text-center py-10 p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold text-lg">Could Not Load Loans</p>
              <p className="text-gray-700 my-2">{error}</p>
              <button
                onClick={fetchLoans}
                className="mt-4 px-5 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && loans.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Loans Found</h3>
              <p className="mt-1 text-sm text-gray-500">You currently have no active or past loans on record.</p>
            </div>
          )}

          {!loading && !error && loans.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Balance</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Credit Limit</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Interest Rate</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Annual Fee</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">End Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.customer_product_id || loan.product_id} className="hover:bg-indigo-50 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{loan.product_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(loan.balance)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(loan.credit_limit)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatPercent(loan.interest_rate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(loan.annual_fee)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(loan.start_date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(loan.end_date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{renderStatusBadge(loan.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}