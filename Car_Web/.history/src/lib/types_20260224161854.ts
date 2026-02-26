export type Vehicle = {
  id: string;
  model: string;
  plateNumber: string;
  batteryCapacityKwh: number;
  efficiencyKmPerKwh: number;
  currentChargePercent: number;
  status: "Running" | "Charging" | "Idle";
};

export type MonthlyFinancial = {
  month: string;
  revenue: number;
  runningCost: number;
  chargingCost: number;
  maintenanceCost: number;
};

export type DriverStatus = {
  chargePercent: number;
  remainingTimeMinutes: number;
  remainingDistanceKm: number;
};
