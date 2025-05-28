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
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('email');
    localStorage.removeItem('access');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return response;
}


interface Transaction {
  transaction_id: string;
  transaction_date: string;
  amount: number;
  is_debit?: boolean; // Assuming backend might send this; useful for display
  transaction_type: string;
  description: string | null; // Description can be null
  merchant_name: string | null;
  category: string | null;
  subcategory: string | null;
  status: string;
}

interface TransactionsApiResponse {
    email: string; // Email from token
    customer_id: string;
    transactions: Transaction[];
}

interface Filters {
  start_date: string;
  end_date: string;
  transaction_type: string;
  merchant_name: string;
  category: string;
  status: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    start_date: '',
    end_date: '',
    transaction_type: '',
    merchant_name: '',
    category: '',
    status: ''
  });

  // const [email, setEmail] = useState<string | null>(null); // No longer needed for API call
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Effect for initial auth check and redirect if necessary
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    // const storedEmail = localStorage.getItem('email'); // Not needed for API calls anymore

    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "user") {
      alert("You do not have permission to access this page.");
      router.push("/login");
      return;
    }
    // setEmail(storedEmail); // No longer setting email state
  }, [router]);


  const fetchTransactions = useCallback(async () => {
    if (!backendApiUrl) {
        setError("API URL is not configured.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    // Only append non-empty filter values
    (Object.keys(filters) as Array<keyof Filters>).forEach(key => {
        if (filters[key]) {
            queryParams.append(key, filters[key]);
        }
    });
    const queryString = queryParams.toString();

    try {
      // Email is no longer in the path. Filters are query params.
      const response = await authFetch(
        `${backendApiUrl}/user/transactions/${queryString ? `?${queryString}` : ''}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: TransactionsApiResponse = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred while fetching transactions.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  // backendApiUrl and filters are dependencies
  }, [backendApiUrl, filters]);


  // Effect to fetch transactions when component mounts or filters change,
  // but only if user is authenticated.
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (authToken && userAccessLevel === "user") {
        fetchTransactions();
    } else if (!authToken || userAccessLevel !== "user") {
        setLoading(false); // Stop loading if auth fails during potential re-renders
    }
  }, [fetchTransactions]); // Depends on the memoized fetchTransactions

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Optional: Debounce filter changes if API calls are too frequent
  // const debouncedFetchTransactions = useCallback(debounce(fetchTransactions, 500), [fetchTransactions]);
  // useEffect(() => { /* ... */ debouncedFetchTransactions(); }, [debouncedFetchTransactions]);


  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  const formatCurrency = (amount: number, isDebit?: boolean): string => {
    const sign = isDebit ? '-' : amount < 0 ? '-' : '+'; // Use is_debit if available, else infer from amount
    const absoluteAmount = Math.abs(amount);
    const colorClass = isDebit || amount < 0 ? 'text-red-600' : 'text-green-600';
    return `<span class="${colorClass}">${sign}$${absoluteAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
  };

  const renderStatusBadge = (status: string | null | undefined) => {
    const statusLower = status?.toLowerCase();
    let badgeClass = "bg-gray-200 text-gray-800"; // Default
    let textColor = "text-gray-800";

    if (statusLower === 'completed') { badgeClass = 'bg-green-100'; textColor = 'text-green-700'; }
    else if (statusLower === 'pending') { badgeClass = 'bg-yellow-100'; textColor = 'text-yellow-700'; }
    else if (statusLower === 'failed' || statusLower === 'cancelled' || statusLower === 'declined') { badgeClass = 'bg-red-100'; textColor = 'text-red-700'; }

    return (
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass} ${textColor}`}>
            {status || 'N/A'}
        </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto"> {/* Wider container for more columns */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">My Transactions</h1>
          <p className="mt-3 text-lg leading-7 text-gray-600">
            View and filter your transaction history.
          </p>
        </header>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Filter Transactions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {[
              { label: 'Start Date', name: 'start_date', type: 'date' },
              { label: 'End Date', name: 'end_date', type: 'date' },
              { label: 'Type', name: 'transaction_type', type: 'select', options: [{value: '', label: 'All Types'}, {value: 'deposit', label: 'Deposit'}, {value: 'withdrawal', label: 'Withdrawal'}, {value: 'payment', label: 'Payment'}, {value: 'transfer', label: 'Transfer'}, {value: 'fee', label: 'Fee'}] },
              { label: 'Merchant', name: 'merchant_name', type: 'text', placeholder: 'e.g., Amazon' },
              { label: 'Category', name: 'category', type: 'text', placeholder: 'e.g., Groceries' },
              { label: 'Status', name: 'status', type: 'select', options: [{value: '', label: 'All Statuses'}, {value: 'completed', label: 'Completed'}, {value: 'pending', label: 'Pending'}, {value: 'failed', label: 'Failed'}, {value: 'cancelled', label: 'Cancelled'}] },
            ].map(filter => (
              <div key={filter.name}>
                <label htmlFor={filter.name} className="block text-sm font-medium text-gray-700 mb-1">{filter.label}</label>
                {filter.type === 'select' ? (
                  <select
                    id={filter.name}
                    name={filter.name}
                    value={filters[filter.name as keyof Filters]}
                    onChange={handleFilterChange}
                    className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 bg-white"
                  >
                    {filter.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : (
                  <input
                    type={filter.type}
                    id={filter.name}
                    name={filter.name}
                    placeholder={filter.placeholder}
                    value={filters[filter.name as keyof Filters]}
                    onChange={handleFilterChange}
                    className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
            {loading && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="ml-3 text-gray-600">Loading transactions...</p>
                </div>
            )}
            {error && !loading && (
                <div className="text-center py-10">
                    <p className="text-red-600 font-semibold">Error Loading Transactions:</p>
                    <p className="text-gray-700 my-2">{error}</p>
                    <button
                        onClick={fetchTransactions}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Try Again
                    </button>
                </div>
            )}
            {!loading && !error && transactions.length === 0 && (
                <div className="text-center py-10 text-gray-500 italic">
                No transactions found{Object.values(filters).some(f => f) ? ' for the current filters.' : '.'}
                </div>
            )}
            {!loading && !error && transactions.length > 0 && (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Merchant</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                        <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.transaction_date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium max-w-xs truncate" title={transaction.description || ''}>{transaction.description || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transaction.merchant_name || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transaction.category || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transaction.transaction_type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right" dangerouslySetInnerHTML={{ __html: formatCurrency(transaction.amount, transaction.is_debit) }} />
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">{renderStatusBadge(transaction.status)}</td>
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