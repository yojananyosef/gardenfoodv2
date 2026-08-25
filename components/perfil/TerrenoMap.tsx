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

type TerrenoMapProps = {
  featureInicial: TerrenoFeature | null;
  onChange: (feature: TerrenoFeature | null) => void;
};

function comoPolygon(layer: Leaflet.Layer): Leaflet.Polygon {
  return layer as unknown as Leaflet.Polygon;
}

function anilloDePolygon(capa: Leaflet.Polygon): PuntoMapa[] {
  const latlngs = capa.getLatLngs() as Leaflet.LatLng[][];
  return (latlngs[0] ?? []).map((p) => ({ lat: p.lat, lng: p.lng }));
}

export function TerrenoMap({ featureInicial, onChange }: TerrenoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const capaRef = useRef<Leaflet.Polygon | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const ubicacionMarkerRef = useRef<Leaflet.CircleMarker | null>(null);
  const ubicacionCirculoRef = useRef<Leaflet.Circle | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const [areaM2, setAreaM2] = useState<number | null>(null);
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

        const emitirFeature = (capa: Leaflet.Polygon | null) => {
          if (!capa) {
            setAreaM2(null);
            onChangeRef.current(null);
            return;
          }
          const puntos = anilloDePolygon(capa);
          if (puntos.length < 3) return;
          const feature = featureDesdePuntos(puntos);
          setAreaM2(terrenoAreaM2(feature.geometry.coordinates));
          onChangeRef.current(feature);
        };

        map.on("pm:create", (e) => {
          const capa = comoPolygon(e.layer);
          if (capaRef.current) map.removeLayer(capaRef.current);
          capaRef.current = capa;
          map.pm.disableDraw();
          setDibujando(false);
          map.pm.Toolbar.setButtonDisabled("drawPolygon", true);
          emitirFeature(capa);
        });

        map.on("pm:drawstart", () => setDibujando(true));
        map.on("pm:drawend", () => {
          setDibujando(false);
          emitirFeature(capaRef.current);
        });

        map.on("pm:vertexadded", (e) => {
          const workingLayer = (e as unknown as { workingLayer: Leaflet.Polygon })
            .workingLayer;
          if (!workingLayer) return;
          const puntos = anilloDePolygon(workingLayer);
          if (puntos.length < 3) {
            setAreaM2(null);
            return;
          }
          setAreaM2(
            terrenoAreaM2(featureDesdePuntos(puntos).geometry.coordinates),
          );
        });

        map.on("pm:edit", (e) => {
          if (e.layer && comoPolygon(e.layer) === capaRef.current) {
            emitirFeature(capaRef.current);
          }
        });

        map.on("pm:remove", (e) => {
          if (e.layer && comoPolygon(e.layer) === capaRef.current) {
            capaRef.current = null;
            setAreaM2(null);
            onChangeRef.current(null);
            map.pm.Toolbar.setButtonDisabled("drawPolygon", false);
          }
        });

        if (featureInicial && puntosDesdeFeature(featureInicial).length >= 3) {
          const capa = L.polygon(puntosDesdeFeature(featureInicial));
          capa.addTo(map);
          capaRef.current = capa;
          setAreaM2(terrenoAreaM2(featureInicial.geometry.coordinates));
          onChangeRef.current(featureInicial);
          map.fitBounds(capa.getBounds(), { padding: [24, 24] });
          map.pm.Toolbar.setButtonDisabled("drawPolygon", true);
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
      capaRef.current = null;
      ubicacionMarkerRef.current = null;
      ubicacionCirculoRef.current = null;
    };
  }, [featureInicial]);

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
        aria-label="Mapa para delimitar tu terreno"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {areaM2 !== null
            ? `Superficie aproximada: ${formatAreaM2(areaM2)}`
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
        Vista Satélite muestra límites y nombres gracias a Esri Reference; usa el control de capas (arriba a la derecha) para alternar a Calles.
      </p>
    </div>
  );
}
