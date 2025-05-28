'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart2, FileText, Info, Loader2, ChevronDown, ChevronUp, ArrowRight, RefreshCw } from 'lucide-react';
import ReactMarkdown, { type Components } from "react-markdown"; // Import ReactMarkdown and Components type
import remarkGfm from "remark-gfm"; // Import remarkGfm

// Custom components for ReactMarkdown to enhance table styling
const markdownComponents: Components = {
  table: (props) => (
    <div className="overflow-x-auto my-4 shadow rounded-lg border border-gray-200">
      <table
        className="min-w-full border-collapse text-sm"
        {...props}
      />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-100 " {...props} />,
  tbody: (props) => <tbody className="divide-y divide-gray-200" {...props} />,
  tr: (props) => <tr className="hover:bg-gray-50" {...props} />,
  th: (props) => (
    <th
      className="border-b border-gray-300 px-3 py-2 sm:px-4 sm:py-2 text-left font-medium text-gray-600"
      {...props}
    />
  ),
  td: (props) => <td className="border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-2" {...props} />,
};


// Define types
interface ProductRecommendation {
  recommendation_id: string; // Assuming this is the primary key from the API
  product_id: string;
  match_score: number;
  reason: string | null; // Reason can be null
  status?: string; // Optional, if part of your data
  expiration_date?: string; // Optional, if part of your data
}

interface PerformanceData {
  product_id: string; // Or a more general identifier if not product-specific
  status: string;
  count_recommendations: number;
  avg_match_score: number | null; // Can be null
  total_accepted_benefit?: number | null;
}

type ReasonAccumulator = {
  [reason: string]: { count: number; totalScore: number };
};

type ReasonStat = {
  category: string;
  score: number;
  fullReason: string;
};

type PerformanceStat = {
  name: string;
  value: number;
};

// Helper for authenticated fetch
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('email'); // Or any other user-specific items
      localStorage.removeItem('access');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?sessionExpired=true';
      }
    }
    throw new Error('Session expired or unauthorized. Please log in again.');
  }
  return response;
}

