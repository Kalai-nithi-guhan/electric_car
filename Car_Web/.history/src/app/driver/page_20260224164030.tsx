"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { SimpleLineChart } from "@/components/simple-line-chart";
import { vehicles } from "@/lib/demo-data";
import { formatMinutes } from "@/lib/format";
import { getDriverStatus } from "@/lib/simulation";

export default function DriverPage() {
  const [tick, setTick] = useState(0);
  const vehicle = vehicles[0];
  const status = getDriverStatus(vehicle, tick);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const trendPoints = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, index) => {
        const pointStatus = getDriverStatus(vehicle, Math.max(0, tick - (7 - index)));
        return {
          label: `${index + 1}`,
          value: pointStatus.chargePercent,
        };
      }),
    [tick, vehicle],
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Driver Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Basic trip status for {vehicle.model} ({vehicle.plateNumber}).
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
