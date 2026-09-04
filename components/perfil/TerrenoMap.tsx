"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CENTRO_DEFAULT,
  MAPA_MAX_ZOOM,
  ZOOM_DEFAULT,
  ZOOM_UBICACION,
  featureDesdePuntos,
  formatAreaM2,
  puntosDesdeFeature,
  terrenoAreaM2,
  type PuntoMapa,
  type TerrenoFeature,
} from "@/lib/huerto/terreno";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ESRI_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTR =
  "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics";
const ESRI_REF_URL =
  "https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}";
const ESRI_REF_ATTR = "© Esri — Reference Overlay";

export type HuertoMapa = {
  id: string;
  nombre: string;
  feature: TerrenoFeature;
};

type TerrenoMapProps = {
  huertosIniciales: HuertoMapa[];
  puedeDibujar: boolean;
  onCrear: (feature: TerrenoFeature) => Promise<string | null>;
  onEditar: (id: string, feature: TerrenoFeature) => void;
  onEliminar: (id: string) => Promise<boolean>;
  onLimite: () => void;
};

function comoPolygon(layer: Leaflet.Layer): Leaflet.Polygon {
  return layer as unknown as Leaflet.Polygon;
}

function anilloDePolygon(capa: Leaflet.Polygon): PuntoMapa[] {
  const latlngs = capa.getLatLngs() as Leaflet.LatLng[][];
  return (latlngs[0] ?? []).map((p) => ({ lat: p.lat, lng: p.lng }));
}

