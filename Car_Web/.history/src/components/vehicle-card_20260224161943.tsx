import { Vehicle } from "@/lib/types";

type VehicleCardProps = {
  vehicle: Vehicle;
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{vehicle.model}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {vehicle.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">Plate: {vehicle.plateNumber}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
        <p>Battery: {vehicle.batteryCapacityKwh} kWh</p>
        <p>Efficiency: {vehicle.efficiencyKmPerKwh} km/kWh</p>
        <p>Charge: {vehicle.currentChargePercent}%</p>
      </div>
    </article>
  );
}
