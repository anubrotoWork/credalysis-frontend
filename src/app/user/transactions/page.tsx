'use client';
import { useEffect, useState } from 'react';

interface Transaction {
  transaction_id: string;
  transaction_date: string;
  amount: number;
  transaction_type: string;
  description: string;
  merchant_name: string;
  category: string;
  subcategory: string;
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

  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    setEmail(storedEmail);
  }, []);

  const backendApiUrl = "http://34.9.145.33:8000";

  useEffect(() => {
    if (email) {
      setLoading(true);
      const queryParams = new URLSearchParams();
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
          setTransactions(data.transactions || []);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch transactions:", error);
          setTransactions([]);
          setLoading(false);
        });
    } else if (email === null && typeof window !== 'undefined') {
        setLoading(false);
    }
  }, [email, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.log(error);
      return dateString;
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl font-bold text-gray-900">My Transactions</h1>
        <p className="text-lg text-gray-600">
          View your transaction history and apply filters.
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-800 placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-800 placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="transaction_type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="transaction_type"
              name="transaction_type"
              value={filters.transaction_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="payment">Payment</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div>
            <label htmlFor="merchant_name" className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
            <input
              type="text"
              id="merchant_name"
              name="merchant_name"
              placeholder="e.g., Amazon"
              value={filters.merchant_name}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-800 placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              placeholder="e.g., Groceries"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-800 placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-600">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          No transactions found{Object.values(filters).some(f => f) ? ' for the current filters.' : '.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Merchant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.transaction_id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm text-gray-800">{formatDate(transaction.transaction_date)}</td>
                  <td className={`px-4 py-3 text-sm ${transaction.transaction_type === 'deposit' || transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.transaction_type === 'deposit' || transaction.amount > 0 ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.transaction_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.merchant_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.category || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${transaction.status.toLowerCase() === 'completed' ? 'bg-green-200 text-green-600' : transaction.status.toLowerCase() === 'pending' ? 'bg-yellow-200 text-yellow-600' : 'bg-red-200 text-red-600'}`}>
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
  );
}
