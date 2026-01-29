import { SettingsForm } from "@/components/settings";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <SettingsForm />
    </div>
  );
}
