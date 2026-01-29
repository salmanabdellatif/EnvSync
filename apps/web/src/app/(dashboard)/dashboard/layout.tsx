import { Suspense } from "react";
import { Sidebar, DashboardShell } from "@/components/layout";
import { CLIAuthHandler } from "@/components/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={null}>
        <CLIAuthHandler />
      </Suspense>

      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Mobile-responsive shell with header and drawer */}
      <div className="flex-1 flex flex-col">
        <DashboardShell>{children}</DashboardShell>
      </div>
    </div>
  );
}
