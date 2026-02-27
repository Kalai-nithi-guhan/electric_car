"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface BatteryAlert {
  car_id: string;
  battery_health: number;
  charge_percentage: number;
  maintenance_cost: number;
  alert_type: string[];
}

interface BatteryPrediction {
  prediction: number;
  risk_probability: number;
  status: string;
  recommendation: string;
}

interface RevenuePrediction {
  predicted_revenue: number;
}

interface Car {
  id: number;
  car_id: string;
  vehicle_type: string;
  driver_name: string;
  vehicle_age: number;
  trips_per_month: number;
  battery_health: number;
  charging_cost: number;
  maintenance_cost: number;
}

interface DashboardData {
  total_vehicles: number;
  yearly_revenue: { [key: string]: number };
  monthly_revenue: { [key: string]: number };
  monthly_costs: {
    charging_cost: { [key: string]: number };
    total_maintanace_cost: { [key: string]: number };
  };
  usage_statistics: { [key: string]: number };
  alerts: BatteryAlert[];
  model_accuracy: number;
}

function BatteryHealthContent() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [prediction, setPrediction] = useState<BatteryPrediction | null>(null);
  const [revenuePrediction, setRevenuePrediction] = useState<RevenuePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cars, setCars] = useState<Car[]>([]);
  const [batteryLoading, setBatteryLoading] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Form states for battery prediction
  const [vehicleAge, setVehicleAge] = useState("");
  const [totalKm, setTotalKm] = useState("");
  const [chargePercentage, setChargePercentage] = useState("");
  const [batteryCapacity, setBatteryCapacity] = useState("");
  const [selectedCarId, setSelectedCarId] = useState("");

  // Form states for revenue prediction
  const [revenueKm, setRevenueKm] = useState("");
  const [chargingCost, setChargingCost] = useState("");
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [selectedCarIdRevenue, setSelectedCarIdRevenue] = useState("");

  useEffect(() => {
    fetchDashboardData();
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cars`);
      if (!response.ok) throw new Error("Failed to fetch cars");
      const data = await response.json();
      setCars(data.cars || []);
    } catch (err: any) {
      console.error("Error fetching cars:", err);
    }
  };

  const handleCarSelect = (carId: string) => {
    setSelectedCarId(carId);
    setPrediction(null);
    // Vehicle selection for reference only - no auto-fill
  };

  const resetBatteryForm = () => {
    setVehicleAge("");
    setTotalKm("");
    setChargePercentage("");
    setBatteryCapacity("");
    setSelectedCarId("");
    setPrediction(null);
    setError("");
  };

  const handleCarSelectRevenue = (carId: string) => {
    setSelectedCarIdRevenue(carId);
    setRevenuePrediction(null);
    // Vehicle selection for reference only - no auto-fill
  };

  const resetRevenueForm = () => {
    setRevenueKm("");
    setChargingCost("");
    setMaintenanceCost("");
    setSelectedCarIdRevenue("");
    setRevenuePrediction(null);
    setError("");
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/battery/dashboard`);
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleBatteryPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleAge || !totalKm || !chargePercentage || !batteryCapacity) {
      setError("Please fill in all fields");
      return;
    }
    setBatteryLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/battery/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_age: Number(vehicleAge),
          total_km: Number(totalKm),
          charge_percentage: Number(chargePercentage),
          battery_capacity: Number(batteryCapacity),
        }),
      });
      if (!response.ok) throw new Error("Prediction failed");
      const data = await response.json();
      setPrediction(data);
    } catch (err: any) {
      setError(err.message || "Failed to predict battery health");
      setPrediction(null);
    } finally {
      setBatteryLoading(false);
    }
  };

  const handleRevenuePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revenueKm || !chargingCost || !maintenanceCost) {
      setError("Please fill in all fields");
      return;
    }
    setRevenueLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/battery/predict-revenue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_km: Number(revenueKm),
          charging_cost: Number(chargingCost),
          maintenance_cost: Number(maintenanceCost),
        }),
      });
      if (!response.ok) throw new Error("Prediction failed");
      const data = await response.json();
      setRevenuePrediction(data);
    } catch (err: any) {
      setError(err.message || "Failed to predict revenue");
      setRevenuePrediction(null);
    } finally {
      setRevenueLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Battery Health & Prediction System</h1>
          <p className="mt-2 text-gray-600">AI-powered analytics for fleet battery management</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Dashboard Overview */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.total_vehicles}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{dashboardData.alerts.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Model Accuracy</p>
              <p className="text-2xl font-bold text-green-600">
                {(dashboardData.model_accuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Revenue (2024)</p>
              <p className="text-2xl font-bold text-blue-600">
                ${Object.values(dashboardData.yearly_revenue)[0]?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        )}

        {/* Battery Failure Prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Battery Failure Prediction</h2>
            <form onSubmit={handleBatteryPrediction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Vehicle (Reference Only)
                </label>
                <select
                  value={selectedCarId}
                  onChange={(e) => handleCarSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a vehicle or enter manually --</option>
                  {Array.from(new Set(cars.map(car => car.vehicle_type)))
                    .map(type => {
                      const car = cars.find(c => c.vehicle_type === type);
                      return car ? (
                        <option key={car.id} value={car.id.toString()}>
                          {car.vehicle_type}
                        </option>
                      ) : null;
                    })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Age (years) *
                </label>
                <input
                  type="text"
                  value={vehicleAge}
                  onChange={(e) => setVehicleAge(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="20"
                  placeholder="Enter vehicle age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total KM Driven *
                </label>
                <input
                  type="text"
                  value={totalKm}
                  onChange={(e) => setTotalKm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  placeholder="Enter total kilometers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Charge (%) *
                </label>
                <input
                  type="text"
                  value={chargePercentage}
                  onChange={(e) => setChargePercentage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  placeholder="Enter charge percentage (0-100)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Battery Capacity (kW) *
                </label>
                <input
                  type="text"
                  value={batteryCapacity}
                  onChange={(e) => setBatteryCapacity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  placeholder="Enter battery capacity"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={batteryLoading || !vehicleAge || !totalKm || !chargePercentage || !batteryCapacity}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batteryLoading ? "Predicting..." : "Predict Battery Risk"}
                </button>
                <button
                  type="button"
                  onClick={resetBatteryForm}
                  className="bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500"
                >
                  Clear
                </button>
              </div>
            </form>

            {prediction && (
              <div className={`mt-6 p-4 rounded-lg ${prediction.prediction === 1 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <h3 className="font-semibold text-lg mb-2">{prediction.status}</h3>
                <p className="text-sm mb-2">Risk Probability: {(prediction.risk_probability * 100).toFixed(1)}%</p>
                <p className="text-sm font-medium">{prediction.recommendation}</p>
              </div>
            )}
          </div>

          {/* Revenue Prediction */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Revenue Prediction</h2>
            <form onSubmit={handleRevenuePrediction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Vehicle (Reference Only)
                </label>
                <select
                  value={selectedCarIdRevenue}
                  onChange={(e) => handleCarSelectRevenue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a vehicle or enter manually --</option>
                  {Array.from(new Set(cars.map(car => car.vehicle_type)))
                    .map(type => {
                      const car = cars.find(c => c.vehicle_type === type);
                      return car ? (
                        <option key={car.id} value={car.id.toString()}>
                          {car.vehicle_type}
                        </option>
                      ) : null;
                    })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total KM *
                </label>
                <input
                  type="text"
                  value={revenueKm}
                  onChange={(e) => setRevenueKm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  placeholder="Enter total kilometers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charging Cost ($) *
                </label>
                <input
                  type="text"
                  value={chargingCost}
                  onChange={(e) => setChargingCost(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  placeholder="Enter charging cost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Cost ($) *
                </label>
                <input
                  type="text"
                  value={maintenanceCost}
                  onChange={(e) => setMaintenanceCost(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter maintenance cost"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={revenueLoading || !revenueKm || !chargingCost || !maintenanceCost}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {revenueLoading ? "Predicting..." : "Predict Revenue"}
                </button>
                <button
                  type="button"
                  onClick={resetRevenueForm}
                  className="bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500"
                >
                  Clear
                </button>
              </div>
            </form>

            {revenuePrediction && (
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-lg mb-2">Predicted Revenue</h3>
                <p className="text-3xl font-bold text-blue-600">
                  ${revenuePrediction.predicted_revenue.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fleet Health Summary */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-600">
              <p className="text-sm font-medium text-gray-600 mb-2">VEHICLES IN GOOD CONDITION</p>
              <p className="text-4xl font-bold text-green-600">{dashboardData.total_vehicles - dashboardData.alerts.length}</p>
              <p className="text-xs text-gray-500 mt-2">No maintenance needed</p>
            </div>

            <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-600">
              <p className="text-sm font-medium text-gray-600 mb-2">VEHICLES REQUIRING ATTENTION</p>
              <p className="text-4xl font-bold text-red-600">{dashboardData.alerts.length}</p>
              <p className="text-xs text-gray-500 mt-2">Critical alerts</p>
            </div>

            <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-600">
              <p className="text-sm font-medium text-gray-600 mb-2">FLEET HEALTH STATUS</p>
              <p className="text-4xl font-bold text-blue-600">
                {dashboardData.total_vehicles > 0 ? ((( dashboardData.total_vehicles - dashboardData.alerts.length) / dashboardData.total_vehicles) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-2">Healthy vehicles</p>
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        {dashboardData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Fleet Usage Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(dashboardData.usage_statistics).map(([type, count]) => (
                <div key={type} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{type}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BatteryHealthPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <BatteryHealthContent />
    </ProtectedRoute>
  );
}
