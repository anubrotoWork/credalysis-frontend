'use client';
import { useEffect, useState } from 'react';

interface Transaction {
  transaction_id: string;
  transaction_date: string; // Assuming YYYY-MM-DD or similar
  amount: number;
  transaction_type: string;
  description: string; // Not used in table, but in interface
  merchant_name: string;
  category: string;
  subcategory: string; // Not used in table, but in interface
  status: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    transaction_type: '',
    merchant_name: '',
    category: '',
    status: ''
  });

  // State for email, to be fetched from localStorage on client-side
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Ensure localStorage is accessed only on the client
    const storedEmail = localStorage.getItem('email');
    setEmail(storedEmail);
  }, []);

  const backendApiUrl = "http://34.9.145.33:8000";

  useEffect(() => {
    if (email) { // Only fetch if email is available
      setLoading(true); // Set loading true when filters change and email is present
      const queryParams = new URLSearchParams();
      // Append filters to queryParams only if they have a value
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();

      fetch(`${backendApiUrl}/user/transactions/${email}${queryString ? `?${queryString}` : ''}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setTransactions(data.transactions || []); // Ensure transactions is always an array
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch transactions:", error);
          setTransactions([]); // Clear transactions on error
          setLoading(false);
        });
    } else if (email === null && typeof window !== 'undefined') {
        // This means useEffect for email has run, and email wasn't found in localStorage
        // or we are still waiting for the initial email useEffect to run.
        // If you want to show "not logged in" or similar, handle it here.
        // For now, we just prevent fetching. If email is explicitly empty string, it might be an error.
        setLoading(false); // Stop loading if no email
    }
  }, [email, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Helper to format date for display, you can customize this
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateString; // Fallback if date is not in a parsable format
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8"> {/* Full page dark background */}
      <div className="max-w-5xl mx-auto"> {/* Increased max-width for better table layout */}
        <div className="bg-gray-800 shadow-xl rounded-lg p-6"> {/* Card background */}
          <h1 className="text-3xl font-bold mb-8 text-gray-100 text-center">My Transactions</h1>

          {/* Filters Section */}
          <div className="mb-8 p-4 border border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="transaction_type" className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  id="transaction_type"
                  name="transaction_type"
                  value={filters.transaction_type}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="payment">Payment</option>
                  <option value="transfer">Transfer</option>
                  {/* Add more types as needed */}
                </select>
              </div>
              <div>
                <label htmlFor="merchant_name" className="block text-sm font-medium text-gray-300 mb-1">Merchant</label>
                <input
                  type="text"
                  id="merchant_name"
                  name="merchant_name"
                  placeholder="e.g., Amazon"
                  value={filters.merchant_name}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  placeholder="e.g., Groceries"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  {/* Add more statuses as needed */}
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {loading ? (
            <div className="text-center py-10 text-gray-300">Loading transactions...</div>
          ) : transactions.length === 0 ? (
             <div className="text-center py-10 text-gray-400">
                No transactions found{Object.values(filters).some(f => f) ? ' for the current filters.' : '.'}
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Merchant</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="hover:bg-gray-750 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{formatDate(transaction.transaction_date)}</td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${transaction.transaction_type === 'deposit' || (transaction.amount > 0 && (transaction.transaction_type !== 'withdrawal' && transaction.transaction_type !== 'payment') ) ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.transaction_type === 'deposit' || (transaction.amount > 0 && (transaction.transaction_type !== 'withdrawal' && transaction.transaction_type !== 'payment')) ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{transaction.transaction_type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{transaction.merchant_name || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{transaction.category || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status.toLowerCase() === 'completed' ? 'bg-green-700 text-green-100' :
                          transaction.status.toLowerCase() === 'pending' ? 'bg-yellow-700 text-yellow-100' :
                          transaction.status.toLowerCase() === 'failed' ? 'bg-red-700 text-red-100' :
                          'bg-gray-600 text-gray-100' // Default/fallback
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
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