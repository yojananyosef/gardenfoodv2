import type { Database } from "@/types/database.types";

/**
 * Tipos de escritura para las tablas que el proyecto actualiza.
 *
 * El problema que resuelven: con un cliente de Supabase sin tipar,
 * `.update(algo)` acepta cualquier objeto. Con el cliente tipado
 * (`createClient<Database>`) TypeScript exige la forma exacta de la fila, y un
 * `Record<string, unknown>` no sirve. Estos alias son la forma de esa fila.
 *
 * Tambien hacen visible un error que antes no se veaia: escribir una columna
 * que no existe. Por ejemplo, `perfiles` no tiene `status` ni
 * `current_period_end`; esas son de `gf_subscriptions`. Con el cliente sin
 * tipar, el error aparecia en tiempo de ejecucion y solo para quien pagaba.
 */
export type PerfilUpdate = Database["public"]["Tables"]["perfiles"]["Update"];
export type SuscripcionUpdate = Database["public"]["Tables"]["gf_subscriptions"]["Update"];
export type PatrocinioUpdate = Database["public"]["Tables"]["gf_sponsorships"]["Update"];
export type HuertoUpdate = Database["public"]["Tables"]["gf_huertos"]["Update"];
export type ArbolUpdate = Database["public"]["Tables"]["gf_arboles"]["Update"];
export type EventoAnalytics = Database["public"]["Tables"]["gf_analytics_events"]["Row"];