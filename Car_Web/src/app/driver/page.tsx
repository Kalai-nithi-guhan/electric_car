"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { SimpleLineChart } from "@/components/simple-line-chart";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { fetchDriverStatus, fetchVehicles } from "@/lib/api";
import { formatMinutes } from "@/lib/format";

function DriverDashboard() {
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState({
    chargePercent: 0,
    remainingTimeMinutes: 0,
    remainingDistanceKm: 0,
  });
  const [vehicleInfo, setVehicleInfo] = useState({
    model: "Loading...",
    plateNumber: "...",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await fetchDriverStatus();
      if (data) {
        setStatus(data);
        // Get first vehicle info
        const vehicles = await fetchVehicles();
        if (vehicles.length > 0) {
          setVehicleInfo({
            model: vehicles[0].model,
            plateNumber: vehicles[0].plateNumber,
          });
        }
      }
      setLoading(false);
    }
    loadData();

    const timer = setInterval(() => {
      setTick((value) => value + 1);
      loadData(); // Refresh data every 3 seconds
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const trendPoints = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, index) => {
        // Simulate slight variation for trend
        const variation = Math.max(0, status.chargePercent - (7 - index) * 0.5);
        return {
          label: `${index + 1}`,
          value: Math.round(variation),
        };
      }),
    [tick, status.chargePercent],
  );

  if (loading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Driver Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Loading data...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Driver Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Basic trip status for {vehicleInfo.model} ({vehicleInfo.plateNumber}) - Live Data.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Charge Remaining" value={`${status.chargePercent}%`} />
        <MetricCard label="Remaining Time" value={formatMinutes(status.remainingTimeMinutes)} />
        <MetricCard label="Remaining Distance" value={`${status.remainingDistanceKm} km`} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-600">Battery Level</span>
          <span className="font-medium">{status.chargePercent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${status.chargePercent}%` }}
          />
        </div>
      </section>

      <SimpleLineChart
        title="Charge Trend"
        points={trendPoints}
        colorClass="stroke-indigo-600"
      />

      <p className="text-xs text-slate-500">Auto-refresh every 3 seconds.</p>
    </section>
  );
}

export default function DriverPage() {
  return (
    <ProtectedRoute requiredRole="driver">
      <DriverDashboard />
    </ProtectedRoute>
  );
}
