'use client';

// src/app/client/model_manager/page.tsx
import Link from 'next/link'; // Import Link for navigation

// Define sections for easier mapping and maintenance
const sections = [
  { title: "Risk Level", href: "/client/model_manager/risk_level" },
  { title: "Credit Report", href: "/client/model_manager/credit_report" },
  { title: "Trends", href: "/client/model_manager/trends" },
];

export default function MainPage() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Model Manager</h1>
        <p className="text-lg text-gray-600">
          Click on What Model You Want to Use or Utilise?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link
            href={section.href}
            key={section.title}
            className="block bg-white p-6 rounded-lg shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            <h2 className="text-xl font-semibold text-center text-indigo-600 hover:text-indigo-500">
              {section.title}
            </h2>
          </Link>
        ))}
      </div>

      
    </div>
  );
}
