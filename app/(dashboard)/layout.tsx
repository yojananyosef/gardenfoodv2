import { TelemetryProvider } from "@/components/analytics/TelemetryProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TelemetryProvider>
      <div className="flex min-h-full flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-6 md:pb-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </TelemetryProvider>
  );
}
