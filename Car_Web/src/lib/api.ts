import { Vehicle, MonthlyFinancial, DriverStatus } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vehicles`);
    if (!response.ok) {
      throw new Error("Failed to fetch vehicles");
    }
    const data = await response.json();
    
    // Map backend data to frontend Vehicle type
    return data.map((car: any) => ({
      id: car.id,
      model: car.model,
      plateNumber: car.plateNumber,
      batteryCapacityKwh: 50, // Default value
      efficiencyKmPerKwh: car.chargePerKm || 6.0,
      currentChargePercent: car.currentChargePercent,
      status: car.status as "Running" | "Charging" | "Idle",
    }));
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

export async function fetchFinancials(): Promise<MonthlyFinancial[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/financials`);
    if (!response.ok) {
      throw new Error("Failed to fetch financials");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching financials:", error);
    return [];
  }
}

export async function fetchDriverStatus(): Promise<DriverStatus | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/driver/status`);
    if (!response.ok) {
      throw new Error("Failed to fetch driver status");
    }
    const data = await response.json();
    return {
      chargePercent: data.chargePercent,
      remainingTimeMinutes: data.remainingTimeMinutes,
      remainingDistanceKm: data.remainingDistanceKm,
    };
  } catch (error) {
    console.error("Error fetching driver status:", error);
    return null;
  }
}

export async function fetchDashboardStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}
