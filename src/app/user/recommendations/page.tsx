'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { ProductRecommendation } from '@/types';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('http://localhost:8000/product_recommendations');
      setRecommendations(await res.json());
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recommendations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="p-4 bg-white rounded shadow flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Product ID: {rec.product_id}</h3>
              <p className="mb-2">Match Score: <strong>{rec.match_score}</strong></p>
              <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
            </div>
            <button className="mt-2 text-blue-600 underline hover:text-blue-800">Learn More</button>
          </div>
        ))}
      </div>
    </div>
  );
}
