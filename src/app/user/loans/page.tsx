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
  const [email, setEmail] = useState<string | null>(null);
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;;

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    setEmail(storedEmail);
  }, []);

  useEffect(() => {
    if (email) {
      setLoading(true);
      fetch(`${backendApiUrl}/user/loans/${email}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data.loans)) {
            setLoans(data.loans);
          } else {
            console.warn("Loans data is not an array:", data);
            setLoans([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch loans:", error);
          setLoans([]);
          setLoading(false);
        });
    } else if (email === null && typeof window !== 'undefined') {
        setLoading(false); 
    }
  }, [email, backendApiUrl]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) { 
      console.error(`Error formatting date '${dateString}':`, e); // Example of using 'e'
      return dateString; 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-8 text-indigo-600 text-center">My Loans</h1>

          {loading ? (
            <div className="text-center py-10 text-gray-700">Loading loans...</div>
          ) : loans.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              You currently have no active loans.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Product Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Balance</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Interest Rate</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Start Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">End Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.product_id} className="hover:bg-indigo-50 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{loan.product_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        ${loan.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {loan.interest_rate !== null && loan.interest_rate !== undefined ? `${loan.interest_rate.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(loan.start_date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(loan.end_date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          loan.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
                          loan.status?.toLowerCase() === 'paid off' ? 'bg-blue-100 text-blue-700' :
                          loan.status?.toLowerCase() === 'defaulted' ? 'bg-red-100 text-red-700' :
                          loan.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700' // Default/Fallback badge
                        }`}>
                          {loan.status || 'N/A'}
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