import { TelemetryProvider } from "@/components/analytics/TelemetryProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/top-bar";
import { isAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const esAdmin = await isAdmin(supabase);

  return (
    <TelemetryProvider>
      <div className="flex min-h-full flex-col">
        <TopBar esAdmin={esAdmin} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-6">
          {children}
        </main>
        <BottomNav esAdmin={esAdmin} />
      </div>
    </TelemetryProvider>
  );
}
