'use client';

import Link from 'next/link'; // Import Link for navigation

export default function MainPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-green-700">Credalysis!</h1>
        <p className="mt-4 text-lg">Marketing Page</p>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/overview" className="hover:text-green-800">
                Overview
              </Link>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/risk_and_lending" className="hover:text-green-800">
                Risk And Lending
              </Link>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/trends" className="hover:text-green-800">
                Trends
              </Link>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/increase_product_usage" className="hover:text-green-800">
                Increase Product Usage
              </Link>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/grow_merchant_rewards" className="hover:text-green-800">
                Grow Merchant Rewards
              </Link>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/save_customer_money" className="hover:text-green-800">
                Save Customer Money
              </Link>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/wallet_share" className="hover:text-green-800">
                Wallet Share
              </Link>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/benchmarking" className="hover:text-green-800">
                Benchmarking
              </Link>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600">
              <Link href="/lifecycling" className="hover:text-green-800">
                Lifecycle
              </Link>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}