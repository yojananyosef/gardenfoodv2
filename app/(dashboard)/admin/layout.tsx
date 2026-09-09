import { ShieldCheck } from "lucide-react";

import { AdminTabs } from "./AdminTabs";
import { isAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const ok = await isAdmin(supabase);
  if (!ok) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>Solo administradores.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <h1 className="font-heading text-lg font-semibold tracking-tight">Panel admin</h1>
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
