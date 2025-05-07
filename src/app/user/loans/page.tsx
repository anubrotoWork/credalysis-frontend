'use client';
import { useEffect, useState } from 'react';

interface Loan {
  product_id: number;
  product_name: string;
  product_type: string;
  balance: number;
  credit_limit: number;
  start_date: string;
  end_date: string;
  status: string;
  payment_amount: number;
  payment_frequency: string;
  interest_rate: number;
  annual_fee: number;
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const email = typeof window !== 'undefined' ? localStorage.getItem('email') : '';

  useEffect(() => {
    if (email) {
      fetch(`http://localhost:8000/user/loans/${email}`)
        .then(res => res.json())
        .then(data => {
          setLoans(data.loans); // <-- Fix here
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [email]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">My Loans</h1>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Balance</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Interest</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Start</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">End</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loans.map((loan) => (
            <tr key={loan.product_id}>
              <td className="px-4 py-2 whitespace-nowrap">{loan.product_name}</td>
              <td className="px-4 py-2 whitespace-nowrap">${loan.balance.toLocaleString()}</td>
              <td className="px-4 py-2 whitespace-nowrap">{loan.interest_rate}%</td>
              <td className="px-4 py-2 whitespace-nowrap">{loan.start_date}</td>
              <td className="px-4 py-2 whitespace-nowrap">{loan.end_date}</td>
              <td className="px-4 py-2 whitespace-nowrap">{loan.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
