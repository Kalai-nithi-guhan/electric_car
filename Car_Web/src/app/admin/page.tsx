"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Car {
  id: number;
  driver_id: string;
  car_id: string;
  driver_name: string;
  city: string;
  vehicle_type: string;
  status: string;
  vehicle_age: number;
  trips_per_month: number;
  battery_health: number;
  charge_per_km: number;
  garage_cost: number;
  charging_cost: number;
  maintenance_cost: number;
  total_operating_cost: number;
  gross_revenue: number;
  driver_charge: number;
  overspeed_count: number;
  max_speed: number;
}

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

interface TrendData {
  dates: string[];
  values: number[];
}

interface OverspeedCount {
  count: number;
  avg_speed: number;
  total_records: number;
  vehicles: Array<{
    car_id: string;
    driver_id: string;
    driver_name: string;
    max_speed: number;
    vehicle_type: string;
  }>;
}

interface TopDriver {
  driver_id: string;
  driver_name: string;
  total_revenue: number;
  car_count: number;
}

interface TopCar {
  car_id: string;
  driver_id: string;
  driver_name: string;
  vehicle_type: string;
  total_revenue: number;
}

interface Driver {
  driver_id: string;
  driver_name: string;
  city: string;
  car_count: number;
  total_revenue: number;
  avg_battery_health: number;
}

interface DriverDetails {
  driver_id: string;
  driver_name: string;
  city: string;
  car_count: number;
  total_revenue: number;
  total_maintenance_cost: number;
  avg_battery_health: number;
  cars: Array<{
    id: number;
    car_id: string;
    vehicle_type: string;
    vehicle_age: number;
    battery_health: number;
    charge_per_km: number;
    trips_per_month: number;
    gross_revenue: number;
    driver_charge: number;
    charging_cost: number;
    maintenance_cost: number;
    total_operating_cost: number;
    garage_cost: number;
    overspeed_count: number;
    max_speed: number;
    status: string;
  }>;
}

