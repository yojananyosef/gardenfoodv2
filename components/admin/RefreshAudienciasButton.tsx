"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function RefreshAudienciasButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/admin/audiences/refresh", {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; processed?: number };
      if (!res.ok) {
        setMessage(data.error ?? "No se pudo refrescar las audiencias.");
        return;
      }
      setMessage(`Audiencias actualizadas: ${data.processed ?? 0}.`);
      router.refresh();
    } catch {
      setMessage("No se pudo refrescar las audiencias.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full"
        onClick={refresh}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Refrescando…
          </>
        ) : (
          "Refrescar audiencias"
        )}
      </Button>
      {message ? (
        <p className="text-xs text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
