'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, strikethrough, etc.)

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
    const [loadingReports, setLoadingReports] = useState<boolean>(true); // Start with loading true
    const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);

    const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

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
        setLoadingReports(true);
        try {
            const res = await fetch(`${backendApiUrl}/user/credit-reports/customer/${email}`);
            if (!res.ok) {
                console.error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
                setReports([]);
                // Optionally: alert('Failed to fetch credit reports.');
                throw new Error('Failed to fetch reports');
            }
            const data: CreditReport[] = await res.json();
            setReports(data.sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()));
        } catch (err) {
            console.error(err);
            setReports([]);
            // Optionally: alert('An error occurred while fetching reports.');
        } finally {
            setLoadingReports(false);
        }
    };

    const handleAnalyze = async () => {
        const email = localStorage.getItem('email');
        if (!email) {
            alert('Email not found. Please log in again.');
            return;
        }
        if (reports.length === 0) {
            alert('No credit report data available to analyze. Please ensure your reports are loaded.');
            return;
        }

        setAnalysisLoading(true);
        setAnalysis(''); 
        try {
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
        } catch (err) {
            console.error(err);
            // alert('An error occurred during the credit analysis.'); 
            // Alert is now more specific from the !res.ok block
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    const latestReport = reports.length > 0 ? reports[0] : null;

    if (loadingReports && reports.length === 0) { // Show full page loader only on initial load
        return (
          <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-4 text-gray-700">Loading your credit data...</p>
          </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl lg:max-w-3xl mx-auto">
                <div className="w-full flex justify-end mb-6">
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors duration-150 text-sm font-medium focus:ring-2 focus:ring-red-400 focus:outline-none"
                    >
                        Logout
                    </button>
                </div>

                <h1 className="text-3xl font-bold mb-8 text-indigo-600 border-b border-gray-300 pb-4 text-center">
                    Credit Report Dashboard
                </h1>

                {/* Latest Credit Report Card */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-indigo-700">Your Latest Credit Report</h2>
                    {loadingReports ? (
                        <p className="text-gray-600 text-center py-4">Updating credit report data...</p>
                    ) : latestReport ? (
                        <div className="space-y-3 text-sm">
                            <p><strong className="font-medium text-gray-800">Date:</strong> <span className="text-gray-700">{new Date(latestReport.report_date).toLocaleDateString()}</span></p>
                            <p><strong className="font-medium text-gray-800">Bureau:</strong> <span className="text-gray-700">{latestReport.credit_bureau}</span></p>
                            <p>
                                <strong className="font-medium text-gray-800">Score:</strong>{' '}
                                <span className="font-semibold text-2xl text-indigo-600">{latestReport.credit_score}</span>{' '}
                                <span className="text-gray-500">({latestReport.credit_rating})</span>
                            </p>
                            <p><strong className="font-medium text-gray-800">Credit Utilization:</strong> <span className="text-gray-700">{latestReport.credit_utilization_percent}%</span></p>
                            <p><strong className="font-medium text-gray-800">Payment History:</strong> <span className="text-gray-700">{latestReport.payment_history_percent}%</span></p>
                            <p><strong className="font-medium text-gray-800">Total Debt:</strong> <span className="text-gray-700">${latestReport.total_debt.toLocaleString()}</span></p>
                            <p><strong className="font-medium text-gray-800">Available Credit:</strong> <span className="text-gray-700">${latestReport.available_credit.toLocaleString()}</span></p>
                        </div>
                    ) : (
                        <p className="text-gray-600 italic text-center py-4">No credit reports found for your account.</p>
                    )}
                </div>

                {/* AI Credit Health Analysis Card */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-indigo-700 mb-4">AI Credit Health Analysis</h2>
                    <button
                        onClick={handleAnalyze}
                        disabled={analysisLoading || loadingReports || !latestReport} // Disable if no report
                        className="mb-4 w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition duration-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        {analysisLoading ? 'Analyzing Your Credit...' : 'Analyze with AI'}
                    </button>
                    {analysisLoading && (
                        <p className="text-sm text-gray-600 text-center mt-2">
                            Please wait while Gemini AI processes your credit information...
                        </p>
                    )}
                    {analysis && !analysisLoading && (
                         <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200 prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
                        </div>
                    )}
                    {!analysis && !analysisLoading && (
                        <p className="text-sm text-gray-600 text-center mt-4">
                            {latestReport ? 'Click the button above to get your personalized AI credit health analysis.' : 'Load your credit report to enable AI analysis.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}