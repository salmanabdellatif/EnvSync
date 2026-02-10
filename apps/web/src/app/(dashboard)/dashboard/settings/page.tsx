import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "Settings - EnvSync",
  description: "Manage your account preferences and profile.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Settings" }]} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