export function TerrenoMap({
  huertosIniciales,
  puedeDibujar,
  onCrear,
  onEditar,
  onEliminar,
  onLimite,
}: TerrenoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const capasRef = useRef<Map<Leaflet.Polygon, string>>(new Map());
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const ubicacionMarkerRef = useRef<Leaflet.CircleMarker | null>(null);
  const ubicacionCirculoRef = useRef<Leaflet.Circle | null>(null);
  const inicialesRef = useRef(huertosIniciales);
  const puedeDibujarRef = useRef(puedeDibujar);
  const onCrearRef = useRef(onCrear);
  const onEditarRef = useRef(onEditar);
  const onEliminarRef = useRef(onEliminar);
  const onLimiteRef = useRef(onLimite);

  useEffect(() => {
    puedeDibujarRef.current = puedeDibujar;
    onCrearRef.current = onCrear;
    onEditarRef.current = onEditar;
    onEliminarRef.current = onEliminar;
    onLimiteRef.current = onLimite;
  }, [puedeDibujar, onCrear, onEditar, onEliminar, onLimite]);

  const [areaPantalla, setAreaPantalla] = useState<{
    total: number;
    huertos: number;
  } | null>(null);
  const [dibujando, setDibujando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localizando, setLocalizando] = useState(false);
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        await import("@geoman-io/leaflet-geoman-free");
        if (cancelled || !containerRef.current) return;

        leafletRef.current = L as unknown as typeof Leaflet;

        const map = L.map(containerRef.current, {
          maxZoom: MAPA_MAX_ZOOM,
          zoomControl: true,
        });
        mapRef.current = map;

        const satelite = L.tileLayer(ESRI_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          attribution: ESRI_ATTR,
        });
        const calles = L.tileLayer(OSM_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          attribution: OSM_ATTR,
        });
        const limites = L.tileLayer(ESRI_REF_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          attribution: ESRI_REF_ATTR,
        });
        satelite.addTo(map);
        limites.addTo(map);
        L.control
          .layers(
            { "Satélite (Esri)": satelite, "Calles (OSM)": calles },
            { "Límites y lugares": limites },
          )
          .addTo(map);

        map.setView([CENTRO_DEFAULT.lat, CENTRO_DEFAULT.lng], ZOOM_DEFAULT);

        function mostrarUbicacion(
          lat: number,
          lng: number,
          accuracy: number | null,
        ) {
          if (ubicacionMarkerRef.current) {
            map.removeLayer(ubicacionMarkerRef.current);
            ubicacionMarkerRef.current = null;
          }
          if (ubicacionCirculoRef.current) {
            map.removeLayer(ubicacionCirculoRef.current);
            ubicacionCirculoRef.current = null;
          }
          if (accuracy !== null && Number.isFinite(accuracy)) {
            ubicacionCirculoRef.current = L.circle([lat, lng], {
              radius: Math.min(accuracy, 5000),
              color: "#2563eb",
              weight: 1,
              fillColor: "#2563eb",
              fillOpacity: 0.12,
            }).addTo(map);
          }
          ubicacionMarkerRef.current = L.circleMarker([lat, lng], {
            radius: 7,
            color: "#ffffff",
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.95,
          })
            .addTo(map)
            .bindTooltip("Tu ubicación")
            .openTooltip();
        }

        map.pm.addControls({
          position: "topleft",
          drawMarker: false,
          drawCircleMarker: false,
          drawPolyline: false,
          drawRectangle: false,
          drawCircle: false,
          drawText: false,
          cutPolygon: false,
          rotateMode: false,
          dragMode: false,
          drawPolygon: true,
          editMode: true,
          removalMode: true,
        });

        function featureDeCapa(capa: Leaflet.Polygon): TerrenoFeature | null {
          const puntos = anilloDePolygon(capa);
          if (puntos.length < 3) return null;
          return featureDesdePuntos(puntos);
        }

        function actualizarAreaPantalla() {
          let total = 0;
          for (const capa of capasRef.current.keys()) {
            total += terrenoAreaM2(
              featureDeCapa(capa)?.geometry.coordinates ?? [],
            );
          }
          setAreaPantalla({ total, huertos: capasRef.current.size });
        }

        map.on("pm:drawstart", () => {
          if (!puedeDibujarRef.current) {
            map.pm.disableDraw();
            onLimiteRef.current();
            return;
          }
          setDibujando(true);
        });

        map.on("pm:drawend", () => setDibujando(false));

        map.on("pm:create", (e) => {
          setDibujando(false);
          const capa = comoPolygon(e.layer);
          const feature = featureDeCapa(capa);
          if (!feature) return;
          void (async () => {
            const id = await onCrearRef.current(feature);
            if (cancelled) return;
            if (id) {
              capasRef.current.set(capa, id);
              capa.bindTooltip("Huerto");
              actualizarAreaPantalla();
            } else {
              map.removeLayer(capa);
            }
          })();
        });

        map.on("pm:vertexadded", (e) => {
          const workingLayer = (e as unknown as { workingLayer: Leaflet.Polygon })
            .workingLayer;
          if (!workingLayer) return;
          const puntos = anilloDePolygon(workingLayer);
          if (puntos.length < 3) {
            setAreaPantalla(null);
            return;
          }
          setAreaPantalla({
            total: terrenoAreaM2(
              featureDesdePuntos(puntos).geometry.coordinates,
            ),
            huertos: capasRef.current.size,
          });
        });

        map.on("pm:edit", (e) => {
          const capa = comoPolygon(e.layer);
          const id = capasRef.current.get(capa);
          if (!id) return;
          const feature = featureDeCapa(capa);
          if (!feature) return;
          onEditarRef.current(id, feature);
          actualizarAreaPantalla();
        });

        map.on("pm:remove", (e) => {
          const capa = comoPolygon(e.layer);
          const id = capasRef.current.get(capa);
          if (!id) return;
          capasRef.current.delete(capa);
          void (async () => {
            const confirmado = await onEliminarRef.current(id);
            if (cancelled) return;
            if (!confirmado) {
              capasRef.current.set(capa, id);
              capa.addTo(map);
            }
            actualizarAreaPantalla();
          })();
        });

        for (const huerto of inicialesRef.current) {
          const puntos = puntosDesdeFeature(huerto.feature);
          if (puntos.length < 3) continue;
          const capa = L.polygon(puntos).addTo(map);
          capa.bindTooltip(huerto.nombre);
          capasRef.current.set(capa, huerto.id);
        }

        if (capasRef.current.size > 0) {
          const grupo = L.featureGroup([...capasRef.current.keys()]);
          map.fitBounds(grupo.getBounds(), { padding: [24, 24] });
          actualizarAreaPantalla();
        } else if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled || mapRef.current !== map) return;
              map.setView(
                [pos.coords.latitude, pos.coords.longitude],
                Math.min(ZOOM_UBICACION, MAPA_MAX_ZOOM),
              );
              mostrarUbicacion(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.accuracy,
              );
            },
            () => {
              if (cancelled || mapRef.current !== map) return;
            },
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
          );
        }
      } catch {
        if (!cancelled) setError("No se pudo cargar el mapa. Revisa tu conexión.");
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      capasRef.current = new Map();
      ubicacionMarkerRef.current = null;
      ubicacionCirculoRef.current = null;
    };
    // El mapa se monta una sola vez; los huertos iniciales ya están cargados
    // cuando la sección lo renderiza (se oculta mientras carga).
  }, []);

  function centrarEnMiUbicacion() {
    const map = mapRef.current;
    const leafletInstance = leafletRef.current as unknown as {
      circle: typeof import("leaflet").circle;
      circleMarker: typeof import("leaflet").circleMarker;
    } | null;
    if (!map || !leafletInstance) return;
    if (!("geolocation" in navigator)) {
      setUbicacionError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocalizando(true);
    setUbicacionError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapRef.current) return;
        setLocalizando(false);
        const currentMap = mapRef.current!;
        const Ll = leafletRef.current as unknown as {
          circle: typeof import("leaflet").circle;
          circleMarker: typeof import("leaflet").circleMarker;
        } | null;
        if (!Ll) return;
        currentMap.setView(
          [pos.coords.latitude, pos.coords.longitude],
          Math.min(ZOOM_UBICACION, MAPA_MAX_ZOOM),
        );
        if (ubicacionMarkerRef.current) {
          currentMap.removeLayer(ubicacionMarkerRef.current);
          ubicacionMarkerRef.current = null;
        }
        if (ubicacionCirculoRef.current) {
          currentMap.removeLayer(ubicacionCirculoRef.current);
          ubicacionCirculoRef.current = null;
        }
        if (Number.isFinite(pos.coords.accuracy)) {
          ubicacionCirculoRef.current = Ll.circle(
            [pos.coords.latitude, pos.coords.longitude],
            {
              radius: Math.min(pos.coords.accuracy, 5000),
              color: "#2563eb",
              weight: 1,
              fillColor: "#2563eb",
              fillOpacity: 0.12,
            },
          ).addTo(currentMap);
        }
        ubicacionMarkerRef.current = Ll.circleMarker(
          [pos.coords.latitude, pos.coords.longitude],
          {
            radius: 7,
            color: "#ffffff",
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.95,
          },
        )
          .addTo(currentMap)
          .bindTooltip("Tu ubicación")
          .openTooltip();
      },
      (err) => {
        setLocalizando(false);
        if (err.code === err.PERMISSION_DENIED) {
          setUbicacionError(
            "Permiso denegado. Actívalo en el navegador (candado → Ubicación → Permitir) y vuelve a intentar.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setUbicacionError("Ubicación no disponible en este dispositivo.");
        } else if (err.code === err.TIMEOUT) {
          setUbicacionError(
            "Tiempo agotado. Acércate a una ventana y vuelve a intentar.",
          );
        } else {
          setUbicacionError("No se pudo obtener tu ubicación. Revisa los permisos.");
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  function cancelarDibujo() {
    const map = mapRef.current;
    if (!map) return;
    map.pm.disableDraw();
  }

  if (error) {
    return (
      <p className="text-sm text-muted-foreground" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="h-80 w-full overflow-hidden rounded-md border"
        aria-label="Mapa para delimitar tus huertos"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {dibujando && areaPantalla !== null
            ? `Superficie aproximada: ${formatAreaM2(areaPantalla.total)}`
            : areaPantalla && areaPantalla.huertos > 0
              ? `${areaPantalla.huertos} ${areaPantalla.huertos === 1 ? "huerto" : "huertos"} · Superficie total: ${formatAreaM2(areaPantalla.total)}`
              : "Activa el ícono de polígono y toca las esquinas de tu terreno."}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9"
            onClick={centrarEnMiUbicacion}
            disabled={localizando}
          >
            <LocateFixed className="size-4" />
            {localizando ? "Ubicando…" : "Mi ubicación"}
          </Button>
          {dibujando && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9"
              onClick={cancelarDibujo}
            >
              Cancelar dibujo
            </Button>
          )}
        </div>
      </div>
      {ubicacionError && (
        <p className="text-xs text-amber-700" role="alert">
          {ubicacionError}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Dibuja cada huerto con el ícono de polígono; puedes tener varios. Edita
        vértices o borra con las herramientas del mapa. Vista Satélite muestra
        límites y nombres gracias a Esri Reference; usa el control de capas
        (arriba a la derecha) para alternar a Calles.
      </p>
    </div>
  );
}
