"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    driver_name: "",
    city: "",
    vehicle_type: "Sedan",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        driver_name: formData.driver_name || formData.username,
        city: formData.city,
        vehicle_type: formData.vehicle_type,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Driver Registration</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a new driver account to get started.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Username *
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Driver Name *
              <input
                type="text"
                name="driver_name"
                value={formData.driver_name}
                onChange={handleChange}
                placeholder="Leave empty to use username"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Email *
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Phone *
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              City *
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Vehicle Type
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Compact">Compact</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Password *
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Confirm Password *
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <a href="/sign-in" className="font-medium text-slate-900 hover:underline">
                Sign In
              </a>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
