// Plan definitions for the subscription business model (modelo 1).
// Prices in CLP. Yearly = 10× monthly (≈2 months free) — paid as single yearly charge via
// Mercado Pago preapproval with frequency:12, frequency_type:"months" (hosted init_point).
// Monthly = frequency:1, months. Do not use years; MP sandbox rejects it for plan-less preapprovals.
// Hosted redirect avoids CSP nonce + secure-fields `fontSize string / No length configuration` errors.

export type PlanTier = "huertero" | "cosecha" | "full";
export type BillingInterval = "monthly" | "yearly";

export interface PlanDef {
  tier: PlanTier;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    tier: "huertero",
    name: "Huertero",
    tagline: "Para quienes cultivan en casa y quieren llevar registro pro.",
    monthly: 9990,
    yearly: 99900,
    features: [
      "Huertos y cultivos ilimitados",
      "Calendario y tareas automáticas",
      "Registro de cosechas y logros",
      "Sin anuncios patrocinados",
    ],
  },
  {
    tier: "cosecha",
    name: "Cosecha",
    tagline: "Más control y datos de tu producción.",
    monthly: 19990,
    yearly: 199900,
    features: [
      "Todo lo de Huertero",
      "Analítica de producción (kg, por especie)",
      "Comparativas de temporadas",
      "Exportación de registros",
    ],
  },
  {
    tier: "full",
    name: "Full",
    tagline: "Para restaurantes, cooperativas y municipalidades.",
    monthly: 29990,
    yearly: 299900,
    features: [
      "Todo lo de Cosecha",
      "Usuarios del equipo (hasta 5)",
      "Soporte prioritario",
      "Reportes para entregar a socios",
    ],
  },
];

export const PAID_TIERS: PlanTier[] = ["huertero", "cosecha", "full"];

export function isPaidTier(plan: string | null | undefined): plan is PlanTier {
  return !!plan && (PAID_TIERS as string[]).includes(plan);
}

export type PlanAcceso = PlanTier | "gratuito" | "admin";

export const FREE_LIMITS = {
  cultivos: 3,
  arboles: 1,
  huertos: 1,
} as const;

// Exploración libre anónima del widget del landing (`/`): solo estas 3
// regiones muestran tareas sin sesión. El resto invita a login/registro.
// Usuarios logueados (cualquier plan) ven las 16 desbloqueadas.
export const REGIONES_EXPLORACION_LIBRE = ["Metropolitana", "O'Higgins", "Ñuble"] as const;

export function esRegionExploracionLibre(region: string | null | undefined): boolean {
  if (!region) return false;
  return (REGIONES_EXPLORACION_LIBRE as readonly string[]).includes(region);
}

export function puedeExplorarRegion(
  region: string | null | undefined,
  opts: { isAuthenticated: boolean },
): boolean {
  if (opts.isAuthenticated) return true;
  return esRegionExploracionLibre(region);
}

function tieneAccesoIlimitado(plan: PlanAcceso): boolean {
  return plan === "admin" || isPaidTier(plan);
}

export function puedeAgregarCultivo(
  cultivosActuales: number,
  plan: PlanAcceso,
): boolean {
  if (tieneAccesoIlimitado(plan)) return true;
  return cultivosActuales < FREE_LIMITS.cultivos;
}

export function puedeAgregarArbol(
  arbolesActuales: number,
  plan: PlanAcceso,
): boolean {
  if (tieneAccesoIlimitado(plan)) return true;
  return arbolesActuales < FREE_LIMITS.arboles;
}

export function puedeAgregarHuerto(
  huertosActuales: number,
  plan: PlanAcceso,
): boolean {
  if (tieneAccesoIlimitado(plan)) return true;
  return huertosActuales < FREE_LIMITS.huertos;
}

export function limitesDe(plan: PlanAcceso): {
  cultivos: number | null;
  arboles: number | null;
  huertos: number | null;
} {
  if (tieneAccesoIlimitado(plan)) return { cultivos: null, arboles: null, huertos: null };
  return { cultivos: FREE_LIMITS.cultivos, arboles: FREE_LIMITS.arboles, huertos: FREE_LIMITS.huertos };
}

export function getPlan(tier: PlanTier): PlanDef {
  const plan = PLANS.find((p) => p.tier === tier);
  if (!plan) throw new Error(`Unknown plan tier: ${tier}`);
  return plan;
}

export function mpPlanKey(tier: PlanTier, interval: BillingInterval): string {
  return `${tier}_${interval}`;
}

export function planAmount(tier: PlanTier, interval: BillingInterval): number {
  const plan = getPlan(tier);
  return interval === "yearly" ? plan.yearly : plan.monthly;
}

export function describeInterval(interval: BillingInterval): string {
  return interval === "yearly" ? "anual (2 meses gratis)" : "mensual";
}
