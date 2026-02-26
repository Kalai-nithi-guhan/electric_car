"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { SimpleLineChart } from "@/components/simple-line-chart";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { formatCurrency } from "@/lib/format";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

function OwnerDashboard() {
  const [mlStats, setMlStats] = useState<MLStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<TrendData | null>(null);
  const [kmTrend, setKmTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load ML stats
        const statsRes = await fetch(`${API_BASE_URL}/api/ml/stats`, { credentials: "include" });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setMlStats(statsData);
        }

        // Load revenue trend
        const revenueRes = await fetch(`${API_BASE_URL}/api/ml/monthly-trend?metric=gross_revenue&months=6`, {
          credentials: "include",
        });
        if (revenueRes.ok) {
          const revenueData = await revenueRes.json();
          setRevenueTrend(revenueData);
        }

        // Load KM trend
        const kmRes = await fetch(`${API_BASE_URL}/api/ml/monthly-trend?metric=total_km_driven&months=6`, {
          credentials: "include",
        });
        if (kmRes.ok) {
          const kmData = await kmRes.json();
          setKmTrend(kmData);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !mlStats) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Owner Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Loading data...</p>
        </div>
      </section>
    );
  }

  const totalCost = mlStats.summary.total_maintenance_cost;
  const net = mlStats.summary.total_revenue - totalCost;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Owner Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Fleet analytics by vehicle models (Real-time ML Data)
          </p>
        </div>
        <a
          href="/admin"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Admin Panel
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard label="Monthly Revenue" value={formatCurrency(mlStats.summary.total_revenue)} />
        <MetricCard label="Running Cost" value="₹0" />
        <MetricCard label="Charging Cost" value={formatCurrency(mlStats.summary.total_km * 6)} />
        <MetricCard label="Maintenance" value={formatCurrency(mlStats.summary.total_maintenance_cost)} />
        <MetricCard
          label="Net"
          value={formatCurrency(net)}
          tone={net >= 0 ? "success" : "warning"}
        />
      </div>

      {/* Line Charts with better visualization */}
      <div className="grid gap-4 lg:grid-cols-2">
        {revenueTrend && revenueTrend.values.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend</h3>
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
                
                {/* Line with gradient fill */}
                {(() => {
                  const maxValue = Math.max(...revenueTrend.values);
                  const minValue = Math.min(...revenueTrend.values);
                  const range = maxValue - minValue || 1;
                  const points = revenueTrend.values.map((val, idx) => {
                    const x = 40 + (idx / (revenueTrend.values.length - 1)) * 340;
                    const y = 180 - ((val - minValue) / range) * 160;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  const areaPoints = `40,180 ${points} ${40 + 340},180`;
                  
                  return (
                    <>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <polygon
                        points={areaPoints}
                        fill="url(#revenueGradient)"
                      />
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
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="mt-4 flex justify-between text-xs text-slate-500">
              {revenueTrend.dates.slice(0, 3).map((date, idx) => (
                <span key={idx}>{date}</span>
              ))}
            </div>
          </div>
        )}

        {kmTrend && kmTrend.values.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Total Cost Trend</h3>
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
                
                {/* Line with gradient fill */}
                {(() => {
                  const maxValue = Math.max(...kmTrend.values);
                  const minValue = Math.min(...kmTrend.values);
                  const range = maxValue - minValue || 1;
                  const points = kmTrend.values.map((val, idx) => {
                    const x = 40 + (idx / (kmTrend.values.length - 1)) * 340;
                    const y = 180 - ((val - minValue) / range) * 160;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  const areaPoints = `40,180 ${points} ${40 + 340},180`;
                  
                  return (
                    <>
                      <defs>
                        <linearGradient id="costGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <polygon
                        points={areaPoints}
                        fill="url(#costGradient)"
                      />
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#f59e0b"
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
                            fill="#f59e0b"
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="mt-4 flex justify-between text-xs text-slate-500">
              {kmTrend.dates.slice(0, 3).map((date, idx) => (
                <span key={idx}>{date}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Model Statistics Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Vehicle Models ({mlStats.by_vehicle_type.length})</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mlStats.by_vehicle_type.map((model, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{model.vehicle_type}</h3>
                  <p className="text-sm text-slate-500">{model.cars} vehicles</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Active
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Revenue</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    ₹{(model.total_revenue / 1000000).toFixed(2)}M
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Avg Revenue</span>
                  <span className="text-sm font-semibold text-blue-600">
                    ₹{(model.avg_revenue / 1000).toFixed(0)}K
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total KM</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {(model.total_km / 1000).toFixed(0)}K
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Battery Health</span>
                  <span className={`text-sm font-semibold ${
                    model.avg_battery_health >= 85 ? 'text-green-600' : 
                    model.avg_battery_health >= 75 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {model.avg_battery_health.toFixed(1)}%
                  </span>
                </div>
                
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Maintenance</span>
                    <span className="text-sm font-semibold text-amber-600">
                      ₹{(model.total_maintenance_cost / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Visual Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Distribution Pie Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Model Type</h3>
          <svg viewBox="0 0 400 300" className="w-full">
            {(() => {
              const total = mlStats.by_vehicle_type.reduce((sum, m) => sum + m.total_revenue, 0);
              const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
              let currentAngle = -90;
              
              return (
                <g>
                  {mlStats.by_vehicle_type.map((model, idx) => {
                    const percentage = (model.total_revenue / total) * 100;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle = endAngle;
                    
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    const x1 = 200 + 80 * Math.cos(startRad);
                    const y1 = 150 + 80 * Math.sin(startRad);
                    const x2 = 200 + 80 * Math.cos(endRad);
                    const y2 = 150 + 80 * Math.sin(endRad);
                    const largeArc = angle > 180 ? 1 : 0;
                    
                    return (
                      <g key={idx}>
                        <path
                          d={`M 200 150 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={colors[idx % colors.length]}
                          stroke="white"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                  
                  {/* Legend */}
                  {mlStats.by_vehicle_type.map((model, idx) => (
                    <g key={`legend-${idx}`}>
                      <rect
                        x="20"
                        y={240 + idx * 12}
                        width="10"
                        height="10"
                        fill={colors[idx % colors.length]}
                      />
                      <text
                        x="35"
                        y={249 + idx * 12}
                        fontSize="11"
                        fill="#475569"
                      >
                        {model.vehicle_type}: {((model.total_revenue / total) * 100).toFixed(1)}%
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </div>

        {/* KM Distribution Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Total KM by Model Type</h3>
          <svg viewBox="0 0 400 300" className="w-full">
            {(() => {
              const maxKm = Math.max(...mlStats.by_vehicle_type.map(m => m.total_km));
              const barWidth = 60;
              const spacing = 20;
              const startX = 50;
              const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
              
              return (
                <g>
                  {/* Axes */}
                  <line x1="40" y1="30" x2="40" y2="220" stroke="#64748b" strokeWidth="2" />
                  <line x1="40" y1="220" x2="380" y2="220" stroke="#64748b" strokeWidth="2" />
                  
                  {/* Bars */}
                  {mlStats.by_vehicle_type.map((model, idx) => {
                    const barHeight = (model.total_km / maxKm) * 180;
                    const x = startX + idx * (barWidth + spacing);
                    
                    return (
                      <g key={idx}>
                        <rect
                          x={x}
                          y={220 - barHeight}
                          width={barWidth}
                          height={barHeight}
                          fill={colors[idx % colors.length]}
                          rx="4"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={240}
                          fontSize="10"
                          fill="#475569"
                          textAnchor="middle"
                        >
                          {model.vehicle_type}
                        </text>
                        <text
                          x={x + barWidth / 2}
                          y={210 - barHeight}
                          fontSize="10"
                          fill="#0f172a"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {(model.total_km / 1000).toFixed(0)}K
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Battery Health Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Average Battery Health by Model</h3>
          <svg viewBox="0 0 400 300" className="w-full">
            {(() => {
              const barWidth = 60;
              const spacing = 20;
              const startX = 50;
              const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
              
              return (
                <g>
                  {/* Axes */}
                  <line x1="40" y1="30" x2="40" y2="220" stroke="#64748b" strokeWidth="2" />
                  <line x1="40" y1="220" x2="380" y2="220" stroke="#64748b" strokeWidth="2" />
                  
                  {/* 100% reference line */}
                  <line x1="40" y1="40" x2="380" y2="40" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4" />
                  <text x="10" y="45" fontSize="10" fill="#64748b">100%</text>
                  
                  {/* Bars */}
                  {mlStats.by_vehicle_type.map((model, idx) => {
                    const barHeight = (model.avg_battery_health / 100) * 180;
                    const x = startX + idx * (barWidth + spacing);
                    const healthColor = model.avg_battery_health >= 85 ? '#10b981' : 
                                       model.avg_battery_health >= 75 ? '#f59e0b' : '#ef4444';
                    
                    return (
                      <g key={idx}>
                        <rect
                          x={x}
                          y={220 - barHeight}
                          width={barWidth}
                          height={barHeight}
                          fill={healthColor}
                          rx="4"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={240}
                          fontSize="10"
                          fill="#475569"
                          textAnchor="middle"
                        >
                          {model.vehicle_type}
                        </text>
                        <text
                          x={x + barWidth / 2}
                          y={210 - barHeight}
                          fontSize="11"
                          fill="#0f172a"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {model.avg_battery_health.toFixed(1)}%
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Maintenance Cost Comparison */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Maintenance Cost by Model</h3>
          <svg viewBox="0 0 400 300" className="w-full">
            {(() => {
              const maxCost = Math.max(...mlStats.by_vehicle_type.map(m => m.total_maintenance_cost));
              const barWidth = 60;
              const spacing = 20;
              const startX = 50;
              
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
                        <rect
                          x={x}
                          y={220 - barHeight}
                          width={barWidth}
                          height={barHeight}
                          fill="#f59e0b"
                          rx="4"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={240}
                          fontSize="10"
                          fill="#475569"
                          textAnchor="middle"
                        >
                          {model.vehicle_type}
                        </text>
                        <text
                          x={x + barWidth / 2}
                          y={210 - barHeight}
                          fontSize="10"
                          fill="#0f172a"
                          textAnchor="middle"
                          fontWeight="600"
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
        </div>
      </div>
    </section>
  );
}

export default function OwnerPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <OwnerDashboard />
    </ProtectedRoute>
  );
}
