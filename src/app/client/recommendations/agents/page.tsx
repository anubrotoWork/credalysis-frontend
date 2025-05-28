"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductRecommendation } from "@/types";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");

    if (!authToken) {
      router.push("/login");
      return;
    }

    if (userAccessLevel !== "client") {
      alert("You do not have permission to access this page.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("email");
      localStorage.removeItem("access");
      router.push("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${backendApiUrl}/product_recommendations`);
      setRecommendations(await res.json());
    };
    fetchData();
  }, [backendApiUrl]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recommendations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="p-4 bg-white rounded shadow flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Product ID: {rec.product_id}
              </h3>
              <p className="mb-2">
                Match Score: <strong>{rec.match_score}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
            </div>
            <button className="mt-2 text-blue-600 underline hover:text-blue-800">
              Learn More
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
