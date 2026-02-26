import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Car Fleet Insights",
  description: "Electric car fleet management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navigation />
            <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
