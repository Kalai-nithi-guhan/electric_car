import { DriverStatus, Vehicle } from "./types";

export function getDriverStatus(vehicle: Vehicle, tick: number): DriverStatus {
  const cycle = tick % 40;
  const discharge = vehicle.status === "Charging" ? -0.5 : 0.8;
  const chargeDelta = cycle * discharge;
  const chargePercent = clamp(vehicle.currentChargePercent - chargeDelta, 5, 100);

  const remainingDistanceKm =
    (vehicle.batteryCapacityKwh * (chargePercent / 100)) * vehicle.efficiencyKmPerKwh;
  const speedKmPerHour = vehicle.status === "Charging" ? 0 : 38;
  const remainingTimeMinutes =
    speedKmPerHour === 0 ? 0 : (remainingDistanceKm / speedKmPerHour) * 60;

  return {
    chargePercent: Number(chargePercent.toFixed(1)),
    remainingDistanceKm: Number(remainingDistanceKm.toFixed(1)),
    remainingTimeMinutes: Number(remainingTimeMinutes.toFixed(0)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
