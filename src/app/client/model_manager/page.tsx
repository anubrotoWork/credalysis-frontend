'use client';
// src\app\client\model_manager\page.tsx

import Link from 'next/link'; // Import Link for navigation

// Define sections for easier mapping and maintenance
const sections = [
  { title: "Risk Level", href: "/client/model_manager/risk_level" },
  { title: "Credit Report", href: "/client/model_manager/credit_report" },
//   { title: "Trends", href: "/trends" },
//   { title: "Increase Product Usage", href: "/increase_product_usage" },
//   { title: "Grow Merchant Rewards", href: "/grow_merchant_rewards" },
//   { title: "Save Customer Money", href: "/save_customer_money" },
//   { title: "Wallet Share", href: "/wallet_share" },
//   { title: "Benchmarking", href: "/benchmarking" },
//   { title: "Lifecycle", href: "/lifecycling" },
];

export default function MainPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 sm:text-6xl">
          Model Manager
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          Click on What Model You Want to Use or Utilise?
        </p>
      </div>

      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link
              href={section.href}
              key={section.title}
              className="block bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-indigo-500/40 border border-gray-700 hover:border-indigo-600 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.02]"
            >
              <h2 className="text-xl font-semibold text-center text-indigo-400 group-hover:text-indigo-300">
                {section.title}
              </h2>
              {/* You could add a short description for each section here if desired */}
              {/* <p className="mt-2 text-sm text-gray-400 text-center">Short description...</p> */}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/login"
          className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-colors"
        >
          Get Started / Login
        </Link>
      </div>
    </div>
  );
}