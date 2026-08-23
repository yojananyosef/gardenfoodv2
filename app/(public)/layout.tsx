import { TelemetryProvider } from "@/components/analytics/TelemetryProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/top-bar";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <TelemetryProvider>
      <div className="flex min-h-full flex-col">
        <TopBar />
        <main
          className={cn(
            "mx-auto w-full max-w-2xl flex-1 px-4 py-6",
            user && "pb-24 md:pb-6",
          )}
        >
          {children}
        </main>
        {user && <BottomNav />}
      </div>
    </TelemetryProvider>
  );
}