function AdminManagementContent() {
  const [mlStats, setMlStats] = useState<MLStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<TrendData | null>(null);
  const [kmTrend, setKmTrend] = useState<TrendData | null>(null);
  const [earningsTrend, setEarningsTrend] = useState<TrendData | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("All");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overspeedToday, setOverspeedToday] = useState<OverspeedCount | null>(null);
  const [overspeedFiltered, setOverspeedFiltered] = useState<OverspeedCount | null>(null);
  const [overspeedScope, setOverspeedScope] = useState<"day" | "month" | "year">("day");
  const [overspeedDate, setOverspeedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [overspeedMonth, setOverspeedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [overspeedYear, setOverspeedYear] = useState<number>(new Date().getFullYear());
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [topCars, setTopCars] = useState<TopCar[]>([]);
  const [topRevenueScope, setTopRevenueScope] = useState<"all" | "day" | "month" | "year">("all");
  const [topRevenueDate, setTopRevenueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [topRevenueMonth, setTopRevenueMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [topRevenueYear, setTopRevenueYear] = useState<number>(new Date().getFullYear());
  
  // Driver management state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverPage, setDriverPage] = useState(1);
  const [driverTotalPages, setDriverTotalPages] = useState(1);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editDriverName, setEditDriverName] = useState("");
  const [editDriverCity, setEditDriverCity] = useState("");
  const [showDriverSection, setShowDriverSection] = useState(false);
  const [viewingDriverDetails, setViewingDriverDetails] = useState<DriverDetails | null>(null);

  useEffect(() => {
    loadMLStats();
    loadVehicleTypes();
    loadTrendData();
    loadDrivers();
    loadOverspeedToday();
    loadTopDrivers();
    loadTopCars();
  }, []);

  useEffect(() => {
    loadMLStats();
  }, [selectedVehicleType]);
  
  useEffect(() => {
    loadDrivers();
  }, [driverSearch, driverPage]);

  useEffect(() => {
    loadOverspeedFiltered();
  }, [overspeedScope, overspeedDate, overspeedMonth, overspeedYear]);

  useEffect(() => {
    loadTopDrivers();
    loadTopCars();
  }, [topRevenueScope, topRevenueDate, topRevenueMonth, topRevenueYear]);

  const loadDrivers = async () => {
    try {
      const url = new URL(`${API_BASE_URL}/api/admin/drivers`);
      url.searchParams.append("page", driverPage.toString());
      url.searchParams.append("per_page", "10");
      if (driverSearch) {
        url.searchParams.append("search", driverSearch);
      }

      const response = await fetch(url.toString(), { credentials: "include" });
      const data = await response.json();
      if (response.ok) {
        setDrivers(data.drivers);
        setDriverTotalPages(data.pages);
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadOverspeedToday = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vehicle/overspeed-count?scope=today`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOverspeedToday(data);
      }
    } catch (err) {
      console.error("Error loading overspeed today:", err);
    }
  };

  const loadOverspeedFiltered = async () => {
    try {
      const url = new URL(`${API_BASE_URL}/api/vehicle/overspeed-count`);
      url.searchParams.set("scope", overspeedScope);
      if (overspeedScope === "day") {
        url.searchParams.set("date", overspeedDate);
      }
      if (overspeedScope === "month") {
        const [year, month] = overspeedMonth.split("-");
        if (year && month) {
          url.searchParams.set("year", year);
          url.searchParams.set("month", month);
        }
      }
      if (overspeedScope === "year") {
        url.searchParams.set("year", String(overspeedYear));
      }

      const response = await fetch(url.toString(), { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setOverspeedFiltered(data);
      }
    } catch (err) {
      console.error("Error loading overspeed filtered:", err);
    }
  };

  const loadTopDrivers = async () => {
    try {
      const url = new URL(`${API_BASE_URL}/api/analytics/top-drivers`);
      url.searchParams.set("limit", "10");
      url.searchParams.set("scope", topRevenueScope);
      if (topRevenueScope === "day") {
        url.searchParams.set("date", topRevenueDate);
      }
      if (topRevenueScope === "month") {
        const [year, month] = topRevenueMonth.split("-");
        if (year && month) {
          url.searchParams.set("year", year);
          url.searchParams.set("month", month);
        }
      }
      if (topRevenueScope === "year") {
        url.searchParams.set("year", String(topRevenueYear));
      }

      const response = await fetch(url.toString(), { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        console.log("Top Drivers Response:", data);
        setTopDrivers(data.top_drivers || []);
      } else {
        console.error("Top Drivers API failed:", response.status);
      }
    } catch (err) {
      console.error("Error loading top drivers:", err);
    }
  };

  const loadTopCars = async () => {
    try {
      const url = new URL(`${API_BASE_URL}/api/analytics/top-cars`);
      url.searchParams.set("limit", "10");
      url.searchParams.set("scope", topRevenueScope);
      if (topRevenueScope === "day") {
        url.searchParams.set("date", topRevenueDate);
      }
      if (topRevenueScope === "month") {
        const [year, month] = topRevenueMonth.split("-");
        if (year && month) {
          url.searchParams.set("year", year);
          url.searchParams.set("month", month);
        }
      }
      if (topRevenueScope === "year") {
        url.searchParams.set("year", String(topRevenueYear));
      }

      const response = await fetch(url.toString(), { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        console.log("Top Cars Response:", data);
        setTopCars(data.top_cars || []);
      } else {
        console.error("Top Cars API failed:", response.status);
      }
    } catch (err) {
      console.error("Error loading top cars:", err);
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setEditDriverName(driver.driver_name);
    setEditDriverCity(driver.city);
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/drivers/${editingDriver.driver_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          driver_name: editDriverName,
          city: editDriverCity,
        }),
      });

      if (response.ok) {
        setEditingDriver(null);
        loadDrivers();
        alert("Driver updated successfully!");
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || "Failed to update driver"}`);
      }
    } catch (err) {
      alert("Failed to update driver");
      console.error(err);
    }
  };

  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    if (!confirm(`Are you sure you want to remove driver ${driverName}? All their cars will be released.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/drivers/${driverId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        loadDrivers();
        alert("Driver removed successfully!");
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || "Failed to remove driver"}`);
      }
    } catch (err) {
      alert("Failed to remove driver");
      console.error(err);
    }
  };

  const handleViewDriverDetails = async (driverId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/drivers/${driverId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setViewingDriverDetails(data);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || "Failed to load driver details"}`);
      }
    } catch (err) {
      alert("Failed to load driver details");
      console.error(err);
    }
  };

  const loadMLStats = async () => {
    setLoading(true);
    try {
      const url = selectedVehicleType && selectedVehicleType !== "All"
        ? `${API_BASE_URL}/api/ml/stats?vehicle_type=${encodeURIComponent(selectedVehicleType)}`
        : `${API_BASE_URL}/api/ml/stats`;
      
      const response = await fetch(url, { credentials: "include" });
      const data = await response.json();
      if (response.ok) {
        setMlStats(data);
      }
    } catch (err) {
      console.error("Error loading ML stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ml/vehicle-types`, {
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setVehicleTypes(["All", ...data.vehicle_types]);
      }
    } catch (err) {
      console.error("Error loading vehicle types:", err);
    }
  };

  const loadTrendData = async () => {
    try {
      // Load revenue trend
      const revenueRes = await fetch(`${API_BASE_URL}/api/ml/monthly-trend?metric=gross_revenue&months=12`, {
        credentials: "include",
      });
      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        setRevenueTrend(revenueData);
      }

      // Load KM driven trend
      const kmRes = await fetch(`${API_BASE_URL}/api/ml/monthly-trend?metric=total_km_driven&months=12`, {
        credentials: "include",
      });
      if (kmRes.ok) {
        const kmData = await kmRes.json();
        setKmTrend(kmData);
      }

      // Load driver earnings trend
      const earningsRes = await fetch(`${API_BASE_URL}/api/ml/monthly-trend?metric=driver_earnings&months=12`, {
        credentials: "include",
      });
      if (earningsRes.ok) {
        const earningsData = await earningsRes.json();
        setEarningsTrend(earningsData);
      }
    } catch (err) {
      console.error("Error loading trend data:", err);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            ML-powered fleet analytics and insights by vehicle models
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/admin/battery-health"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            🔋 Battery Health & Predictions
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Vehicle Type Filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Vehicle Type
            </label>
            <select
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm w-full md:w-64"
            >
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading analytics...</div>
          ) : mlStats ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Vehicles</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {mlStats.summary.vehicle_count}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-2">
                    ₹{(mlStats.summary.total_revenue / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Avg Revenue</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    ₹{(mlStats.summary.avg_revenue / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Total KM</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {(mlStats.summary.total_km / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Avg Battery Health</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {mlStats.summary.avg_battery_health.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase">Maintenance Cost</p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    ₹{(mlStats.summary.total_maintenance_cost / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Overspeeding Count</h3>
                  <span className="text-xs text-slate-500">Dataset-based (Speed &gt; Average)</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs text-slate-500">Today (Latest Date)</p>
                    <p className="text-xl font-bold text-red-600">
                      {overspeedToday?.count ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">
                      Avg speed: {overspeedToday ? overspeedToday.avg_speed.toFixed(1) : "0.0"} km/h
                    </p>
                    <p className="text-xs text-slate-500">
                      Records: {overspeedToday?.total_records ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Filtered</p>
                    <p className="text-xl font-bold text-red-600">
                      {overspeedFiltered?.count ?? 0}
                    </p>
                    <p className="text-xs text-slate-500">
                      Avg speed: {overspeedFiltered ? overspeedFiltered.avg_speed.toFixed(1) : "0.0"} km/h
                    </p>
                    <p className="text-xs text-slate-500">
                      Records: {overspeedFiltered?.total_records ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                    <label className="text-xs font-medium text-slate-600">Filter</label>
                    <select
                      value={overspeedScope}
                      onChange={(e) => setOverspeedScope(e.target.value as "day" | "month" | "year")}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs w-full"
                    >
                      <option value="day">Day-wise</option>
                      <option value="month">Month-wise</option>
                      <option value="year">Year-wise</option>
                    </select>
                    {overspeedScope === "day" && (
                      <input
                        type="date"
                        value={overspeedDate}
                        onChange={(e) => setOverspeedDate(e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs w-full"
                      />
                    )}
                    {overspeedScope === "month" && (
                      <input
                        type="month"
                        value={overspeedMonth}
                        onChange={(e) => setOverspeedMonth(e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs w-full"
                      />
                    )}
                    {overspeedScope === "year" && (
                      <input
                        type="number"
                        min={2000}
                        max={2100}
                        value={overspeedYear}
                        onChange={(e) => setOverspeedYear(Number(e.target.value))}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs w-full"
                      />
                    )}
                  </div>
                </div>
                
                {/* Overspeeding Vehicles Tables */}
                <div className="mt-4 border-t border-slate-200 pt-4 space-y-4">
                  {/* Today's Overspeeding Vehicles */}
                  {(overspeedToday && overspeedToday.vehicles && overspeedToday.vehicles.length > 0) && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">🚨 Today's Overspeeding Vehicles ({overspeedToday.vehicles.length})</h4>
                      <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-red-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Car ID</th>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Driver ID</th>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Driver Name</th>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Vehicle Type</th>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Speed (km/h)</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {overspeedToday.vehicles.map((vehicle, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
                                <td className="px-3 py-2 text-slate-900 font-medium">{vehicle.car_id}</td>
                                <td className="px-3 py-2 text-slate-900">{vehicle.driver_id}</td>
                                <td className="px-3 py-2 text-slate-900">{vehicle.driver_name}</td>
                                <td className="px-3 py-2 text-slate-600">{vehicle.vehicle_type}</td>
                                <td className="px-3 py-2 text-red-600 font-bold">{vehicle.max_speed}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Filtered Overspeeding Vehicles */}
                  {(overspeedFiltered && overspeedFiltered.vehicles && overspeedFiltered.vehicles.length > 0) && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">🚨 Filtered Overspeeding Vehicles ({overspeedFiltered.vehicles.length})</h4>
                      <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Car ID</th>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Driver ID</th>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Driver Name</th>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Vehicle Type</th>
                              <th className="px-3 py-2 text-left text-slate-700 font-semibold">Speed (km/h)</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {overspeedFiltered.vehicles.map((vehicle, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
                                <td className="px-3 py-2 text-slate-900 font-medium">{vehicle.car_id}</td>
                                <td className="px-3 py-2 text-slate-900">{vehicle.driver_id}</td>
                                <td className="px-3 py-2 text-slate-900">{vehicle.driver_name}</td>
                                <td className="px-3 py-2 text-slate-600">{vehicle.vehicle_type}</td>
                                <td className="px-3 py-2 text-red-600 font-bold">{vehicle.max_speed}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Revenue Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">Top Revenue Filters</h3>
                  <select
                    value={topRevenueScope}
                    onChange={(e) => setTopRevenueScope(e.target.value as "all" | "day" | "month" | "year")}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="all">All Time</option>
                    <option value="day">Day-wise</option>
                    <option value="month">Month-wise</option>
                    <option value="year">Year-wise</option>
                  </select>
                  {topRevenueScope === "day" && (
                    <input
                      type="date"
                      value={topRevenueDate}
                      onChange={(e) => setTopRevenueDate(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                    />
                  )}
                  {topRevenueScope === "month" && (
                    <input
                      type="month"
                      value={topRevenueMonth}
                      onChange={(e) => setTopRevenueMonth(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                    />
                  )}
                  {topRevenueScope === "year" && (
                    <input
                      type="number"
                      min={2000}
                      max={2100}
                      value={topRevenueYear}
                      onChange={(e) => setTopRevenueYear(Number(e.target.value))}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs w-24"
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Top 10 Drivers by Revenue */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">🏆 Top 10 Drivers by Revenue</h3>
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-emerald-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-emerald-700 font-semibold">#</th>
                          <th className="px-3 py-2 text-left text-emerald-700 font-semibold">Driver ID</th>
                          <th className="px-3 py-2 text-left text-emerald-700 font-semibold">Driver Name</th>
                          <th className="px-3 py-2 text-left text-emerald-700 font-semibold">Cars</th>
                          <th className="px-3 py-2 text-right text-emerald-700 font-semibold">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {topDrivers.length > 0 ? (
                          topDrivers.map((driver, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-emerald-50 transition-colors">
                              <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-900 font-medium">{driver.driver_id}</td>
                              <td className="px-3 py-2 text-slate-900">{driver.driver_name}</td>
                              <td className="px-3 py-2 text-slate-600">{driver.car_count}</td>
                              <td className="px-3 py-2 text-right text-emerald-600 font-bold">
                                ₹{(driver.total_revenue / 1000).toFixed(2)}K
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top 10 Cars by Revenue */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">🚗 Top 10 Cars by Revenue</h3>
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-blue-700 font-semibold">#</th>
                          <th className="px-3 py-2 text-left text-blue-700 font-semibold">Car ID</th>
                          <th className="px-3 py-2 text-left text-blue-700 font-semibold">Driver</th>
                          <th className="px-3 py-2 text-left text-blue-700 font-semibold">Type</th>
                          <th className="px-3 py-2 text-right text-blue-700 font-semibold">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {topCars.length > 0 ? (
                          topCars.map((car, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                              <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-900 font-medium">{car.car_id}</td>
                              <td className="px-3 py-2 text-slate-900">{car.driver_name}</td>
                              <td className="px-3 py-2 text-slate-600">{car.vehicle_type}</td>
                              <td className="px-3 py-2 text-right text-blue-600 font-bold">
                                ₹{(car.total_revenue / 1000).toFixed(2)}K
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Revenue Pie Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Distribution by Model</h3>
                  <div className="flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-48 h-48">
                      {(() => {
                        const total = mlStats.by_vehicle_type.reduce((sum, item) => sum + item.total_revenue, 0);
                        let currentAngle = 0;
                        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
                        
                        return mlStats.by_vehicle_type.map((item, idx) => {
                          const percentage = (item.total_revenue / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;
                          currentAngle = endAngle;
                          
                          const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
                          const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
                          const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
                          const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={idx}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[idx % colors.length]}
                              className="hover:opacity-80 transition-opacity"
                            />
                          );
                        });
                      })()}
                      <circle cx="100" cy="100" r="50" fill="white" />
                      <text x="100" y="100" textAnchor="middle" dy=".3em" className="text-sm font-bold fill-slate-700">
                        Revenue
                      </text>
                    </svg>
                  </div>
                  <div className="mt-4 space-y-2">
                    {mlStats.by_vehicle_type.map((item, idx) => {
                      const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'];
                      const total = mlStats.by_vehicle_type.reduce((sum, v) => sum + v.total_revenue, 0);
                      const percentage = ((item.total_revenue / total) * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                            <span className="text-slate-700">{item.vehicle_type}</span>
                          </div>
                          <span className="font-semibold text-slate-900">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Count Pie Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Fleet Distribution by Model</h3>
                  <div className="flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-48 h-48">
                      {(() => {
                        const total = mlStats.by_vehicle_type.reduce((sum, item) => sum + item.cars, 0);
                        let currentAngle = 0;
                        const colors = ['#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
                        
                        return mlStats.by_vehicle_type.map((item, idx) => {
                          const percentage = (item.cars / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;
                          currentAngle = endAngle;
                          
                          const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
                          const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
                          const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
                          const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);
                          const largeArc = angle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={idx}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={colors[idx % colors.length]}
                              className="hover:opacity-80 transition-opacity"
                            />
                          );
                        });
                      })()}
                      <circle cx="100" cy="100" r="50" fill="white" />
                      <text x="100" y="100" textAnchor="middle" dy=".3em" className="text-sm font-bold fill-slate-700">
                        Vehicles
                      </text>
                    </svg>
                  </div>
                  <div className="mt-4 space-y-2">
                    {mlStats.by_vehicle_type.map((item, idx) => {
                      const colors = ['bg-red-500', 'bg-cyan-500', 'bg-pink-500', 'bg-lime-500'];
                      const total = mlStats.by_vehicle_type.reduce((sum, v) => sum + v.cars, 0);
                      const percentage = ((item.cars / total) * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                            <span className="text-slate-700">{item.vehicle_type}</span>
                          </div>
                          <span className="font-semibold text-slate-900">{item.cars} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue Bar Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Comparison</h3>
                  <div className="space-y-3">
                    {mlStats.by_vehicle_type.map((item, idx) => {
                      const maxRevenue = Math.max(...mlStats.by_vehicle_type.map(v => v.total_revenue));
                      const percentage = (item.total_revenue / maxRevenue) * 100;
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700">{item.vehicle_type}</span>
                            <span className="text-emerald-600 font-semibold">
                              ₹{(item.total_revenue / 1000000).toFixed(2)}M
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                            <span>{item.cars} vehicles</span>
                            <span>{(item.total_km / 1000).toFixed(0)}K km</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Maintenance Cost Comparison */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Maintenance Cost Analysis</h3>
                  <svg viewBox="0 0 400 300" className="w-full">
                    {(() => {
                      const maxCost = Math.max(...mlStats.by_vehicle_type.map(m => m.total_maintenance_cost));
                      const barWidth = 60;
                      const spacing = 20;
                      const startX = 50;
                      const colors = ['#f59e0b', '#fb923c', '#f43f5e', '#facc15'];
                      
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
                                <defs>
                                  <linearGradient id={`maintGrad${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={colors[idx % colors.length]} stopOpacity="0.9" />
                                    <stop offset="100%" stopColor={colors[idx % colors.length]} stopOpacity="0.6" />
                                  </linearGradient>
                                </defs>
                                <rect
                                  x={x}
                                  y={220 - barHeight}
                                  width={barWidth}
                                  height={barHeight}
                                  fill={`url(#maintGrad${idx})`}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth="2"
                                  rx="4"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={240}
                                  fontSize="11"
                                  fill="#475569"
                                  textAnchor="middle"
                                  fontWeight="500"
                                >
                                  {model.vehicle_type}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={205 - barHeight}
                                  fontSize="12"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                  fontWeight="700"
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
                  <div className="mt-2 text-xs text-slate-500 text-center">
                    Total Maintenance Cost by Vehicle Model
                  </div>
                </div>

                {/* KM Driven Bar Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Total KM Driven</h3>
                  <svg viewBox="0 0 400 300" className="w-full">
                    {(() => {
                      const maxKm = Math.max(...mlStats.by_vehicle_type.map(m => m.total_km));
                      const barWidth = 60;
                      const spacing = 20;
                      const startX = 50;
                      const colors = ['#a855f7', '#6366f1', '#3b82f6', '#0ea5e9'];
                      
                      return (
                        <g>
                          {/* Axes */}
                          <line x1="40" y1="30" x2="40" y2="220" stroke="#64748b" strokeWidth="2" />
                          <line x1="40" y1="220" x2="380" y2="220" stroke="#64748b" strokeWidth="2" />
                          
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4].map((i) => (
                            <line
                              key={i}
                              x1="40"
                              y1={30 + i * 47.5}
                              x2="380"
                              y2={30 + i * 47.5}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              strokeDasharray="4"
                            />
                          ))}
                          
                          {/* Bars */}
                          {mlStats.by_vehicle_type.map((model, idx) => {
                            const barHeight = (model.total_km / maxKm) * 180;
                            const x = startX + idx * (barWidth + spacing);
                            
                            return (
                              <g key={idx}>
                                <defs>
                                  <linearGradient id={`kmGrad${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={colors[idx % colors.length]} stopOpacity="0.9" />
                                    <stop offset="100%" stopColor={colors[idx % colors.length]} stopOpacity="0.6" />
                                  </linearGradient>
                                </defs>
                                <rect
                                  x={x}
                                  y={220 - barHeight}
                                  width={barWidth}
                                  height={barHeight}
                                  fill={`url(#kmGrad${idx})`}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth="2"
                                  rx="4"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={240}
                                  fontSize="11"
                                  fill="#475569"
                                  textAnchor="middle"
                                  fontWeight="500"
                                >
                                  {model.vehicle_type}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={205 - barHeight}
                                  fontSize="12"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                  fontWeight="700"
                                >
                                  {(model.total_km / 1000000).toFixed(1)}M
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                  <div className="mt-2 text-xs text-slate-500 text-center">
                    Distance Traveled by Vehicle Model (in millions of km)
                  </div>
                </div>

                {/* Average Revenue per Vehicle */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Avg Revenue per Vehicle</h3>
                  <svg viewBox="0 0 400 300" className="w-full">
                    {(() => {
                      const maxAvgRevenue = Math.max(...mlStats.by_vehicle_type.map(m => m.avg_revenue));
                      const barWidth = 60;
                      const spacing = 20;
                      const startX = 50;
                      const colors = ['#3b82f6', '#06b6d4', '#6366f1', '#14b8a6'];
                      
                      return (
                        <g>
                          {/* Axes */}
                          <line x1="40" y1="30" x2="40" y2="220" stroke="#64748b" strokeWidth="2" />
                          <line x1="40" y1="220" x2="380" y2="220" stroke="#64748b" strokeWidth="2" />
                          
                          {/* Grid lines */}
                          {[0, 1, 2, 3, 4].map((i) => (
                            <line
                              key={i}
                              x1="40"
                              y1={30 + i * 47.5}
                              x2="380"
                              y2={30 + i * 47.5}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              strokeDasharray="4"
                            />
                          ))}
                          
                          {/* Bars */}
                          {mlStats.by_vehicle_type.map((model, idx) => {
                            const barHeight = (model.avg_revenue / maxAvgRevenue) * 180;
                            const x = startX + idx * (barWidth + spacing);
                            
                            return (
                              <g key={idx}>
                                <defs>
                                  <linearGradient id={`avgRevGrad${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={colors[idx % colors.length]} stopOpacity="0.9" />
                                    <stop offset="100%" stopColor={colors[idx % colors.length]} stopOpacity="0.6" />
                                  </linearGradient>
                                </defs>
                                <rect
                                  x={x}
                                  y={220 - barHeight}
                                  width={barWidth}
                                  height={barHeight}
                                  fill={`url(#avgRevGrad${idx})`}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth="2"
                                  rx="4"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={240}
                                  fontSize="11"
                                  fill="#475569"
                                  textAnchor="middle"
                                  fontWeight="500"
                                >
                                  {model.vehicle_type}
                                </text>
                                <text
                                  x={x + barWidth / 2}
                                  y={205 - barHeight}
                                  fontSize="12"
                                  fill="#0f172a"
                                  textAnchor="middle"
                                  fontWeight="700"
                                >
                                  ₹{(model.avg_revenue / 1000).toFixed(0)}K
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                  <div className="mt-2 text-xs text-slate-500 text-center">
                    Average Revenue per Vehicle by Model Type
                  </div>
                </div>

                {/* Battery Health Gauge */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Average Battery Health</h3>
                  <div className="space-y-4">
                    {mlStats.by_vehicle_type.map((item, idx) => {
                      const percentage = item.avg_battery_health;
                      const color = percentage >= 85 ? 'green' : percentage >= 75 ? 'yellow' : 'red';
                      const bgColor = color === 'green' ? 'from-green-500 to-green-600' : 
                                     color === 'yellow' ? 'from-yellow-500 to-yellow-600' : 
                                     'from-red-500 to-red-600';
                      const textColor = color === 'green' ? 'text-green-600' : 
                                       color === 'yellow' ? 'text-yellow-600' : 
                                       'text-red-600';
                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">{item.vehicle_type}</span>
                            <span className={`font-bold text-lg ${textColor}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="relative w-full bg-slate-100 rounded-full h-4">
                            <div
                              className={`bg-gradient-to-r ${bgColor} h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                              style={{ width: `${percentage}%` }}
                            >
                              <div className="w-2 h-2 bg-white rounded-full shadow"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Line Charts Section */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {/* Revenue Trend Line Chart */}
                {revenueTrend && revenueTrend.values.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend (12 Months)</h3>
                    <div className="relative">
                      <svg viewBox="0 0 400 200" className="w-full h-48">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="40"
                            y1={20 + i * 40}
                            x2="380"
                            y2={20 + i * 40}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#64748b" strokeWidth="2" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#64748b" strokeWidth="2" />
                        
                        {/* Line */}
                        {(() => {
                          const maxValue = Math.max(...revenueTrend.values);
                          const minValue = Math.min(...revenueTrend.values);
                          const range = maxValue - minValue;
                          const points = revenueTrend.values.map((val, idx) => {
                            const x = 40 + (idx / (revenueTrend.values.length - 1)) * 340;
                            const y = 180 - ((val - minValue) / range) * 160;
                            return `${x},${y}`;
                          }).join(' ');
                          
                          return (
                            <>
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinejoin="round"
                              />
                              {revenueTrend.values.map((val, idx) => {
                                const x = 40 + (idx / (revenueTrend.values.length - 1)) * 340;
                                const y = 180 - ((val - minValue) / range) * 160;
                                return (
                                  <circle
                                    key={idx}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#10b981"
                                    className="hover:r-6 transition-all"
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Latest: ₹{(revenueTrend.values[revenueTrend.values.length - 1] / 1000000).toFixed(2)}M</span>
                        <span>Peak: ₹{(Math.max(...revenueTrend.values) / 1000000).toFixed(2)}M</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* KM Driven Trend Line Chart */}
                {kmTrend && kmTrend.values.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">KM Driven Trend (12 Months)</h3>
                    <div className="relative">
                      <svg viewBox="0 0 400 200" className="w-full h-48">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="40"
                            y1={20 + i * 40}
                            x2="380"
                            y2={20 + i * 40}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#64748b" strokeWidth="2" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#64748b" strokeWidth="2" />
                        
                        {/* Line */}
                        {(() => {
                          const maxValue = Math.max(...kmTrend.values);
                          const minValue = Math.min(...kmTrend.values);
                          const range = maxValue - minValue;
                          const points = kmTrend.values.map((val, idx) => {
                            const x = 40 + (idx / (kmTrend.values.length - 1)) * 340;
                            const y = 180 - ((val - minValue) / range) * 160;
                            return `${x},${y}`;
                          }).join(' ');
                          
                          return (
                            <>
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinejoin="round"
                              />
                              {kmTrend.values.map((val, idx) => {
                                const x = 40 + (idx / (kmTrend.values.length - 1)) * 340;
                                const y = 180 - ((val - minValue) / range) * 160;
                                return (
                                  <circle
                                    key={idx}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#3b82f6"
                                    className="hover:r-6 transition-all"
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Latest: {(kmTrend.values[kmTrend.values.length - 1] / 1000000).toFixed(2)}M km</span>
                        <span>Peak: {(Math.max(...kmTrend.values) / 1000000).toFixed(2)}M km</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver Earnings Trend Line Chart */}
                {earningsTrend && earningsTrend.values.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Driver Earnings Trend (12 Months)</h3>
                    <div className="relative">
                      <svg viewBox="0 0 400 200" className="w-full h-48">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="40"
                            y1={20 + i * 40}
                            x2="380"
                            y2={20 + i * 40}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#64748b" strokeWidth="2" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#64748b" strokeWidth="2" />
                        
                        {/* Line */}
                        {(() => {
                          const maxValue = Math.max(...earningsTrend.values);
                          const minValue = Math.min(...earningsTrend.values);
                          const range = maxValue - minValue;
                          const points = earningsTrend.values.map((val, idx) => {
                            const x = 40 + (idx / (earningsTrend.values.length - 1)) * 340;
                            const y = 180 - ((val - minValue) / range) * 160;
                            return `${x},${y}`;
                          }).join(' ');
                          
                          return (
                            <>
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="3"
                                strokeLinejoin="round"
                              />
                              {earningsTrend.values.map((val, idx) => {
                                const x = 40 + (idx / (earningsTrend.values.length - 1)) * 340;
                                const y = 180 - ((val - minValue) / range) * 160;
                                return (
                                  <circle
                                    key={idx}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#8b5cf6"
                                    className="hover:r-6 transition-all"
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Latest: ₹{(earningsTrend.values[earningsTrend.values.length - 1] / 1000000).toFixed(2)}M</span>
                        <span>Peak: ₹{(Math.max(...earningsTrend.values) / 1000000).toFixed(2)}M</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Show message if no trend data */}
              {(!revenueTrend || revenueTrend.values.length === 0) && 
               (!kmTrend || kmTrend.values.length === 0) && 
               (!earningsTrend || earningsTrend.values.length === 0) && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                  <p className="text-slate-600">Loading trend data...</p>
                </div>
              )}

              {/* Driver Management Section */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div 
                  className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100"
                  onClick={() => setShowDriverSection(!showDriverSection)}
                >
                  <h3 className="text-lg font-semibold text-slate-900">Driver Management</h3>
                  <button className="text-slate-600">
                    {showDriverSection ? "▲ Hide" : "▼ Show"}
                  </button>
                </div>
                
                {showDriverSection && (
                  <div className="p-6 space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search by driver name, driver ID, or car ID..."
                        value={driverSearch}
                        onChange={(e) => {
                          setDriverSearch(e.target.value);
                          setDriverPage(1);
                        }}
                        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Driver Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Driver ID</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-700">City</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-700">Cars</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-700">Total Revenue</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-700">Avg Battery</th>
                            <th className="px-4 py-3 text-center font-medium text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {drivers.map((driver) => (
                            <tr key={driver.driver_id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-900 font-mono text-xs">{driver.driver_id}</td>
                              <td className="px-4 py-3 font-medium text-slate-900">{driver.driver_name}</td>
                              <td className="px-4 py-3 text-slate-700">{driver.city}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{driver.car_count}</td>
                              <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                                ₹{(driver.total_revenue / 1000).toFixed(0)}K
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-semibold ${
                                  driver.avg_battery_health >= 85 ? 'text-green-600' : 
                                  driver.avg_battery_health >= 75 ? 'text-yellow-600' : 
                                  'text-red-600'
                                }`}>
                                  {driver.avg_battery_health.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleViewDriverDetails(driver.driver_id)}
                                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handleEditDriver(driver)}
                                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDriver(driver.driver_id, driver.driver_name)}
                                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {drivers.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        No drivers found
                      </div>
                    )}

                    {/* Pagination */}
                    {driverTotalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        <button
                          onClick={() => setDriverPage(Math.max(1, driverPage - 1))}
                          disabled={driverPage === 1}
                          className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1">
                          Page {driverPage} of {driverTotalPages}
                        </span>
                        <button
                          onClick={() => setDriverPage(Math.min(driverTotalPages, driverPage + 1))}
                          disabled={driverPage === driverTotalPages}
                          className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edit Driver Modal */}
              {editingDriver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Edit Driver: {editingDriver.driver_id}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Driver Name
                        </label>
                        <input
                          type="text"
                          value={editDriverName}
                          onChange={(e) => setEditDriverName(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={editDriverCity}
                          onChange={(e) => setEditDriverCity(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingDriver(null)}
                          className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateDriver}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View Driver Details Modal */}
              {viewingDriverDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                  <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 my-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-slate-900">
                        Driver Details
                      </h3>
                      <button
                        onClick={() => setViewingDriverDetails(null)}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    {/* Driver Info */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-slate-900 mb-3">Driver Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Driver ID</p>
                          <p className="font-mono text-sm font-semibold text-slate-900">{viewingDriverDetails.driver_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Name</p>
                          <p className="text-sm font-semibold text-slate-900">{viewingDriverDetails.driver_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">City</p>
                          <p className="text-sm font-semibold text-slate-900">{viewingDriverDetails.city}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Total Cars</p>
                          <p className="text-sm font-semibold text-slate-900">{viewingDriverDetails.car_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Total Revenue</p>
                          <p className="text-sm font-semibold text-emerald-600">₹{(viewingDriverDetails.total_revenue / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Total Maintenance</p>
                          <p className="text-sm font-semibold text-amber-600">₹{(viewingDriverDetails.total_maintenance_cost / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase">Avg Battery Health</p>
                          <p className={`text-sm font-semibold ${
                            viewingDriverDetails.avg_battery_health >= 85 ? 'text-green-600' : 
                            viewingDriverDetails.avg_battery_health >= 75 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {viewingDriverDetails.avg_battery_health.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cars List */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Assigned Vehicles ({viewingDriverDetails.cars.length})</h4>
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {viewingDriverDetails.cars.map((car) => (
                          <div key={car.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-mono text-sm font-semibold text-slate-900">{car.car_id}</p>
                                <p className="text-sm text-slate-600">{car.vehicle_type}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                car.battery_health >= 85 ? 'bg-green-100 text-green-700' : 
                                car.battery_health >= 75 ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                Battery: {car.battery_health.toFixed(1)}%
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <p className="text-slate-500">Vehicle Age</p>
                                <p className="font-semibold text-slate-900">{car.vehicle_age} years</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Trips/Month</p>
                                <p className="font-semibold text-slate-900">{car.trips_per_month}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Max Speed</p>
                                <p className="font-semibold text-slate-900">{car.max_speed} km/h</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Overspeed Count</p>
                                <p className="font-semibold text-slate-900">{car.overspeed_count}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Charge/km</p>
                                <p className="font-semibold text-slate-900">{car.charge_per_km.toFixed(2)} kWh</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Gross Revenue</p>
                                <p className="font-semibold text-emerald-600">₹{(car.gross_revenue / 1000).toFixed(1)}K</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Driver Earnings</p>
                                <p className="font-semibold text-blue-600">₹{(car.driver_charge / 1000).toFixed(1)}K</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Operating Cost</p>
                                <p className="font-semibold text-red-600">₹{(car.total_operating_cost / 1000).toFixed(1)}K</p>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-200">
                              <div className="text-xs">
                                <p className="text-slate-500">Charging</p>
                                <p className="font-semibold text-slate-900">₹{(car.charging_cost / 1000).toFixed(1)}K</p>
                              </div>
                              <div className="text-xs">
                                <p className="text-slate-500">Maintenance</p>
                                <p className="font-semibold text-slate-900">₹{(car.maintenance_cost / 1000).toFixed(1)}K</p>
                              </div>
                              <div className="text-xs">
                                <p className="text-slate-500">Garage</p>
                                <p className="font-semibold text-slate-900">₹{(car.garage_cost / 1000).toFixed(1)}K</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setViewingDriverDetails(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Type Details Table */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-semibold text-slate-900">Detailed Model Statistics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-700">Vehicle Model</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Vehicles</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Total Revenue</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Avg Revenue</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Total KM</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Avg Battery</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-700">Maintenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {mlStats.by_vehicle_type.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.vehicle_type}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{item.cars}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                            ₹{(item.total_revenue / 1000000).toFixed(2)}M
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                            ₹{(item.avg_revenue / 1000).toFixed(0)}K
                          </td>
                          <td className="px-4 py-3 text-right text-purple-600">
                            {(item.total_km / 1000).toFixed(0)}K
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${
                              item.avg_battery_health >= 85 ? 'text-green-600' : 
                              item.avg_battery_health >= 75 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {item.avg_battery_health.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-amber-600 font-semibold">
                            ₹{(item.total_maintenance_cost / 1000000).toFixed(2)}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-600">
              No analytics data available
            </div>
          )}
    </section>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminManagementContent />
    </ProtectedRoute>
  );
}
