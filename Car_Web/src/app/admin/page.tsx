"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Car {
  id: number;
  driver_id: string;
  car_id: string;
  driver_name: string;
  city: string;
  vehicle_type: string;
  status: string;
  vehicle_age: number;
  trips_per_month: number;
  battery_health: number;
  charge_per_km: number;
  garage_cost: number;
  charging_cost: number;
  maintenance_cost: number;
  total_operating_cost: number;
  gross_revenue: number;
  driver_charge: number;
  overspeed_count: number;
  max_speed: number;
}

interface MLStats {
  summary: {
    total_revenue: number;
    avg_revenue: number;
    total_km: number;
    avg_battery_health: number;
    total_maintenance_cost: number;
    vehicle_count: number;
  };
  by_vehicle_type: Array<{
    vehicle_type: string;
    cars: number;
    total_revenue: number;
    avg_revenue: number;
    total_km: number;
    avg_battery_health: number;
    total_maintenance_cost: number;
  }>;
}

interface TrendData {
  dates: string[];
  values: number[];
}

function AdminManagementContent() {
  const [mlStats, setMlStats] = useState<MLStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<TrendData | null>(null);
  const [kmTrend, setKmTrend] = useState<TrendData | null>(null);
  const [earningsTrend, setEarningsTrend] = useState<TrendData | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("All");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMLStats();
    loadVehicleTypes();
    loadTrendData();
  }, []);

  useEffect(() => {
    loadMLStats();
  }, [selectedVehicleType]);

  const loadMLStats = async () => {
    setLoading(true);
    try {
      const url = selectedVehicleType && selectedVehicleType !== "All"
        ? `${API_BASE_URL}/api/ml/stats?vehicle_type=${encodeURIComponent(selectedVehicleType)}`
        : `${API_BASE_URL}/api/ml/stats`;
      
      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();
      if (response.ok) {
        setMlStats(data);
      }
    } catch (err) {
      console.error("Error loading ML stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml/vehicle-types`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setVehicleTypes(["All", ...data.vehicle_types]);
      }
    } catch (err) {
      console.error("Error loading vehicle types:", err);
    }
  };

  const loadTrendData = async () => {
    try {
      // Load revenue trend
      const revenueRes = await fetch(`${API_BASE_URL}/api/ml/monthly-trend?metric=gross_revenue&months=12`, {
        credentials: "include",
      });
      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        setRevenueTrend(revenueData);
      }

      // Load KM driven trend
      const kmRes = await fetch(`${API_BASE_URL}/api/ml/monthly-trend?metric=total_km_driven&months=12`, {
        credentials: "include",
      });
      if (kmRes.ok) {
        const kmData = await kmRes.json();
        setKmTrend(kmData);
      }

      // Load driver earnings trend
      const earningsRes = await fetch(`${API_BASE_URL}/api/ml/monthly-trend?metric=driver_earnings&months=12`, {
        credentials: "include",
      });
      if (earningsRes.ok) {
        const earningsData = await earningsRes.json();
        setEarningsTrend(earningsData);
      }
    } catch (err) {
      console.error("Error loading trend data:", err);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            ML-powered fleet analytics and insights by vehicle models
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Vehicle Type Filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Vehicle Type
            </label>
            <select
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm w-full md:w-64"
            >
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading analytics...</div>
          ) : mlStats ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Vehicles</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {mlStats.summary.vehicle_count}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-2">
                    ₹{(mlStats.summary.total_revenue / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Avg Revenue</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    ₹{(mlStats.summary.avg_revenue / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total KM</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {(mlStats.summary.total_km / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Avg Battery Health</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {mlStats.summary.avg_battery_health.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Maintenance Cost</p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    ₹{(mlStats.summary.total_maintenance_cost / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Revenue Pie Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Distribution by Model</h3>
                  <div className="flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-48 h-48">
                      {(() => {
                        const total = mlStats.by_vehicle_type.reduce((sum, item) => sum + item.total_revenue, 0);
                        let currentAngle = 0;
                        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
                        
                        return mlStats.by_vehicle_type.map((item, idx) => {
                          const percentage = (item.total_revenue / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;
                          currentAngle = endAngle;
                          
                          const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
                          const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
                          const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
                          const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={idx}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[idx % colors.length]}
                              className="hover:opacity-80 transition-opacity"
                            />
                          );
                        });
                      })()}
                      <circle cx="100" cy="100" r="50" fill="white" />
                      <text x="100" y="100" textAnchor="middle" dy=".3em" className="text-sm font-bold fill-slate-700">
                        Revenue
                      </text>
                    </svg>
                  </div>
                  <div className="mt-4 space-y-2">
                    {mlStats.by_vehicle_type.map((item, idx) => {
                      const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
                      const total = mlStats.by_vehicle_type.reduce((sum, v) => sum + v.total_revenue, 0);
                      const percentage = ((item.total_revenue / total) * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                            <span className="text-slate-700">{item.vehicle_type}</span>
                          </div>
                          <span className="font-semibold text-slate-900">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Count Pie Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Fleet Distribution by Model</h3>
                  <div className="flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-48 h-48">
                      {(() => {
                        const total = mlStats.by_vehicle_type.reduce((sum, item) => sum + item.cars, 0);
                        let currentAngle = 0;
                        const colors = ['#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
                        
                        return mlStats.by_vehicle_type.map((item, idx) => {
                          const percentage = (item.cars / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;
                          currentAngle = endAngle;
                          
                          const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
                          const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
                          const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
                          const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={idx}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[idx % colors.length]}
                              className="hover:opacity-80 transition-opacity"
                            />
                          );
                        });
                      })()}
                      <circle cx="100" cy="100" r="50" fill="white" />
                      <text x="100" y="100" textAnchor="middle" dy=".3em" className="text-sm font-bold fill-slate-700">
                        Vehicles
                      </text>
                    </svg>
                  </div>
                  <div className="mt-4 space-y-2">
                    {mlStats.by_vehicle_type.map((item, idx) => {
                      const colors = ['bg-red-500', 'bg-cyan-500', 'bg-pink-500', 'bg-lime-500'];
                      const total = mlStats.by_vehicle_type.reduce((sum, v) => sum + v.cars, 0);
                      const percentage = ((item.cars / total) * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                            <span className="text-slate-700">{item.vehicle_type}</span>
                          </div>
                          <span className="font-semibold text-slate-900">{item.cars} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue Bar Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Comparison</h3>
                  <div className="space-y-3">
                    {mlStats.by_vehicle_type.map((item, idx) => {
                      const maxRevenue = Math.max(...mlStats.by_vehicle_type.map(v => v.total_revenue));
                      const percentage = (item.total_revenue / maxRevenue) * 100;
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700">{item.vehicle_type}</span>
                            <span className="text-emerald-600 font-semibold">
                              ₹{(item.total_revenue / 1000000).toFixed(2)}M
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                            <span>{item.cars} vehicles</span>
                            <span>{(item.total_km / 1000).toFixed(0)}K km</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Maintenance Cost Comparison */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Maintenance Cost Analysis</h3>
                  <svg viewBox="0 0 400 300" className="w-full">
                    {(() => {
                      const maxCost = Math.max(...mlStats.by_vehicle_type.map(m => m.total_maintenance_cost));
                      const barWidth = 60;
                      const spacing = 20;
                      const startX = 50;
                      const colors = ['#f59e0b', '#fb923c', '#f43f5e', '#facc15'];
                      
                      return (
                        <g>
                          {/* Axes */}
                          <line x1="40" y1="30" x2="40" y2="220" stroke="#64748b" strokeWidth="2" />
                          <line x1="40" y1="220" x2="380" y2="220" stroke="#64748b" strokeWidth="2" />
                          
                          {/* Bars */}
                          {mlStats.by_vehicle_type.map((model, idx) => {
                            const barHeight = (model.total_maintenance_cost / maxCost) * 180;
                            const x = startX + idx * (barWidth + spacing);
                            
                            return (
                              <g key={idx}>
                                <defs>
                                  <linearGradient id={`maintGrad${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={colors[idx % colors.length]} stopOpacity="0.9" />
                                    <stop offset="100%" stopColor={colors[idx % colors.length]} stopOpacity="0.6" />
                                  </linearGradient>
                                </defs>
                                <rect
                                  x={x}
                                  y={220 - barHeight}
                                  width={barWidth}
                                  height={barHeight}
                                  fill={`url(#maintGrad${idx})`}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth="2"
                                  rx="4"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={240}
                                  fontSize="11"
                                  fill="#475569"
                                  textAnchor="middle"
                                  fontWeight="500"
                                >
                                  {model.vehicle_type}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={205 - barHeight}
                                  fontSize="12"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                  fontWeight="700"
                                >
                                  ₹{(model.total_maintenance_cost / 1000000).toFixed(1)}M
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                  <div className="mt-2 text-xs text-slate-500 text-center">
                    Total Maintenance Cost by Vehicle Model
                  </div>
                </div>

                {/* KM Driven Bar Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Total KM Driven</h3>
                  <svg viewBox="0 0 400 300" className="w-full">
                    {(() => {
                      const maxKm = Math.max(...mlStats.by_vehicle_type.map(m => m.total_km));
                      const barWidth = 60;
                      const spacing = 20;
                      const startX = 50;
                      const colors = ['#a855f7', '#6366f1', '#3b82f6', '#0ea5e9'];
                      
                      return (
                        <g>
                          {/* Axes */}
                          <line x1="40" y1="30" x2="40" y2="220" stroke="#64748b" strokeWidth="2" />
                          <line x1="40" y1="220" x2="380" y2="220" stroke="#64748b" strokeWidth="2" />
                          
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4].map((i) => (
                            <line
                              key={i}
                              x1="40"
                              y1={30 + i * 47.5}
                              x2="380"
                              y2={30 + i * 47.5}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              strokeDasharray="4"
                            />
                          ))}
                          
                          {/* Bars */}
                          {mlStats.by_vehicle_type.map((model, idx) => {
                            const barHeight = (model.total_km / maxKm) * 180;
                            const x = startX + idx * (barWidth + spacing);
                            
                            return (
                              <g key={idx}>
                                <defs>
                                  <linearGradient id={`kmGrad${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={colors[idx % colors.length]} stopOpacity="0.9" />
                                    <stop offset="100%" stopColor={colors[idx % colors.length]} stopOpacity="0.6" />
                                  </linearGradient>
                                </defs>
                                <rect
                                  x={x}
                                  y={220 - barHeight}
                                  width={barWidth}
                                  height={barHeight}
                                  fill={`url(#kmGrad${idx})`}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth="2"
                                  rx="4"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={240}
                                  fontSize="11"
                                  fill="#475569"
                                  textAnchor="middle"
                                  fontWeight="500"
                                >
                                  {model.vehicle_type}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={205 - barHeight}
                                  fontSize="12"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                  fontWeight="700"
                                >
                                  {(model.total_km / 1000000).toFixed(1)}M
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                  <div className="mt-2 text-xs text-slate-500 text-center">
                    Distance Traveled by Vehicle Model (in millions of km)
                  </div>
                </div>

                {/* Average Revenue per Vehicle */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Avg Revenue per Vehicle</h3>
                  <svg viewBox="0 0 400 300" className="w-full">
                    {(() => {
                      const maxAvgRevenue = Math.max(...mlStats.by_vehicle_type.map(m => m.avg_revenue));
                      const barWidth = 60;
                      const spacing = 20;
                      const startX = 50;
                      const colors = ['#3b82f6', '#06b6d4', '#6366f1', '#14b8a6'];
                      
                      return (
                        <g>
                          {/* Axes */}
                          <line x1="40" y1="30" x2="40" y2="220" stroke="#64748b" strokeWidth="2" />
                          <line x1="40" y1="220" x2="380" y2="220" stroke="#64748b" strokeWidth="2" />
                          
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4].map((i) => (
                            <line
                              key={i}
                              x1="40"
                              y1={30 + i * 47.5}
                              x2="380"
                              y2={30 + i * 47.5}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              strokeDasharray="4"
                            />
                          ))}
                          
                          {/* Bars */}
                          {mlStats.by_vehicle_type.map((model, idx) => {
                            const barHeight = (model.avg_revenue / maxAvgRevenue) * 180;
                            const x = startX + idx * (barWidth + spacing);
                            
                            return (
                              <g key={idx}>
                                <defs>
                                  <linearGradient id={`avgRevGrad${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={colors[idx % colors.length]} stopOpacity="0.9" />
                                    <stop offset="100%" stopColor={colors[idx % colors.length]} stopOpacity="0.6" />
                                  </linearGradient>
                                </defs>
                                <rect
                                  x={x}
                                  y={220 - barHeight}
                                  width={barWidth}
                                  height={barHeight}
                                  fill={`url(#avgRevGrad${idx})`}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth="2"
                                  rx="4"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={240}
                                  fontSize="11"
                                  fill="#475569"
                                  textAnchor="middle"
                                  fontWeight="500"
                                >
                                  {model.vehicle_type}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={205 - barHeight}
                                  fontSize="12"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                  fontWeight="700"
                                >
                                  ₹{(model.avg_revenue / 1000).toFixed(0)}K
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                  <div className="mt-2 text-xs text-slate-500 text-center">
                    Average Revenue per Vehicle by Model Type
                  </div>
                </div>

                {/* Battery Health Gauge */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Average Battery Health</h3>
                  <div className="space-y-4">
                    {mlStats.by_vehicle_type.map((item, idx) => {
                      const percentage = item.avg_battery_health;
                      const color = percentage >= 85 ? 'green' : percentage >= 75 ? 'yellow' : 'red';
                      const bgColor = color === 'green' ? 'from-green-500 to-green-600' : 
                                     color === 'yellow' ? 'from-yellow-500 to-yellow-600' : 
                                     'from-red-500 to-red-600';
                      const textColor = color === 'green' ? 'text-green-600' : 
                                       color === 'yellow' ? 'text-yellow-600' : 
                                       'text-red-600';
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">{item.vehicle_type}</span>
                            <span className={`font-bold text-lg ${textColor}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="relative w-full bg-slate-100 rounded-full h-4">
                            <div
                              className={`bg-gradient-to-r ${bgColor} h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                              style={{ width: `${percentage}%` }}
                            >
                              <div className="w-2 h-2 bg-white rounded-full shadow"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Line Charts Section */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {/* Revenue Trend Line Chart */}
                {revenueTrend && revenueTrend.values.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend (12 Months)</h3>
                    <div className="relative">
                      <svg viewBox="0 0 400 200" className="w-full h-48">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="40"
                            y1={20 + i * 40}
                            x2="380"
                            y2={20 + i * 40}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#64748b" strokeWidth="2" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#64748b" strokeWidth="2" />
                        
                        {/* Line */}
                        {(() => {
                          const maxValue = Math.max(...revenueTrend.values);
                          const minValue = Math.min(...revenueTrend.values);
                          const range = maxValue - minValue;
                          const points = revenueTrend.values.map((val, idx) => {
                            const x = 40 + (idx / (revenueTrend.values.length - 1)) * 340;
                            const y = 180 - ((val - minValue) / range) * 160;
                            return `${x},${y}`;
                          }).join(' ');
                          
                          return (
                            <>
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinejoin="round"
                              />
                              {revenueTrend.values.map((val, idx) => {
                                const x = 40 + (idx / (revenueTrend.values.length - 1)) * 340;
                                const y = 180 - ((val - minValue) / range) * 160;
                                return (
                                  <circle
                                    key={idx}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#10b981"
                                    className="hover:r-6 transition-all"
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Latest: ₹{(revenueTrend.values[revenueTrend.values.length - 1] / 1000000).toFixed(2)}M</span>
                        <span>Peak: ₹{(Math.max(...revenueTrend.values) / 1000000).toFixed(2)}M</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* KM Driven Trend Line Chart */}
                {kmTrend && kmTrend.values.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">KM Driven Trend (12 Months)</h3>
                    <div className="relative">
                      <svg viewBox="0 0 400 200" className="w-full h-48">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="40"
                            y1={20 + i * 40}
                            x2="380"
                            y2={20 + i * 40}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#64748b" strokeWidth="2" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#64748b" strokeWidth="2" />
                        
                        {/* Line */}
                        {(() => {
                          const maxValue = Math.max(...kmTrend.values);
                          const minValue = Math.min(...kmTrend.values);
                          const range = maxValue - minValue;
                          const points = kmTrend.values.map((val, idx) => {
                            const x = 40 + (idx / (kmTrend.values.length - 1)) * 340;
                            const y = 180 - ((val - minValue) / range) * 160;
                            return `${x},${y}`;
                          }).join(' ');
                          
                          return (
                            <>
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinejoin="round"
                              />
                              {kmTrend.values.map((val, idx) => {
                                const x = 40 + (idx / (kmTrend.values.length - 1)) * 340;
                                const y = 180 - ((val - minValue) / range) * 160;
                                return (
                                  <circle
                                    key={idx}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#3b82f6"
                                    className="hover:r-6 transition-all"
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Latest: {(kmTrend.values[kmTrend.values.length - 1] / 1000000).toFixed(2)}M km</span>
                        <span>Peak: {(Math.max(...kmTrend.values) / 1000000).toFixed(2)}M km</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver Earnings Trend Line Chart */}
                {earningsTrend && earningsTrend.values.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Driver Earnings Trend (12 Months)</h3>
                    <div className="relative">
                      <svg viewBox="0 0 400 200" className="w-full h-48">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="40"
                            y1={20 + i * 40}
                            x2="380"
                            y2={20 + i * 40}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#64748b" strokeWidth="2" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#64748b" strokeWidth="2" />
                        
                        {/* Line */}
                        {(() => {
                          const maxValue = Math.max(...earningsTrend.values);
                          const minValue = Math.min(...earningsTrend.values);
                          const range = maxValue - minValue;
                          const points = earningsTrend.values.map((val, idx) => {
                            const x = 40 + (idx / (earningsTrend.values.length - 1)) * 340;
                            const y = 180 - ((val - minValue) / range) * 160;
                            return `${x},${y}`;
                          }).join(' ');
                          
                          return (
                            <>
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="3"
                                strokeLinejoin="round"
                              />
                              {earningsTrend.values.map((val, idx) => {
                                const x = 40 + (idx / (earningsTrend.values.length - 1)) * 340;
                                const y = 180 - ((val - minValue) / range) * 160;
                                return (
                                  <circle
                                    key={idx}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#8b5cf6"
                                    className="hover:r-6 transition-all"
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Latest: ₹{(earningsTrend.values[earningsTrend.values.length - 1] / 1000000).toFixed(2)}M</span>
                        <span>Peak: ₹{(Math.max(...earningsTrend.values) / 1000000).toFixed(2)}M</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Show message if no trend data */}
              {(!revenueTrend || revenueTrend.values.length === 0) && 
               (!kmTrend || kmTrend.values.length === 0) && 
               (!earningsTrend || earningsTrend.values.length === 0) && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                  <p className="text-slate-600">Loading trend data...</p>
                </div>
              )}

              {/* Vehicle Type Details Table */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-semibold text-slate-900">Detailed Model Statistics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Vehicle Model</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Vehicles</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Total Revenue</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Avg Revenue</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Total KM</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Avg Battery</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Maintenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {mlStats.by_vehicle_type.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.vehicle_type}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{item.cars}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                            ₹{(item.total_revenue / 1000000).toFixed(2)}M
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                            ₹{(item.avg_revenue / 1000).toFixed(0)}K
                          </td>
                          <td className="px-4 py-3 text-right text-purple-600">
                            {(item.total_km / 1000).toFixed(0)}K
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${
                              item.avg_battery_health >= 85 ? 'text-green-600' : 
                              item.avg_battery_health >= 75 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {item.avg_battery_health.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-amber-600 font-semibold">
                            ₹{(item.total_maintenance_cost / 1000000).toFixed(2)}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-600">
              No analytics data available
            </div>
          )}
    </section>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminManagementContent />
    </ProtectedRoute>
  );
}
