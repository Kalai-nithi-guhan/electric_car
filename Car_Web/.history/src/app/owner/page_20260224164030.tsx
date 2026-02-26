import { MetricCard } from "@/components/metric-card";
import { SimpleLineChart } from "@/components/simple-line-chart";
import { VehicleCard } from "@/components/vehicle-card";
import { monthlyFinancials, vehicles } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

export default function OwnerPage() {
  const latest = monthlyFinancials[monthlyFinancials.length - 1];
  const totalCost =
    latest.runningCost + latest.chargingCost + latest.maintenanceCost;
  const net = latest.revenue - totalCost;

  const revenuePoints = monthlyFinancials.map((item) => ({
    label: item.month,
    value: item.revenue,
  }));

  const costPoints = monthlyFinancials.map((item) => ({
    label: item.month,
    value: item.runningCost + item.chargingCost + item.maintenanceCost,
  }));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Owner Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Vehicle details and monthly analytics overview.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard label="Monthly Revenue" value={formatCurrency(latest.revenue)} />
        <MetricCard label="Running Cost" value={formatCurrency(latest.runningCost)} />
        <MetricCard label="Charging Cost" value={formatCurrency(latest.chargingCost)} />
        <MetricCard label="Maintenance" value={formatCurrency(latest.maintenanceCost)} />
        <MetricCard
          label="Net"
          value={formatCurrency(net)}
          tone={net >= 0 ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleLineChart title="Revenue Trend" points={revenuePoints} colorClass="stroke-emerald-600" />
        <SimpleLineChart title="Total Cost Trend" points={costPoints} colorClass="stroke-amber-600" />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">All Vehicles</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </section>
    </section>
  );
}
