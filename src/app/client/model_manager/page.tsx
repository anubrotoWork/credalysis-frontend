"use client";

// src/app/client/model_manager/page.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert, FileText, ArrowRight } from "lucide-react"; // Import icons

// Define sections with more details
const sectionsData = [
  {
    title: "Risk Level Model",
    href: "/client/model_manager/risk_level",
    icon: (
      <ShieldAlert className="w-10 h-10 text-indigo-600 group-hover:text-indigo-500 transition-colors" />
    ),
    description:
      "Analyze and manage risk levels using predictive models and data inputs.",
  },
  {
    title: "Credit Report Analysis",
    href: "/client/model_manager/credit_report",
    icon: (
      <FileText className="w-10 h-10 text-indigo-600 group-hover:text-indigo-500 transition-colors" />
    ),
    description:
      "Utilize models to parse, interpret, and derive insights from credit reports.",
  },
  // {
  //   title: "Market Trends Model",
  //   href: "/client/model_manager/trends",
  //   icon: <LineChart className="w-10 h-10 text-indigo-600 group-hover:text-indigo-500 transition-colors" />,
  //   description: "Explore models for identifying and predicting market trends and patterns.",
  // },
];

export default function ModelManagerMainPage() {
  const router = useRouter();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "client") {
      alert("You do not have permission to access this model management page.");
      localStorage.clear();
      router.push("/login");
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 sm:p-8 md:p-12">
      {" "}
      {/* Main page background */}
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 pb-2">
            {" "}
            {/* Header text color */}
            Model Manager Dashboard
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {" "}
            {/* Subtitle text color */}
            Select a model below to configure its parameters, analyze
            performance, or deploy new versions.
          </p>
        </header>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {sectionsData.map((section) => (
            <Link
              href={section.href}
              key={section.title}
              // Card styling
              className="group relative block bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 border border-gray-200 hover:border-indigo-300"
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 flex items-center space-x-4">
                  {/* Icon background */}
                  <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    {section.icon} {/* Icon color is defined in sectionsData */}
                  </div>
                  {/* Card title color */}
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {section.title}
                  </h2>
                </div>
                {/* Card description color */}
                <p className="text-gray-600 text-sm sm:text-base flex-grow mb-4 group-hover:text-gray-700 transition-colors">
                  {section.description}
                </p>
                <div className="mt-auto text-right">
                  {/* "Manage Model" text color */}
                  <span className="inline-flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-500 transition-colors">
                    Manage Model
                    <ArrowRight className="ml-1.5 h-4 w-4 transform transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
              {/* Subtle glow effect on hover - adjusted for light theme */}
              <div
                className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" // Added pointer-events-none
                style={{
                  background:
                    "radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.1), transparent 80%)", // Lighter glow
                }}
                onMouseMove={(e) => {
                  const rect =
                    e.currentTarget.parentElement?.getBoundingClientRect();
                  if (rect) {
                    e.currentTarget.style.setProperty(
                      "--mouse-x",
                      `${e.clientX - rect.left}px`
                    );
                    e.currentTarget.style.setProperty(
                      "--mouse-y",
                      `${e.clientY - rect.top}px`
                    );
                  }
                }}
              ></div>
            </Link>
          ))}
        </div>

        {/* Optional: Footer or additional information */}
        {/* <footer className="mt-16 text-center">
          <p className="text-sm text-gray-500">Credalysis Model Management © {new Date().getFullYear()}</p>
        </footer> */}
      </div>
    </div>
  );
}
