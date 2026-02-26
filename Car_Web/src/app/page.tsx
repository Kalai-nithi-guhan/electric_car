"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Fleet Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Electric car fleet management system with role-based access control.
        </p>
      </div>

      {user ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-900">
            Welcome back, {user.username}!
          </h2>
          <p className="mt-2 text-sm text-emerald-700">
            You are logged in as{" "}
            <span className="font-medium">
              {user.role === "admin" ? "Owner (Admin)" : "Driver"}
            </span>
          </p>
          <Link
            href={user.role === "admin" ? "/owner" : "/driver"}
            className="mt-4 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/sign-in"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
          >
            <h2 className="text-xl font-semibold">Sign In</h2>
            <p className="mt-2 text-sm text-slate-600">
              Login as Owner (Admin) or Driver to access your dashboard.
            </p>
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
          >
            <h2 className="text-xl font-semibold">Register Driver</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create a new driver account to get started with the fleet.
            </p>
          </Link>

          <Link
            href="/register/admin"
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
          >
            <h2 className="text-xl font-semibold">Register Admin</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create a new admin account (requires existing admin password).
            </p>
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Owner View</h2>
          <p className="mt-2 text-sm text-slate-600">
            Access fleet analytics, revenue tracking, cost analysis, and vehicle management.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>• View all vehicles in the fleet</li>
            <li>• Monthly revenue and cost trends</li>
            <li>• Net profit/loss calculations</li>
            <li>• Financial analytics dashboard</li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Driver View</h2>
          <p className="mt-2 text-sm text-slate-600">
            Real-time vehicle status, battery monitoring, and trip information.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>• Live battery charge status</li>
            <li>• Remaining distance estimation</li>
            <li>• Remaining time calculation</li>
            <li>• Auto-refresh every 3 seconds</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

