export interface IpGeoResult {
  region?: string;
  comuna?: string;
}

export async function resolveIpGeo(ip: string | null): Promise<IpGeoResult | null> {
  if (!ip || !process.env.IPGEO_URL) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${process.env.IPGEO_URL}?ip=${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      region?: string;
      comuna?: string;
      city?: string;
    };
    return {
      region: data.region ?? undefined,
      comuna: data.comuna ?? data.city ?? undefined,
    };
  } catch {
    return null;
  }
}