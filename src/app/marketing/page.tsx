"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image"; // ✅ Fix
import Logo from "@/assets/Logo-for-website.svg";
import SynaptLogo from "@/assets/synaptailogoformenu.svg";

const sections = [
  { title: "Overview", href: "#overview" },
  { title: "Risk And Lending", href: "#risk_and_lending" },
  { title: "Trends", href: "#trends" },
  { title: "Increase Product Usage", href: "#increase_product_usage" },
  { title: "Grow Merchant Rewards", href: "#grow_merchant_rewards" },
  { title: "Save Customer Money", href: "#save_customer_money" },
  { title: "Wallet Share", href: "#wallet_share" },
  { title: "Benchmarking", href: "#benchmarking" },
  { title: "Lifecycle", href: "#lifecycle" },
];

export default function MarketingPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-0 pb-12 text-gray-800">
      <header className="bg-white py-4 w-full">
        <div className="px-6 flex items-center justify-between w-full max-w-screen-2xl mx-auto">
          {/* Prodapt Logo */}
          <Link href="https://www.prodapt.com/" className="text-xl font-bold">
            <Image src={Logo} alt="Prodapt Logo" width={150} height={40} />
          </Link>

          {/* Synapt Logo */}
          <Link href="https://synapt.ai/">
            <Image src={SynaptLogo} alt="Synapt Logo" width={80} height={30} />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-6">
            <Link
              href="https://www.prodapt.com/service/"
              className="hover:underline"
            >
              Services
            </Link>
            <Link
              href="https://www.prodapt.com/success-stories-landing/"
              className="hover:underline"
            >
              Success Stories
            </Link>
            <Link
              href="https://www.prodapt.com/insights/"
              className="hover:underline"
            >
              Insights
            </Link>
            <Link
              href="https://www.prodapt.com/about-us/"
              className="hover:underline"
            >
              About Us
            </Link>
            <Link
              href="https://career-portal.prodapt.com/"
              className="hover:underline"
              style={{ color: "lightgreen" }}
            >
              Careers
            </Link>
            <Link
              href="https://www.prodapt.com/search-result/"
              className="hover:underline"
            >
              Search
            </Link>
          </nav>
        </div>
      </header>

      <section className="text-center mt-12 mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Accelerate Financial Intelligence with Credalysis AI Agents
        </h1>
        <p className="text-lg text-red-600 font-semibold">
          Unlock deeper insights, boost efficiency, and personalize decisions
          with generative AI.
        </p>
      </section>

      <div className="w-full max-w-5xl mx-auto mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link
              href={section.href}
              key={section.title}
              className="block p-6 rounded-xl shadow-lg hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.02] bg-[#eb262a]"
            >
              <h2 className="text-xl font-semibold text-center text-white">
                {section.title}
              </h2>
              {/* You could add a short description for each section here if desired */}
              {/* <p className="mt-2 text-sm text-center text-white">Short description...</p> */}
            </Link>
          ))}
        </div>
      </div>

      <section className="mb-16">
        {sections.map(({ title, href }) => (
          <div
            id={href.replace("#", "")}
            key={href}
            className="mb-10 bg-white p-6 rounded-xl shadow-md"
          >
            <h2 className="text-2xl font-semibold text-red-600 mb-2">
              {title}
            </h2>
            <p className="text-gray-700">
              {
                {
                  "#overview":
                    "Get a real-time snapshot of your customer base's financial health. Summarize key metrics, behaviors, and risks at scale.",
                  "#risk_and_lending":
                    "Assess creditworthiness, predict loan behavior, and reduce exposure using intelligent, data-driven lending strategies.",
                  "#trends":
                    "Identify behavioral trends, anomalies, and emerging patterns in financial data to anticipate risks and opportunities.",
                  "#increase_product_usage":
                    "Discover and act on personalized strategies to increase adoption of your financial products across segments.",
                  "#grow_merchant_rewards":
                    "Empower customers to maximize merchant-linked rewards with AI-driven insights and nudges.",
                  "#save_customer_money":
                    "Deliver targeted financial advice that helps customers reduce spending, increase savings, and meet goals.",
                  "#wallet_share":
                    "Analyze total wallet share and uncover personalized cross-sell opportunities across your product suite.",
                  "#benchmarking":
                    "Compare customer cohorts to industry and peer benchmarks to refine segmentation and targeting strategies.",
                  "#lifecycle":
                    "Map out lifecycle stages of your customers and align product offerings with their evolving financial journey.",
                }[href]
              }
            </p>
            {/* Suggested image placeholder */}
            <div className="mt-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              {/* Example: "Image showing a dashboard of lifecycle stages" */}
              [Insert image: `&quot;`{title} illustration or dashboard`&quot;`]
            </div>
          </div>
        ))}
      </section>

      <section className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <blockquote className="italic text-gray-700 max-w-xl mx-auto">
          “By 2026, over 75% of financial institutions will rely on AI agents to
          power customer engagement, optimize risk models, and personalize
          services.”
        </blockquote>
        <p className="mt-4 font-bold text-red-600">
          — Industry Analyst Insight
        </p>
      </section>

      <section className="bg-[#eb262a] text-white px-6 py-10 rounded-lg max-w-4xl mx-auto my-12">
        <h4 className="text-2xl font-semibold mb-4">
          Download this insight to know more about:
        </h4>

        <ul className="list-disc list-inside space-y-2 mb-6">
          <li>
            Key areas for applying Generative AI in a service delivery agent
            journey for a 20% cost optimization
          </li>
          <li>
            Agent Genie Framework components, recommendations, tools, and
            techniques
          </li>
          <li>
            Key benefits — 20% reduction in Opex, &gt;30% agent effort
            reduction, 40% training efficiency
          </li>
        </ul>

        <div className="text-center">
          <a
            href="https://www.prodapt.com/maximizing-agent-productivity-the-power-of-gen-ai-with-agent-genie/#contact_formID"
            className="inline-block bg-white text-[#eb262a] font-semibold py-2 px-6 rounded-full hover:bg-gray-100 transition"
          >
            Download Insight
          </a>
        </div>
      </section>

      <footer className="mt-16 text-center text-sm text-gray-500">
        © 2025 Credalysis. All rights reserved.
      </footer>
    </main>
  );
}
