'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isUser = localStorage.getItem("access") == "user";

    console.log(localStorage);
    if (!isLoggedIn) {
      router.push("/login");
    }

    if(!isUser) {
      alert("you are not user");
      router.push("/login");
    }

  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("email");
    localStorage.removeItem("access");
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
      <h1 className="text-3xl font-bold text-green-700 mb-4">Welcome to Credalysis User!</h1>
      <p className="mb-6 text-lg">You are successfully authenticated 🎉</p>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Sign Out
      </button>
    </div>
  );
}