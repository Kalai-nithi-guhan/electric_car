"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Car Fleet Insights
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <span className="text-slate-600 mr-2">
                Welcome, <span className="font-medium text-slate-900">{user.username}</span>
                <span className="text-xs ml-1 bg-slate-100 px-2 py-0.5 rounded">
                  {user.role === "admin" ? "Owner" : "Driver"}
                </span>
              </span>
              
              {user.role === "admin" && (
                <>
                  <Link
                    href="/owner"
                    className={`rounded-md border px-3 py-1.5 ${
                      pathname === "/owner"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin"
                    className={`rounded-md border px-3 py-1.5 ${
                      pathname === "/admin"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    Admin Panel
                  </Link>
                </>
              )}
              
              {user.role === "driver" && (
                <Link
                  href="/driver"
                  className={`rounded-md border px-3 py-1.5 ${
                    pathname === "/driver"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  Dashboard
                </Link>
              )}

              <button
                onClick={logout}
                className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
