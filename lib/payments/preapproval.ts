import type { SubscriptionStatus } from "./types";

export interface PreapprovalMapping {
  sub: SubscriptionStatus;
  grantsAccess: boolean;
}

// Único mapeo MP preapproval → estado interno. Solo `authorized` concede
// acceso al plan; `pending` (checkout abandonado o trial futuro) queda como
// `trialing` sin conceder el tier pago.
export function mapPreapprovalStatus(mp: string): PreapprovalMapping {
  switch (mp) {
    case "authorized":
      return { sub: "active", grantsAccess: true };
    case "cancelled":
      return { sub: "canceled", grantsAccess: false };
    case "paused":
      return { sub: "inactive", grantsAccess: false };
    case "pending":
      return { sub: "trialing", grantsAccess: false };
    default:
      return { sub: "trialing", grantsAccess: false };
  }
}
