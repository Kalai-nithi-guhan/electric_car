import { MonthlyFinancial, Vehicle } from "./types";

export const vehicles: Vehicle[] = [
  {
    id: "v1",
    model: "Model HM",
    plateNumber: "TN-01-AB-1452",
    batteryCapacityKwh: 50,
    efficiencyKmPerKwh: 6.4,
    currentChargePercent: 78,
    status: "Running",
  },
  {
    id: "v2",
    model: "Model HM+",
    plateNumber: "TN-01-AB-2509",
    batteryCapacityKwh: 55,
    efficiencyKmPerKwh: 6.1,
    currentChargePercent: 63,
    status: "Charging",
  },
  {
    id: "v3",
    model: "Model HR",
    plateNumber: "TN-01-AB-3321",
    batteryCapacityKwh: 58,
    efficiencyKmPerKwh: 6.0,
    currentChargePercent: 49,
    status: "Running",
  },
  {
    id: "v4",
    model: "Model RM",
    plateNumber: "TN-01-AB-4174",
    batteryCapacityKwh: 62,
    efficiencyKmPerKwh: 5.8,
    currentChargePercent: 85,
    status: "Idle",
  },
  {
    id: "v5",
    model: "Model SM",
    plateNumber: "TN-01-AB-5098",
    batteryCapacityKwh: 52,
    efficiencyKmPerKwh: 6.3,
    currentChargePercent: 70,
    status: "Running",
  },
];

export const monthlyFinancials: MonthlyFinancial[] = [
  { month: "Jan", revenue: 92000, runningCost: 22000, chargingCost: 13000, maintenanceCost: 7000 },
  { month: "Feb", revenue: 97000, runningCost: 23000, chargingCost: 13600, maintenanceCost: 6800 },
  { month: "Mar", revenue: 101000, runningCost: 23600, chargingCost: 14100, maintenanceCost: 7200 },
  { month: "Apr", revenue: 98000, runningCost: 22900, chargingCost: 13400, maintenanceCost: 6900 },
  { month: "May", revenue: 105000, runningCost: 24200, chargingCost: 14700, maintenanceCost: 7300 },
  { month: "Jun", revenue: 109000, runningCost: 25000, chargingCost: 15300, maintenanceCost: 7600 },
  { month: "Jul", revenue: 112000, runningCost: 25700, chargingCost: 15900, maintenanceCost: 7800 },
  { month: "Aug", revenue: 116000, runningCost: 26300, chargingCost: 16200, maintenanceCost: 7900 },
  { month: "Sep", revenue: 114000, runningCost: 26000, chargingCost: 16000, maintenanceCost: 8100 },
  { month: "Oct", revenue: 118000, runningCost: 26800, chargingCost: 16500, maintenanceCost: 8300 },
  { month: "Nov", revenue: 121000, runningCost: 27200, chargingCost: 16900, maintenanceCost: 8500 },
  { month: "Dec", revenue: 126000, runningCost: 28000, chargingCost: 17400, maintenanceCost: 8800 },
];
