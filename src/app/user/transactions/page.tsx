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
  const email = typeof window !== 'undefined' ? localStorage.getItem('email') : '';

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (email) {
      const query = new URLSearchParams(filters).toString();
      fetch(`http://localhost:8000/user/transactions/${email}?${query}`)
        .then((res) => res.json())
        .then((data) => {
          setTransactions(data.transactions);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [email, filters]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">My Transactions</h1>

      {/* Filters */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Start Date</label>
        <input
          type="date"
          name="start_date"
          value={filters.start_date}
          onChange={handleFilterChange}
          className="mt-1 block w-full px-4 py-2 border rounded-lg"
        />
        <label className="block text-sm font-medium text-gray-700">End Date</label>
        <input
          type="date"
          name="end_date"
          value={filters.end_date}
          onChange={handleFilterChange}
          className="mt-1 block w-full px-4 py-2 border rounded-lg"
        />
        {/* Add other filter fields like transaction_type, merchant_name, etc. */}
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Merchant</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.transaction_id}>
              <td className="px-4 py-2 whitespace-nowrap">{transaction.transaction_date}</td>
              <td className="px-4 py-2 whitespace-nowrap">${transaction.amount.toLocaleString()}</td>
              <td className="px-4 py-2 whitespace-nowrap">{transaction.transaction_type}</td>
              <td className="px-4 py-2 whitespace-nowrap">{transaction.merchant_name}</td>
              <td className="px-4 py-2 whitespace-nowrap">{transaction.category}</td>
              <td className="px-4 py-2 whitespace-nowrap">{transaction.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}