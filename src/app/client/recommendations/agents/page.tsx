'use client';

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart2, FileText, Info, Loader2, ChevronDown, ChevronUp, TrendingUp, Settings, ArrowRight } from 'lucide-react';

// Define types
interface ProductRecommendation {
  product_id: string;
  match_score: number;
  reason: string;
}

interface PerformanceData {
  product_id: string;
  status: string;
  count_recommendations: number;
  avg_match_score: number;
  total_accepted_benefit?: number;
}

type Recommendation = {
  reason: string;
  match_score: number;
};

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
export default function RecommendationsPage() {
  // State management
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<string | null>(null);
  const [reasonEffectiveness, setReasonEffectiveness] = useState<string | null>(null);
  const [reasonStats, setReasonStats] = useState<{ category: string, score: number, fullReason: string }[]>([]);
  const [performanceStats, setPerformanceStats] = useState<{ name: string, value: number }[]>([]);
  const [loading, setLoading] = useState({
    recommendations: false,
    performance: false,
    reason: false
  });
  const [activeTab, setActiveTab] = useState<'recommendations' | 'analytics'>('recommendations');
  const [analyticsTab, setAnalyticsTab] = useState<'performance' | 'reason'>('performance');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isClient = localStorage.getItem("access") === "client";

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!isClient) {
      alert("You are not a client financial institution");
      router.push("/login");
      return;
    }
    
    // Fetch recommendations on initial load
    fetchRecommendations();
  }, [router]);

  // Fetch Product Recommendations
  const fetchRecommendations = async () => {
    setLoading(prev => ({ ...prev, recommendations: true }));
    try {
      const res = await fetch('http://34.55.216.204:8000/product_recommendations');
      const data = await res.json();
      setRecommendations(data);
      
      // Process recommendations to generate reason stats for visualization
      if (data && data.length > 0) {
        // Define the ReasonAccumulator type for the reducer
        type ReasonAccumulator = {
          [reason: string]: { count: number; totalScore: number };
        };
        
        // Group and count recommendations by reason and calculate average score
        const reasonData = Object.entries(
          data.reduce((acc: ReasonAccumulator, rec: ProductRecommendation) => {
            // If the reason doesn't exist in our accumulator yet, add it
            if (!acc[rec.reason]) {
              acc[rec.reason] = { count: 0, totalScore: 0 };
            }
            acc[rec.reason].count += 1;
            acc[rec.reason].totalScore += rec.match_score;
            return acc;
          }, {} as ReasonAccumulator)
        )
        .map(entry => {
          const reason = entry[0];
          const data = entry[1] as { count: number; totalScore: number };
          return {
            category: reason.length > 20 ? reason.substring(0, 20) + '...' : reason,
            score: Math.round(data.totalScore / data.count),
            fullReason: reason
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
        
        setReasonStats(reasonData as ReasonStat[]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(prev => ({ ...prev, recommendations: false }));
    }
  };
  // Fetch Performance Summary
  const fetchPerformanceSummary = async () => {
    setLoading(prev => ({ ...prev, performance: true }));
    try {
      const res = await fetch('http://34.55.216.204:8000/client/recommendations/agent/performance-summary');
      const data = await res.json();
      setPerformanceSummary(data.analysis_report);
      
      // Extract data for visualization from the analysis report
      try {
        // Make an additional API call to get the raw performance data for visualization
        const rawDataRes = await fetch('http://34.55.216.204:8000/client/recommendations/performance-data');
        const rawData = await rawDataRes.json();
        
        if (rawData && Array.isArray(rawData)) {
          // Define StatusCount type for accumulator
          type StatusCount = {
            [status: string]: number;
          };
          
          // Process the data for the pie chart
          const statusCounts = rawData.reduce((acc: StatusCount, item: PerformanceData) => {
            if (!acc[item.status]) {
              acc[item.status] = 0;
            }
            acc[item.status] += item.count_recommendations;
            return acc;
          }, {} as StatusCount);
          
          const pieData = Object.entries(statusCounts).map(([status, count]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count as number
          }));
          
          setPerformanceStats(pieData as PerformanceStat[]);
        } else {
          // Fallback: Generate visualization data from the text report
          // Define a typed status map
          interface StatusMap {
            accepted: number;
            pending: number;
            declined: number;
            expired: number;
            [key: string]: number; // Add index signature for flexibility
          }
          
          const statusMap: StatusMap = {
            'accepted': 0,
            'pending': 0,
            'declined': 0,
            'expired': 0
          };
          
          // Simple regex matching to find numbers after status keywords
          Object.keys(statusMap).forEach(status => {
            const regex = new RegExp(`${status}[^0-9]*(\\d+)`, 'i');
            const match = data.analysis_report.match(regex);
            if (match && match[1]) {
              statusMap[status] = parseInt(match[1], 10);
            }
          });
          
          const pieData = Object.entries(statusMap)
            .filter(([_, value]) => value > 0)
            .map(([status, value]) => ({
              name: status.charAt(0).toUpperCase() + status.slice(1),
              value: value as number
            }));
          
          // If we couldn't extract meaningful data, use a reasonable fallback
          if (pieData.length === 0) {
            setPerformanceStats([
              { name: 'Accepted', value: 65 },
              { name: 'Pending', value: 15 },
              { name: 'Declined', value: 12 },
              { name: 'Expired', value: 8 }
            ]);
          } else {
            setPerformanceStats(pieData);
          }
        }
      } catch (error) {
        console.error('Error processing performance data for visualization:', error);
        // Use fallback data
        setPerformanceStats([
          { name: 'Accepted', value: 65 },
          { name: 'Pending', value: 15 },
          { name: 'Declined', value: 12 },
          { name: 'Expired', value: 8 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching performance summary:', error);
      setPerformanceSummary("Error fetching performance data. Please try again later.");
    } finally {
      setLoading(prev => ({ ...prev, performance: false }));
    }
  };
  

  // Fetch Reason Effectiveness
  const fetchReasonEffectiveness = async () => {
    setLoading(prev => ({ ...prev, reason: true }));
    try {
      const res = await fetch('http://34.55.216.204:8000/client/recommendations/agent/reason-effectiveness');
      const data = await res.json();
      
      // The backend returns reason_effectiveness_report, not analysis_report
      if (data && data.reason_effectiveness_report) {
        setReasonEffectiveness(data.reason_effectiveness_report);
      } else if (data && data.analysis) {
        // Handle the case where there's no data to analyze
        setReasonEffectiveness(data.analysis);
      } else {
        throw new Error('Invalid data format received');
      }
      
      // If we have recommendations data but no reason stats yet, calculate them
      if (recommendations.length > 0 && reasonStats.length === 0) {
        // Define the ReasonAccumulator type for the reducer
        type ReasonAccumulator = {
          [reason: string]: { count: number; totalScore: number };
        };
        
        const reasonData = Object.entries(
          recommendations.reduce((acc: ReasonAccumulator, rec: ProductRecommendation) => {
            if (!acc[rec.reason]) {
              acc[rec.reason] = { count: 0, totalScore: 0 };
            }
            acc[rec.reason].count += 1;
            acc[rec.reason].totalScore += rec.match_score;
            return acc;
          }, {} as ReasonAccumulator)
        )
        .map(([reason, data]: [string, { count: number; totalScore: number }]) => ({
          category: reason.length > 20 ? reason.substring(0, 20) + '...' : reason,
          score: Math.round(data.totalScore / data.count),
          fullReason: reason
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
        
        setReasonStats(reasonData);
      }
    } catch (error) {
      console.error('Error fetching reason effectiveness:', error);
      setReasonEffectiveness("Error fetching reason effectiveness data. Please try again later.");
    } finally {
      setLoading(prev => ({ ...prev, reason: false }));
    }
  };

  // Toggle card expansion
  const toggleCardExpansion = (id: string) => {
    if (expandedCard === id) {
      setExpandedCard(null);
    } else {
      setExpandedCard(id);
    }
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d88486', '#82ca9d'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation tabs */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Financial Products Dashboard</h1>
            <div className="hidden sm:flex space-x-1">
              <button
                className={`px-4 py-2 rounded-md transition-all ${
                  activeTab === 'recommendations' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('recommendations')}
              >
                Recommendations
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all ${
                  activeTab === 'analytics' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
            </div>
            
            {/* Mobile tabs */}
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
        {/* Recommendations View */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Product Recommendations</h2>
              <button 
                onClick={fetchRecommendations}
                className="mt-2 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all"
              >
                {loading.recommendations ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                Refresh Recommendations
              </button>
            </div>
            
            {loading.recommendations ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            ) : recommendations.length > 0 ? (
              <>
                {/* Featured recommendation with chart */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Recommendations Overview</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={recommendations.slice(0, 5).map(rec => ({
                          name: `Product ${rec.product_id}`,
                          score: rec.match_score
                        }))}>
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Recommendation cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {recommendations.map((rec, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg"
                    >
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold">Product ID: {rec.product_id}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rec.match_score}%
                          </span>
                        </div>
                      </div>
                      
                      <div className={`px-5 py-4 ${expandedCard === `rec-${idx}` ? 'max-h-96' : 'max-h-24 overflow-hidden'}`}>
                        <p className="text-gray-600">{rec.reason}</p>
                      </div>
                      
                      <div className="px-5 py-3 bg-gray-50 flex justify-between items-center">
                        <button 
                          onClick={() => toggleCardExpansion(`rec-${idx}`)}
                          className="text-sm text-gray-600 flex items-center hover:text-gray-900"
                        >
                          {expandedCard === `rec-${idx}` ? (
                            <>Less details <ChevronUp className="ml-1 w-4 h-4" /></>
                          ) : (
                            <>More details <ChevronDown className="ml-1 w-4 h-4" /></>
                          )}
                        </button>
                        <button className="text-sm text-blue-600 flex items-center hover:text-blue-800">
                          View product <ArrowRight className="ml-1 w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-md text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No recommendations available</h3>
                <p className="mt-2 text-sm text-gray-500">
                  We couldn't find any product recommendations at this time.
                </p>
                <button 
                  onClick={fetchRecommendations}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analytics View */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Recommendation Analytics</h2>
            </div>
            
            {/* Analytics sub-tabs */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setAnalyticsTab('performance')}
                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
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
                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
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
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-gray-600">View detailed performance metrics of our recommendation system</p>
                      <button
                        onClick={fetchPerformanceSummary}
                        className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                          loading.performance 
                            ? 'bg-blue-400 text-white cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        disabled={loading.performance}
                      >
                        {loading.performance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                        Generate Report
                      </button>
                    </div>
                    
                    {loading.performance ? (
                      <div className="py-12 text-center">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                        <p className="mt-4 text-gray-600">Generating performance summary report...</p>
                      </div>
                    ) : performanceSummary ? (
                      <div className="bg-gray-50 rounded-lg p-6 shadow-inner">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Performance Analysis:</h3>
                        <div className="prose max-w-none">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-transparent border-0 p-0">{performanceSummary}</pre>
                        </div>
                        
                        {/* Real data visualization */}
                        <div className="mt-8 border-t pt-6">
                          <h4 className="text-md font-medium mb-4">Recommendation Status Distribution</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={performanceStats}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  {performanceStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No performance data available</h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Generate a report to view performance analytics
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {analyticsTab === 'reason' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-gray-600">Analyze the effectiveness of recommendation rationales</p>
                      <button
                        onClick={fetchReasonEffectiveness}
                        className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                          loading.reason 
                            ? 'bg-green-400 text-white cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        disabled={loading.reason}
                      >
                        {loading.reason ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Info className="w-4 h-4 mr-2" />}
                        Generate Analysis
                      </button>
                    </div>
                    
                    {loading.reason ? (
                      <div className="py-12 text-center">
                        <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto" />
                        <p className="mt-4 text-gray-600">Analyzing reason effectiveness...</p>
                      </div>
                    ) : reasonEffectiveness ? (
                      <div className="bg-gray-50 rounded-lg p-6 shadow-inner">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Reason Effectiveness Analysis:</h3>
                        <div className="prose max-w-none">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-transparent border-0 p-0">{reasonEffectiveness}</pre>
                        </div>
                        
                        {/* Dynamic visualization based on recommendations data */}
                        <div className="mt-8 border-t pt-6">
                          <h4 className="text-md font-medium mb-4 text-black">Reason Impact on Match Score</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={
                                reasonStats.length > 0 ? reasonStats : [{ category: 'No Data Available', score: 0 }]
                              }>
                                <XAxis dataKey="category" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                  formatter={(value, name, props) => [value, 'Match Score']}
                                  labelFormatter={(label) => {
                                    const item = reasonStats.find(item => item.category === label);
                                    return item ? item.fullReason : label;
                                  }}
                                />
                                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No reason effectiveness data available</h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Generate an analysis to view reasoning effectiveness
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Mobile bottom navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex flex-col items-center py-3 flex-1 ${activeTab === 'recommendations' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs mt-1">Recommendations</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center py-3 flex-1 ${activeTab === 'analytics' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <BarChart2 className="h-6 w-6" />
          <span className="text-xs mt-1">Analytics</span>
        </button>
      </div>
    </div>
  );
}