"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const sections = [
  { title: "Overview", href: "/user/home/overview" },
  { title: "Risk And Lending", href: "/user/home/risk_and_lending" },
  { title: "Trends", href: "/user/home/trends" },
  {
    title: "Increase Product Usage",
    href: "/user/home/increase_product_usage",
  },
  { title: "Grow Merchant Rewards", href: "/user/home/grow_merchant_rewards" },
  { title: "Save Customer Money", href: "/user/home/save_customer_money" },
  { title: "Wallet Share", href: "/user/home/wallet_share" },
  { title: "Benchmarking", href: "/user/home/benchmarking" },
  { title: "Lifecycle", href: "/user/home/lifecycling" },
];
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Log the entire localStorage for debugging
    // console.log("User Home - localStorage check:", localStorage);

    // ---- CORRECTED AUTHENTICATION CHECK ----
    const authToken = localStorage.getItem("authToken"); // Check for the JWT
    const userAccessLevel = localStorage.getItem("access");

    if (!authToken) {
      // If no token, user is not logged in
      // console.log("User Home: No authToken found, redirecting to login.");
      router.push("/login");
      return; // Important to return to prevent further checks after redirect
    }

    if (userAccessLevel !== "user") {
      // Check if the access level is correct for this page
      // console.log(
      //   `User Home: Access level is '${userAccessLevel}', not 'user'. Redirecting.`
      // );
      alert("You do not have permission to access this page."); // More informative
      // You might want to redirect to a generic home or based on their actual access level
      // For now, redirecting to login is a safe default if their role is unexpected here.
      router.push("/login");
      return;
    }
    // ---- END CORRECTED AUTHENTICATION CHECK ----

    // console.log("User Home: User is authenticated and has correct access.");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("email");
    localStorage.removeItem("access");
    router.push("/login");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 sm:text-6xl">
          Credalysis
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          Intelligent Finance, Delivered​
        </p>
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4"
        >
          Sign Out
        </button>
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
