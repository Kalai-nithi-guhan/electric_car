"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface DriverProfile {
  driver_id: string;
  driver_name: string;
  car_id: string;
  vehicle_type: string;
  vehicle_age: number;
  total_km_driven: number;
  battery_capacity_kw: number;
  charge_per_km: number;
  current_charge_percentage: number;
  battery_health: number;
  city: string;
  status: string;
  max_speed: number;
  gross_revenue: number;
  driver_earnings: number;
}

interface DriverPrediction {
  predicted_battery_health: number;
  estimated_distance_km: number;
  current_charge_percentage: number;
  charge_per_km: number;
  generated_at: string;
}

function DriverDashboard() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [prediction, setPrediction] = useState<DriverPrediction | null>(null);
  const [currentCharge, setCurrentCharge] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/driver/profile`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setCurrentCharge(String(Math.round(data.current_charge_percentage || 0)));
        } else {
          const data = await response.json();
          setError(data.error || "Failed to load driver profile");
        }
      } catch (err) {
        setError("Failed to load driver profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handlePredict = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const chargeValue = Number(currentCharge);
    if (Number.isNaN(chargeValue) || chargeValue < 0 || chargeValue > 100) {
      setError("Enter a valid charge percentage (0-100)");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/driver/predict-km`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current_charge_percentage: chargeValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data.prediction || null);
        if (data.profile) {
          setProfile(data.profile);
        }
      } else {
        const data = await response.json();
        setError(data.error || "Prediction failed");
      }
    } catch (err) {
      setError("Prediction failed");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!profile) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Driver Dashboard</h1>
          <p className="mt-1 text-sm text-red-600">{error || "Driver profile not found"}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Driver Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome {profile.driver_name} (Driver ID: {profile.driver_id})
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Assigned Car" value={profile.car_id} />
        <MetricCard label="Vehicle Type" value={profile.vehicle_type} />
        <MetricCard label="Total KM Driven" value={`${profile.total_km_driven.toFixed(0)} km`} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Battery Capacity" value={`${profile.battery_capacity_kw.toFixed(1)} kW`} />
        <MetricCard label="Charge per KM" value={`${profile.charge_per_km.toFixed(3)} kWh`} />
        <MetricCard label="Battery Health" value={`${profile.battery_health.toFixed(1)}%`} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Predict Remaining KM</h2>
        <p className="text-sm text-slate-600 mt-1">
          Enter only the current charge percentage. Other values are loaded from the dataset.
        </p>

        <form onSubmit={handlePredict} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Current Charge %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={currentCharge}
              onChange={(e) => setCurrentCharge(e.target.value)}
              className="mt-1 w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Predicting..." : "Predict"}
          </button>
        </form>

        {prediction && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-700">Predicted Battery Health</p>
              <p className="text-2xl font-bold text-emerald-700">
                {prediction.predicted_battery_health.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-700">Estimated Remaining KM</p>
              <p className="text-2xl font-bold text-blue-700">
                {prediction.estimated_distance_km.toFixed(1)} km
              </p>
            </div>
          </div>
        )}
      </section>
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
