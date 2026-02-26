import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Fleet Insights",
  description: "Frontend-only owner and driver dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Car Fleet Insights
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                <Link
                  href="/sign-in"
                  className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
                >
                  Sign In
                </Link>
                <Link
                  href="/owner"
                  className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
                >
                  Owner View
                </Link>
                <Link
                  href="/driver"
                  className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
                >
                  Driver View
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
