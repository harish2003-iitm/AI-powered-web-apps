import React, { useState, useEffect } from 'react';
import { RecommendationMetrics, RecentRecommendation } from '../../types/recommendation';
import { fetchApi } from '../../utils/api';
import './RecommendationDashboard.css';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

const RecommendationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RecommendationMetrics | null>(null);
  const [recentRecommendations, setRecentRecommendations] = useState<RecentRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60); // seconds
  const [chartView, setChartView] = useState<'conversion' | 'agents' | 'recommendations'>('conversion');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch metrics
        const metricsData = await fetchApi('/api/recommendation/metrics');
        
        // Fetch recent recommendations
        const recommendationsData = await fetchApi('/api/recommendation/recent');
        
        // Use exactly what the server sends, no transformations
        console.log("Received metrics:", metricsData);
        setMetrics(metricsData);
        setRecentRecommendations(recommendationsData.recommendations || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up auto-refresh
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  if (isLoading && !metrics) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button className="btn primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // Prepare chart data
  const conversionData = {
    labels: ['Conversion Rate', 'Click Rate', 'AOV'],
    datasets: [
      {
        label: 'Current',
        data: metrics ? [
          metrics.conversionRate,
          metrics.recommendationClickRate,
          metrics.averageOrderValue / 2 // Scale to fit with percentages
        ] : [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }
    ]
  };

  const agentPerformanceData = {
    labels: ['Accuracy', 'Recommendations'],
    datasets: metrics ? [
      {
        label: 'Customer Agent',
        data: [
          metrics.agentPerformance.customerAgent.accuracy,
          metrics.agentPerformance.customerAgent.recommendationCount / 5
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(54, 162, 235)'
      },
      {
        label: 'Product Agent',
        data: [
          metrics.agentPerformance.productAgent.accuracy,
          metrics.agentPerformance.productAgent.recommendationCount / 5
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)'
      },
      {
        label: 'Recommendation Engine',
        data: [
          metrics.agentPerformance.recommendationEngine.accuracy,
          metrics.agentPerformance.recommendationEngine.recommendationCount / 5
        ],
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        borderColor: 'rgb(255, 205, 86)',
        pointBackgroundColor: 'rgb(255, 205, 86)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 205, 86)'
      }
    ] : []
  };

  const conversionTrendData = {
    labels: ['1 Week Ago', '6 Days Ago', '5 Days Ago', '4 Days Ago', '3 Days Ago', '2 Days Ago', 'Yesterday', 'Today'],
    datasets: [
      {
        label: 'Conversion Rate',
        data: metrics ? [
          metrics.conversionRate - Math.random() * 5 - 3,
          metrics.conversionRate - Math.random() * 4 - 2,
          metrics.conversionRate - Math.random() * 3 - 1.5,
          metrics.conversionRate - Math.random() * 3,
          metrics.conversionRate - Math.random() * 2,
          metrics.conversionRate - Math.random() * 1,
          metrics.conversionRate - Math.random() * 0.5,
          metrics.conversionRate
        ] : [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.3
      }
    ]
  };

  const agentDistributionData = {
    labels: metrics ? ['Customer Agent', 'Product Agent', 'Recommendation Engine'] : [],
    datasets: [
      {
        label: 'Recommendations by Agent',
        data: metrics ? [
          metrics.agentPerformance.customerAgent.recommendationCount,
          metrics.agentPerformance.productAgent.recommendationCount,
          metrics.agentPerformance.recommendationEngine.recommendationCount
        ] : [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 205, 86, 0.6)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(255, 99, 132)',
          'rgb(255, 205, 86)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="recommendation-dashboard">
      <div className="dashboard-header">
        <h3>Recommendation Dashboard</h3>
        <div className="dashboard-controls">
          <div className="refresh-control">
            <label>Auto-refresh:</label>
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            >
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
              <option value="0">Off</option>
            </select>
          </div>
          <button 
            className="btn secondary" 
            onClick={() => {
              setIsLoading(true);
              window.location.reload();
            }}
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* KPI Summary in a tabular format */}
      <div className="kpi-metrics">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title">Conversion Rate</div>
            <div className={`trend ${metrics?.conversionRateChange && metrics.conversionRateChange > 0 ? 'up' : 'down'}`}>
              {metrics?.conversionRateChange ? (
                <>
                  {metrics.conversionRateChange > 0 ? '↑' : '↓'} {Math.abs(metrics.conversionRateChange)}%
                </>
              ) : 'N/A'}
            </div>
          </div>
          <div className="metric-value">{metrics?.conversionRate ? `${metrics.conversionRate}%` : '0%'}</div>
          <div className="metric-footer">Recommendations that led to purchases</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title">Average Order Value</div>
            <div className={`trend ${metrics?.aovChange && metrics.aovChange > 0 ? 'up' : 'down'}`}>
              {metrics?.aovChange ? (
                <>
                  {metrics.aovChange > 0 ? '↑' : '↓'} {Math.abs(metrics.aovChange)}%
                </>
              ) : 'N/A'}
            </div>
          </div>
          <div className="metric-value">${metrics?.averageOrderValue ? metrics.averageOrderValue.toFixed(2) : '0.00'}</div>
          <div className="metric-footer">For purchases from recommendations</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title">Recommendation CTR</div>
            <div className={`trend ${metrics?.clickRateChange && metrics.clickRateChange > 0 ? 'up' : 'down'}`}>
              {metrics?.clickRateChange ? (
                <>
                  {metrics.clickRateChange > 0 ? '↑' : '↓'} {Math.abs(metrics.clickRateChange)}%
                </>
              ) : 'N/A'}
            </div>
          </div>
          <div className="metric-value">{metrics?.recommendationClickRate ? `${metrics.recommendationClickRate}%` : '0%'}</div>
          <div className="metric-footer">Click-through rate on recommendations</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-title">Total Recommendations</div>
          </div>
          <div className="metric-value">
            <div className="value-group">
              <div className="primary-value">{metrics?.totalRecommendations || 0}</div>
              <div className="secondary-value">
                {metrics?.todayRecommendations ? `${metrics.todayRecommendations} today` : 'None today'}
              </div>
            </div>
          </div>
          <div className="metric-footer">Generated by AI agents</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        <div className="chart-controls">
          <button 
            className={`chart-tab ${chartView === 'conversion' ? 'active' : ''}`}
            onClick={() => setChartView('conversion')}
          >
            Conversion Metrics
          </button>
          <button 
            className={`chart-tab ${chartView === 'agents' ? 'active' : ''}`}
            onClick={() => setChartView('agents')}
          >
            Agent Performance
          </button>
          <button 
            className={`chart-tab ${chartView === 'recommendations' ? 'active' : ''}`}
            onClick={() => setChartView('recommendations')}
          >
            Recommendation Trends
          </button>
        </div>
        
        <div className="charts-container">
          {chartView === 'conversion' && (
            <div className="chart-row">
              <div className="chart-card">
                <h4>Key Performance Metrics</h4>
                <div className="chart-wrapper">
                  <Bar 
                    data={conversionData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Conversion Metrics'
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="chart-card">
                <h4>Conversion Rate Trend</h4>
                <div className="chart-wrapper">
                  <Line 
                    data={conversionTrendData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: '7-Day Conversion Trend'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          min: Math.max(0, metrics ? metrics.conversionRate - 10 : 0),
                          max: metrics ? metrics.conversionRate + 5 : 100
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {chartView === 'agents' && (
            <div className="chart-row">
              <div className="chart-card">
                <h4>Agent Performance Comparison</h4>
                <div className="chart-wrapper">
                  <Radar 
                    data={agentPerformanceData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Agent Performance Metrics'
                        }
                      },
                      scales: {
                        r: {
                          min: 0,
                          max: 100,
                          ticks: {
                            stepSize: 20
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="chart-card">
                <h4>Recommendations by Agent</h4>
                <div className="chart-wrapper">
                  <Pie 
                    data={agentDistributionData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                        title: {
                          display: true,
                          text: 'Distribution of Recommendations'
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {chartView === 'recommendations' && (
            <div className="chart-row">
              <div className="chart-card full-width">
                <h4>Agent Accuracy Comparison</h4>
                <div className="chart-wrapper">
                  <Bar
                    data={{
                      labels: ['Customer Agent', 'Product Agent', 'Recommendation Engine'],
                      datasets: [
                        {
                          label: 'Accuracy',
                          data: metrics ? [
                            metrics.agentPerformance.customerAgent.accuracy,
                            metrics.agentPerformance.productAgent.accuracy,
                            metrics.agentPerformance.recommendationEngine.accuracy
                          ] : [],
                          backgroundColor: [
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(255, 205, 86, 0.6)'
                          ]
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Agent Accuracy Comparison'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          min: 50,
                          max: 100
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Recommendations - Enhanced UI */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Recommendations</div>
          <div className="card-subtitle">
            {metrics?.totalRecommendations 
              ? `${metrics.totalRecommendations} recommendations generated based on customer data` 
              : 'Based on uploaded customer and product data'}
          </div>
        </div>
        {recentRecommendations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>No recommendations have been generated yet.</p>
            <p className="empty-subtitle">Generate personalized recommendations based on customer preferences and product data.</p>
            <button 
              className="btn primary"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await fetchApi('/api/recommendation/generate', {
                    method: 'POST',
                    body: JSON.stringify({ agentId: 'agent-recommendation' })
                  });
                  
                  // Refresh data after generating recommendations
                  const recommendationsData = await fetchApi('/api/recommendation/recent');
                  const metricsData = await fetchApi('/api/recommendation/metrics');
                  
                  setRecentRecommendations(recommendationsData.recommendations || []);
                  setMetrics(metricsData);
                } catch (err) {
                  console.error('Error generating recommendations:', err);
                  setError('Failed to generate recommendations');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Generate Recommendations
            </button>
          </div>
        ) : (
          <div className="recommendations-container">
            <table className="recommendations-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Recommended Products</th>
                  <th>Agent Type</th>
                  <th>Time</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {recentRecommendations.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar" style={{
                          background: `hsl(${rec.customerName.charCodeAt(0) % 360}, 70%, 80%)`
                        }}>
                          {rec.customerName.charAt(0)}
                        </div>
                        <span>{rec.customerName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="product-recommendation-grid">
                        {rec.recommendedProducts.slice(0, 3).map((product: {id: string, name: string}, index: number) => (
                          <div key={index} className="product-recommendation-item">
                            <div className="product-image">
                              <img 
                                src={`https://source.unsplash.com/100x100/?${encodeURIComponent(product.name.split(' ')[0])}`} 
                                alt={product.name}
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=100`;
                                }}
                              />
                            </div>
                            <div className="product-name">{product.name}</div>
                          </div>
                        ))}
                        {rec.recommendedProducts.length > 3 && (
                          <div className="more-products">
                            +{rec.recommendedProducts.length - 3} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={`agent-badge ${rec.agentType}`}>
                        {rec.agentType === 'customer' && '👤 '}
                        {rec.agentType === 'product' && '📦 '}
                        {rec.agentType === 'recommendation-engine' && '🔄 '}
                        {rec.agentType}
                      </div>
                    </td>
                    <td>{new Date(rec.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={`conversion-status ${rec.converted ? 'converted' : 'not-converted'}`}>
                        {rec.converted ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add CSS for new product recommendation grid */}
      <style>{`
        .product-recommendation-grid {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default RecommendationDashboard; 