'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from "react-markdown";
interface CreditReport {
    report_id: string;
    report_date: string;
    credit_bureau: string;
    credit_score: number;
    credit_rating: string;
    payment_history_percent: number;
    credit_utilization_percent: number;
    total_accounts: number;
    open_accounts: number;
    credit_age_months: number;
    hard_inquiries: number;
    public_records: number;
    collections: number;
    total_debt: number;
    revolving_debt: number;
    installment_debt: number;
    mortgage_debt: number;
    available_credit: number;
}

export default function HomePage() {
    const router = useRouter();
    const [reports, setReports] = useState<CreditReport[]>([]);
    const [analysis, setAnalysis] = useState<string>('');
    const [loadingReports, setLoadingReports] = useState<boolean>(false);
    const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);

    const backendApiUrl = 'http://34.9.145.33:8000'; // Replace with your actual backend URL

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('auth') === 'true';
        const isUser = localStorage.getItem('access') === 'user';
        const email = localStorage.getItem('email');

        if (!isLoggedIn || !isUser || !email) {
            alert('Unauthorized access. Please log in.');
            router.push('/login');
            return;
        }

        fetchReports(email);
    }, [router]);

    const fetchReports = async (email: string) => {
        try {
            setLoadingReports(true);
            const res = await fetch(`${backendApiUrl}/user/credit-reports/customer/${email}`);
            if (!res.ok) {
                console.error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
                setReports([]);
                throw new Error('Failed to fetch reports');
            }
            const data: CreditReport[] = await res.json();
            // Sort reports by date, newest first
            setReports(data.sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()));
            setLoadingReports(false);
        } catch (err) {
            console.error(err);
            setReports([]);
            setLoadingReports(false);
        }
    };

    const handleAnalyze = async () => {
        const email = localStorage.getItem('email');
        if (!email) {
            alert('Email not found. Please log in again.');
            return;
        }

        try {
            setAnalysisLoading(true);
            setAnalysis(''); // Clear previous analysis
            const res = await fetch(`${backendApiUrl}/user/credit-reports/analyze/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: 'Analysis request failed.' }));
                console.error(`Failed to analyze: ${res.status} ${res.statusText}`, errorData);
                alert(`Error during analysis: ${errorData.detail || res.statusText}`);
                throw new Error('Failed to analyze');
            }
            const result = await res.json();
            setAnalysis(result.analysis);
            setAnalysisLoading(false);
        } catch (err) {
            console.error(err);
            // alert('An error occurred during the credit analysis.');
            setAnalysisLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    const latestReport = reports.length > 0 ? reports[0] : null;

    return (
        <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-gray-200">
            <div className="w-full max-w-2xl lg:max-w-3xl">
                <div className="w-full flex justify-end mb-6">
                    <button
                        onClick={handleLogout}
                        className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-md transition-colors duration-150 text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>

                <div className="text-center mb-10">

                    <p className="mt-3 text-xl text-gray-400">Credit Report Dashboard</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500/70 transition-all duration-300 ease-in-out mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Your Latest Credit Report</h2>
                    {loadingReports ? (
                        <p className="text-gray-400 text-center py-4">Loading your credit report data...</p>
                    ) : latestReport ? (
                        <div className="space-y-3 text-sm text-gray-300">
                            <p><strong className="font-medium text-gray-100">Date:</strong> {new Date(latestReport.report_date).toLocaleDateString()}</p>
                            <p><strong className="font-medium text-gray-100">Bureau:</strong> {latestReport.credit_bureau}</p>
                            <p>
                                <strong className="font-medium text-gray-100">Score:</strong>{' '}
                                <span className="font-semibold text-2xl text-indigo-300">{latestReport.credit_score}</span>{' '}
                                <span className="text-gray-400">({latestReport.credit_rating})</span>
                            </p>
                            <p><strong className="font-medium text-gray-100">Credit Utilization:</strong> {latestReport.credit_utilization_percent}%</p>
                            <p><strong className="font-medium text-gray-100">Payment History:</strong> {latestReport.payment_history_percent}%</p>
                            <p><strong className="font-medium text-gray-100">Total Debt:</strong> ${latestReport.total_debt.toLocaleString()}</p>
                            <p><strong className="font-medium text-gray-100">Available Credit:</strong> ${latestReport.available_credit.toLocaleString()}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-4">No credit reports found for your account.</p>
                    )}
                </div>

                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500/70 transition-all duration-300 ease-in-out">
                    <h2 className="text-2xl font-semibold text-indigo-400 mb-4">AI Credit Health Analysis</h2>
                    <button
                        onClick={handleAnalyze}
                        disabled={analysisLoading || loadingReports}
                        className="mb-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 px-6 rounded-md transition-colors duration-150 text-base font-semibold"
                    >
                        {analysisLoading ? 'Analyzing Your Credit...' : 'Analyze with Gemini AI'}
                    </button>
                    {analysisLoading && (
                        <p className="text-sm text-gray-400 text-center mt-2">
                            Please wait while Gemini AI processes your credit information...
                        </p>
                    )}
                    {analysis && (
                        <div className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                            <ReactMarkdown>{analysis}</ReactMarkdown>
                        </div>
                    )}
                    {!analysis && !analysisLoading && (
                        <p className="text-sm text-gray-400 text-center mt-4">
                            Click the button above to get your personalized AI credit health analysis.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}