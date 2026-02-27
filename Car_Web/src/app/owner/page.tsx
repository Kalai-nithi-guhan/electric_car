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

interface ModelComparison {
  vehicle_types: string[];
  monthly_revenue: {
    months: string[];
    data: { [key: string]: number[] };
  };
  yearly_revenue: {
    years: string[];
    data: { [key: string]: number[] };
  };
  summary: {
    total_vehicles: number;
    total_revenue: number;
    avg_monthly_revenue: number;
    avg_yearly_revenue: number;
  };
}

interface VehicleStatus {
  vehicle_type: string;
  active: number;
  inactive: number;
  total: number;
}

interface TrendData {
  dates: string[];
  values: number[];
}

function OwnerDashboard() {
  const [mlStats, setMlStats] = useState<MLStats | null>(null);
  const [modelComparison, setModelComparison] = useState<ModelComparison | null>(null);
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonthPoint, setSelectedMonthPoint] = useState<{idx: number, label: string, value: number} | null>(null);
  const [selectedYearPoint, setSelectedYearPoint] = useState<{idx: number, label: string, value: number} | null>(null);

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

        // Load model comparison data
        const modelRes = await fetch(`${API_BASE_URL}/api/battery/model-comparison`, {
          credentials: "include",
        });
        if (modelRes.ok) {
          const modelData = await modelRes.json();
          setModelComparison(modelData);
        }

        // Load vehicle status data
        const statusRes = await fetch(`${API_BASE_URL}/api/vehicle/status-by-type`, {
          credentials: "include",
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setVehicleStatus(statusData.vehicle_status);
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

      {/* Total Active/Inactive Summary */}
      {vehicleStatus && vehicleStatus.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-green-700">Total Active</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {vehicleStatus.reduce((sum, status) => sum + status.active, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-red-700">Total Inactive</h3>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {vehicleStatus.reduce((sum, status) => sum + status.inactive, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Vehicle Status by Model */}
      {vehicleStatus && vehicleStatus.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Vehicle Status by Model</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {vehicleStatus.map((model, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">{model.vehicle_type}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-green-700">Active</span>
                    <span className="text-sm font-bold text-green-600">{model.active}</span>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(model.active / model.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-red-700">Inactive</span>
                    <span className="text-sm font-bold text-red-600">{model.inactive}</span>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(model.inactive / model.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Total</span>
                    <span className="text-lg font-bold text-slate-900">{model.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Comparison Charts by Vehicle Type */}
      <div className="grid gap-4 lg:grid-cols-2">
        {modelComparison && modelComparison.monthly_revenue && modelComparison.monthly_revenue.data && modelComparison.yearly_revenue && modelComparison.yearly_revenue.data && (
          <>
            {/* Monthly Revenue Comparison */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Revenue by Vehicle Type</h3>
              <div className="relative">
                <svg viewBox="0 0 500 250" className="w-full h-64">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <line
                      key={i}
                      x1="60"
                      y1={30 + i * 35}
                      x2="480"
                      y2={30 + i * 35}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Axes */}
                  <line x1="60" y1="30" x2="60" y2="240" stroke="#64748b" strokeWidth="2" />
                  <line x1="60" y1="240" x2="480" y2="240" stroke="#64748b" strokeWidth="2" />
                  
                  {/* Lines for each vehicle type */}
                  {(() => {
                    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
                    const allValues = Object.values(modelComparison.monthly_revenue.data).flat();
                    const maxValue = Math.max(...allValues);
                    const minValue = Math.min(...allValues);
                    const range = maxValue - minValue || 1;
                    
                    return modelComparison.vehicle_types.map((vtype, typeIdx) => {
                      const values = modelComparison.monthly_revenue.data[vtype] || [];
                      const color = colors[typeIdx % colors.length];
                      
                      const points = values.map((val, idx) => {
                        const x = 60 + (idx / (values.length - 1 || 1)) * 420;
                        const y = 240 - ((val - minValue) / range) * 210;
                        return `${x},${y}`;
                      }).join(' ');
                      
                      return (
                        <g key={typeIdx}>
                          <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                          />
                          {values.map((val, idx) => {
                            const x = 60 + (idx / (values.length - 1 || 1)) * 420;
                            const y = 240 - ((val - minValue) / range) * 210;
                            const monthLabel = modelComparison.monthly_revenue.months[idx];
                            return (
                              <g key={idx}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="5"
                                  fill={color}
                                  stroke="white"
                                  strokeWidth="2"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setSelectedMonthPoint({idx, label: monthLabel, value: val})}
                                  onMouseEnter={(e) => {
                                    (e.target as SVGCircleElement).setAttribute('r', '7');
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.target as SVGCircleElement).setAttribute('r', '5');
                                  }}
                                />
                                {selectedMonthPoint?.idx === idx && (
                                  <>
                                    <text
                                      x={x}
                                      y={y - 25}
                                      fontSize="11"
                                      fontWeight="bold"
                                      fill={color}
                                      textAnchor="middle"
                                    >
                                      {monthLabel}
                                    </text>
                                    <text
                                      x={x}
                                      y={y - 12}
                                      fontSize="10"
                                      fill={color}
                                      textAnchor="middle"
                                    >
                                      ₹{(val / 100000).toFixed(2)}L
                                    </text>
                                  </>
                                )}
                              </g>
                            );
                          })}
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                {modelComparison.vehicle_types.map((vtype, idx) => {
                  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="text-xs font-medium text-slate-600">{vtype}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Yearly Revenue Comparison */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Yearly Revenue by Vehicle Type</h3>
              <div className="relative">
                <svg viewBox="0 0 500 250" className="w-full h-64">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <line
                      key={i}
                      x1="60"
                      y1={30 + i * 35}
                      x2="480"
                      y2={30 + i * 35}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Axes */}
                  <line x1="60" y1="30" x2="60" y2="240" stroke="#64748b" strokeWidth="2" />
                  <line x1="60" y1="240" x2="480" y2="240" stroke="#64748b" strokeWidth="2" />
                  
                  {/* Lines for each vehicle type */}
                  {(() => {
                    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
                    const allValues = Object.values(modelComparison.yearly_revenue.data).flat();
                    const maxValue = Math.max(...allValues);
                    const minValue = Math.min(...allValues);
                    const range = maxValue - minValue || 1;
                    
                    return modelComparison.vehicle_types.map((vtype, typeIdx) => {
                      const values = modelComparison.yearly_revenue.data[vtype] || [];
                      const color = colors[typeIdx % colors.length];
                      
                      const points = values.map((val, idx) => {
                        const x = 60 + (idx / (values.length - 1 || 1)) * 420;
                        const y = 240 - ((val - minValue) / range) * 210;
                        return `${x},${y}`;
                      }).join(' ');
                      
                      return (
                        <g key={typeIdx}>
                          <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                          />
                          {values.map((val, idx) => {
                            const x = 60 + (idx / (values.length - 1 || 1)) * 420;
                            const y = 240 - ((val - minValue) / range) * 210;
                            const yearLabel = modelComparison.yearly_revenue.years[idx];
                            return (
                              <g key={idx}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="5"
                                  fill={color}
                                  stroke="white"
                                  strokeWidth="2"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setSelectedYearPoint({idx, label: yearLabel, value: val})}
                                  onMouseEnter={(e) => {
                                    (e.target as SVGCircleElement).setAttribute('r', '7');
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.target as SVGCircleElement).setAttribute('r', '5');
                                  }}
                                />
                                {selectedYearPoint?.idx === idx && (
                                  <>
                                    <text
                                      x={x}
                                      y={y - 25}
                                      fontSize="11"
                                      fontWeight="bold"
                                      fill={color}
                                      textAnchor="middle"
                                    >
                                      {yearLabel}
                                    </text>
                                    <text
                                      x={x}
                                      y={y - 12}
                                      fontSize="10"
                                      fill={color}
                                      textAnchor="middle"
                                    >
                                      ₹{(val / 100000).toFixed(2)}L
                                    </text>
                                  </>
                                )}
                              </g>
                            );
                          })}
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                {modelComparison.vehicle_types.map((vtype, idx) => {
                  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="text-xs font-medium text-slate-600">{vtype}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Model Statistics Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Vehicle Models ({mlStats.by_vehicle_type.length})</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mlStats.by_vehicle_type.map((model, idx) => {
            const status = vehicleStatus?.find(v => v.vehicle_type === model.vehicle_type);
            return (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{model.vehicle_type}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-slate-500">{model.cars} vehicles</p>
                    {status && (
                      <div className="flex gap-1">
                        <span className="text-xs font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          A: {status.active}
                        </span>
                        <span className="text-xs font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          I: {status.inactive}
                        </span>
                      </div>
                    )}
                  </div>
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
            );
          })}
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