export default function RecommendationsPage() {
  // State management
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<string | null>(null);
  const [reasonEffectiveness, setReasonEffectiveness] = useState<string | null>(null);
  
  const [reasonStats, setReasonStats] = useState<ReasonStat[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStat[]>([]);
  
  const [loading, setLoading] = useState({
    recommendations: true,
    performanceReport: false,
    reasonReport: false,
  });
  // const [errorMessages, setErrorMessages] = useState({
  //   recommendations: null as string | null,
  //   performanceReport: null as string | null,
  //   reasonReport: null as string | null,
  // });

  const [activeTab, setActiveTab] = useState<'recommendations' | 'analytics'>('recommendations');
  const [analyticsTab, setAnalyticsTab] = useState<'performance' | 'reason'>('performance');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const router = useRouter();
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const processReasonStats = useCallback((data: ProductRecommendation[]) => {
    if (!data || data.length === 0) {
      setReasonStats([]);
      return;
    }
    const reasonData = Object.entries(
      data.reduce((acc: ReasonAccumulator, rec: ProductRecommendation) => {
        const reasonKey = rec.reason || "Reason not specified";
        if (!acc[reasonKey]) {
          acc[reasonKey] = { count: 0, totalScore: 0 };
        }
        acc[reasonKey].count += 1;
        acc[reasonKey].totalScore += rec.match_score || 0;
        return acc;
      }, {} as ReasonAccumulator)
    )
      .map(([reason, statsData]: [string, { count: number; totalScore: number }]) => ({
        category: reason.length > 20 ? reason.substring(0, 17) + "..." : reason,
        score: statsData.count > 0 ? Math.round(statsData.totalScore / statsData.count) : 0,
        fullReason: reason,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); 
    setReasonStats(reasonData);
  }, []);

  const fetchRecommendations = useCallback(async () => {
    if (!backendApiUrl) {
      console.error("Backend API URL not configured.");
      setLoading(prev => ({ ...prev, recommendations: false }));
      return;
    }
    setLoading(prev => ({ ...prev, recommendations: true }));
    try {
      const res = await authFetch(`${backendApiUrl}/product_recommendations`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to fetch recommendations" }));
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data: ProductRecommendation[] = await res.json();
      setRecommendations(data);
      processReasonStats(data); 
    } catch (error: unknown) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
      setReasonStats([]);
    } finally {
      setLoading(prev => ({ ...prev, recommendations: false }));
    }
  }, [backendApiUrl, processReasonStats]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");

    if (!authToken) {
      router.push("/login");
      return;
    }
    if (userAccessLevel !== "client") {
      alert("You do not have permission to access this page.");
      localStorage.clear(); 
      router.push("/login");
      return;
    }
    
    if (backendApiUrl) {
      fetchRecommendations();
    } else {
      setLoading(prev => ({ ...prev, recommendations: false }));
      console.error("Backend API URL not configured for initial load.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, backendApiUrl]); // fetchRecommendations is memoized


  const processPerformancePieChartData = useCallback((rawData: PerformanceData[]) => {
    if (!rawData || rawData.length === 0) {
        setPerformanceStats([]);
        return;
    }
    const statusCounts = rawData.reduce((acc: Record<string, number>, item: PerformanceData) => {
        const statusKey = item.status || "Unknown";
        acc[statusKey] = (acc[statusKey] || 0) + (item.count_recommendations || 0);
        return acc;
    }, {});

    const pieData = Object.entries(statusCounts)
        .map(([status, count]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
        }))
        .filter(item => item.value > 0);

    setPerformanceStats(pieData.length > 0 ? pieData : []);
  }, []);
  
  const fetchPerformanceReportAndData = useCallback(async () => {
    if (!backendApiUrl) {
      console.error("Backend API URL not configured.");
      return;
    }
    setLoading(prev => ({ ...prev, performanceReport: true }));
    setPerformanceSummary(null);
    setPerformanceStats([]);

    try {
      const reportRes = await authFetch(`${backendApiUrl}/client/recommendations/agent/performance-summary`);
      if (!reportRes.ok) {
        const errorData = await reportRes.json().catch(() => ({ detail: "Failed to fetch performance report" }));
        throw new Error(`Report: ${errorData.detail || `HTTP ${reportRes.status}: ${reportRes.statusText}`}`);
      }
      const reportData = await reportRes.json();
      setPerformanceSummary(reportData.analysis_report || "No performance analysis content received.");

      const rawDataRes = await authFetch(`${backendApiUrl}/client/recommendations/performance-data`);
      if (!rawDataRes.ok) {
          console.error("Could not fetch raw performance data for chart");
      } else {
        const rawData: PerformanceData[] = await rawDataRes.json();
        processPerformancePieChartData(rawData);
      }

    } catch (error: unknown) {
      console.error('Error fetching performance summary/data:', error);
      setPerformanceSummary("Error fetching performance data. Please try again."); 
    } finally {
      setLoading(prev => ({ ...prev, performanceReport: false }));
    }
  }, [backendApiUrl, processPerformancePieChartData]);
  
  const fetchReasonEffectivenessReport = useCallback(async () => {
    if (!backendApiUrl) {
      console.error("Backend API URL not configured.");
      return;
    }
    setLoading(prev => ({ ...prev, reasonReport: true }));
    setReasonEffectiveness(null);
    try {
      const res = await authFetch(`${backendApiUrl}/client/recommendations/agent/reason-effectiveness`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Failed to fetch reason effectiveness report" }));
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setReasonEffectiveness(data.reason_effectiveness_report || data.analysis || "No reason effectiveness analysis content received.");
      if (recommendations.length > 0 && reasonStats.length === 0) {
        processReasonStats(recommendations);
      }
    } catch (error: unknown) {
      console.error('Error fetching reason effectiveness report:', error);
      setReasonEffectiveness("Error fetching reason effectiveness data. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, reasonReport: false }));
    }
  }, [backendApiUrl, recommendations, reasonStats.length, processReasonStats]);

  const toggleCardExpansion = (recommendationId: string) => {
    setExpandedCard(prev => (prev === recommendationId ? null : recommendationId));
  };

  const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d88486', '#82ca9d'];

  const renderLoadingSpinner = (text: string = "Loading...") => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  );

  const renderNoData = (title: string, message: string, onRetry?: () => void) => (
    <div className="bg-white p-8 sm:p-12 rounded-lg shadow-md text-center">
      <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Financial Products Dashboard</h1>
            <div className="hidden sm:flex space-x-1">
              <button
                className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                  activeTab === 'recommendations' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('recommendations')}
              >
                Recommendations
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                  activeTab === 'analytics' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
            </div>
            
            <div className="sm:hidden">
              <select 
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as 'recommendations' | 'analytics')}
              >
                <option value="recommendations">Recommendations</option>
                <option value="analytics">Analytics</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Product Recommendations</h2>
              <button 
                onClick={fetchRecommendations}
                disabled={loading.recommendations}
                className="mt-2 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all disabled:opacity-50"
              >
                {loading.recommendations ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh Recommendations
              </button>
            </div>
            
            {loading.recommendations ? (
              renderLoadingSpinner("Loading recommendations...")
            ) : recommendations.length > 0 ? (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Recommendations Overview (by Match Score)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={recommendations.slice(0, 5).map(rec => ({
                          name: `Product ${rec.product_id}`,
                          score: rec.match_score
                        }))}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {recommendations.map((rec) => (
                    <div 
                      key={rec.recommendation_id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg flex flex-col"
                    >
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-lg font-semibold text-gray-800">Product ID: {rec.product_id}</h3>
                          <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rec.match_score}% Match
                          </span>
                        </div>
                        {rec.expiration_date && <p className="text-xs text-gray-500 mt-1">Expires: {new Date(rec.expiration_date).toLocaleDateString()}</p>}
                      </div>
                      
                      <div className={`px-5 py-4 text-sm text-gray-600 flex-grow custom-scrollbar ${ // Added custom-scrollbar here
                        expandedCard === rec.recommendation_id 
                          ? 'max-h-[200px] overflow-y-auto' 
                          : 'max-h-24 overflow-hidden relative after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-5 after:bg-gradient-to-t after:from-white after:to-transparent'
                        }`}
                      >
                        <p>{rec.reason || "No specific reason provided."}</p>
                      </div>
                      
                      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <button 
                          onClick={() => toggleCardExpansion(rec.recommendation_id)}
                          className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                        >
                          {expandedCard === rec.recommendation_id ? "Show Less" : "Show More"}
                          {expandedCard === rec.recommendation_id ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
                        </button>
                        <button 
                            onClick={() => router.push(`/client/products/${rec.product_id}`)} 
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                          View Product <ArrowRight className="ml-1 w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              renderNoData("No Recommendations", "No active product recommendations found.", fetchRecommendations)
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px" aria-label="Tabs">
                  <button
                    onClick={() => setAnalyticsTab('performance')}
                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm focus:outline-none ${
                      analyticsTab === 'performance'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BarChart2 className="inline-block mr-2 w-5 h-5" />
                    Performance Summary
                  </button>
                  <button
                    onClick={() => setAnalyticsTab('reason')}
                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm focus:outline-none ${
                      analyticsTab === 'reason'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Info className="inline-block mr-2 w-5 h-5" />
                    Reason Effectiveness
                  </button>
                </nav>
              </div>
              
              <div className="p-6">
                {analyticsTab === 'performance' && (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Performance Summary Report</h3>
                      <button
                        onClick={fetchPerformanceReportAndData}
                        disabled={loading.performanceReport}
                        className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-150 ${
                          loading.performanceReport
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {loading.performanceReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {performanceSummary ? "Refresh Report" : "Generate Report"}
                      </button>
                    </div>
                    
                    {loading.performanceReport ? renderLoadingSpinner("Generating performance report...") :
                     performanceSummary ? (
                      <div className="bg-gray-50 rounded-lg p-6 shadow-inner">
                        <div className="prose prose-sm max-w-none text-gray-700 custom-scrollbar max-h-[400px] overflow-y-auto"> {/* Changed from pre to ReactMarkdown */}
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {performanceSummary}
                            </ReactMarkdown>
                        </div>
                        
                        {performanceStats.length > 0 && (
                           <div className="mt-8 border-t border-gray-200 pt-6">
                             <h4 className="text-md font-medium mb-4 text-gray-700">
                               Recommendation Status Distribution
                             </h4>
                             <div className="h-64 sm:h-72">
                               <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                   <Pie 
                                        data={performanceStats} 
                                        cx="50%" cy="50%" 
                                        outerRadius="80%" 
                                        dataKey="value" 
                                        nameKey="name" 
                                        labelLine={false}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                                            const RADIAN = Math.PI / 180;
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            return (percent * 100) > 3 ? (
                                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                                                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                                                </text>
                                            ) : null;
                                        }}
                                    >
                                     {performanceStats.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                     ))}
                                   </Pie>
                                   <Tooltip formatter={(value: number, name: string) => [value, name]} />
                                   <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                                 </PieChart>
                               </ResponsiveContainer>
                             </div>
                           </div>
                          )}
                      </div>
                    ) : (
                      renderNoData("No Performance Report", "Generate a report to view performance analytics.", fetchPerformanceReportAndData)
                    )}
                  </div>
                )}
                
                {analyticsTab === 'reason' && (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                       <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Reason Effectiveness Analysis</h3>
                      <button
                        onClick={fetchReasonEffectivenessReport}
                        disabled={loading.reasonReport}
                        className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-150 ${
                          loading.reasonReport
                            ? 'bg-green-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {loading.reasonReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {reasonEffectiveness ? "Refresh Analysis" : "Generate Analysis"}
                      </button>
                    </div>
                    
                    {loading.reasonReport ? renderLoadingSpinner("Analyzing reason effectiveness...") : 
                     reasonEffectiveness ? (
                      <div className="bg-gray-50 rounded-lg p-6 shadow-inner">
                        <div className="prose prose-sm max-w-none text-gray-700 custom-scrollbar max-h-[400px] overflow-y-auto"> {/* Changed from pre to ReactMarkdown */}
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {reasonEffectiveness}
                            </ReactMarkdown>
                        </div>
                        
                        {reasonStats.length > 0 && (
                            <div className="mt-8 border-t border-gray-200 pt-6">
                            <h4 className="text-md font-medium mb-4 text-gray-700">
                              Reason Impact on Match Score (Top Reasons by Avg. Score)
                            </h4>
                            <div className="h-64 sm:h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reasonStats} margin={{ top: 5, right: 5, left: -25, bottom: 50 }}>
                                  <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={60} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                  <Tooltip
                                    formatter={(value: number) => [value, "Avg. Match Score"]}
                                    labelFormatter={(label: string) => {
                                      const item = reasonStats.find(rs => rs.category === label);
                                      return item ? item.fullReason : label;
                                    }}
                                    cursor={{fill: 'rgba(230, 230, 250, 0.5)'}}
                                  />
                                  <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]}>
                                     {reasonStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      renderNoData("No Reason Analysis", "Generate an analysis to view reasoning effectiveness.", fetchReasonEffectivenessReport)
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-40">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex flex-col items-center py-3 flex-1 transition-colors ${activeTab === 'recommendations' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs mt-1">Recommendations</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center py-3 flex-1 transition-colors ${activeTab === 'analytics' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="text-xs mt-1">Analytics</span>
        </button>
      </div>
      <style jsx global>{`
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c7c7c7; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #c7c7c7 #f1f1f1; }

        /* Prose styles for ReactMarkdown content */
        .prose {
          line-height: 1.6;
        }
        .prose h3 { /* Example: Adjust heading margins if needed */
            margin-top: 1em;
            margin-bottom: 0.5em;
        }
        .prose p:last-child { /* Remove bottom margin from last paragraph in a prose block */
            margin-bottom: 0;
        }
        .prose ul, .prose ol { /* Add left margin to lists */
            margin-left: 1.25rem; /* Corresponds to Tailwind's pl-5 */
        }
        .prose pre { /* Ensure preformatted text respects prose styles */
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background-color: transparent; /* Remove default pre background if you want it to inherit from .bg-gray-50 */
          padding: 0; /* Remove default pre padding if inheriting */
          border: 0; /* Remove default pre border */
          white-space: pre-wrap; /* Allow wrapping */
        }
        /* Apply custom scrollbar to specific elements */
        .max-h-[200px].overflow-y-auto.custom-scrollbar, 
        .max-h-[400px].overflow-y-auto.custom-scrollbar {
           /* Styles already defined by .custom-scrollbar */
        }
      `}</style>
    </div>
  );
}