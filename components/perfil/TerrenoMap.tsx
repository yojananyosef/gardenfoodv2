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
import {
  latLngDesdePos,
  puntoEnPoligono,
} from "@/lib/huerto/plano";
import { svgArbolHtml } from "@/components/huerto/IconoArbol";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// blankTile=false: los tiles sin cobertura devuelven 404 en vez del tile
// gris "Map data not yet available", permitiendo el overzoom de Leaflet.
const ESRI_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?blankTile=false";
const ESRI_ATTR =
  "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics";
const ESRI_REF_URL =
  "https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}";
const ESRI_REF_ATTR = "© Esri — Reference Overlay";
const EOX_URL =
  "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/g/{z}/{y}/{x}.jpg";
const EOX_ATTR =
  'Sentinel-2 cloudless — <a href="https://cloudless.eox.at">EOX IT Services GmbH</a> (contains modified Copernicus Sentinel data 2025)';
const ZOOM_NATIVO_MIN = 17;

export type HuertoMapa = {
  id: string;
  nombre: string;
  feature: TerrenoFeature;
};

export type ArbolMapa = {
  id: string;
  especie: string;
  huertoId: string | null;
  posX: number | null;
  posY: number | null;
};

type TerrenoMapProps = {
  huertosIniciales: HuertoMapa[];
  arboles: ArbolMapa[];
  puedeDibujar: boolean;
  modoMarca: boolean;
  onCrear: (feature: TerrenoFeature) => Promise<string | null>;
  onEditar: (id: string, feature: TerrenoFeature) => void;
  onEliminar: (id: string) => Promise<boolean>;
  onLimite: () => void;
  onMarcarArbol: (
    huertoId: string,
    lat: number,
    lng: number,
  ) => Promise<string | null>;
  onEditarArbol: (id: string) => void;
  onFueraHuerto: () => void;
};

function comoPolygon(layer: Leaflet.Layer): Leaflet.Polygon {
  return layer as unknown as Leaflet.Polygon;
}

function anilloDePolygon(capa: Leaflet.Polygon): PuntoMapa[] {
  const latlngs = capa.getLatLngs() as Leaflet.LatLng[][];
  return (latlngs[0] ?? []).map((p) => ({ lat: p.lat, lng: p.lng }));
}

function anilloComoCoordenadas(anillo: PuntoMapa[]) {
  return [anillo.map((p) => [p.lng, p.lat] as [number, number])];
}

function tileDeCentro(
  lat: number,
  lng: number,
  nivel: number,
): { x: number; y: number } {
  const n = 2 ** nivel;
  const x = Math.min(n - 1, Math.max(0, Math.floor(((lng + 180) / 360) * n)));
  const latRad = (Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180;
  const y = Math.min(
    n - 1,
    Math.max(
      0,
      Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n),
    ),
  );
  return { x, y };
}

export function TerrenoMap({
  huertosIniciales,
  arboles,
  puedeDibujar,
  modoMarca,
  onCrear,
  onEditar,
  onEliminar,
  onLimite,
  onMarcarArbol,
  onEditarArbol,
  onFueraHuerto,
}: TerrenoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const capasRef = useRef<Map<Leaflet.Polygon, string>>(new Map());
  const marcadoresRef = useRef<Map<string, Leaflet.Marker>>(new Map());
  const sateliteRef = useRef<Leaflet.TileLayer | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const ubicacionMarkerRef = useRef<Leaflet.CircleMarker | null>(null);
  const ubicacionCirculoRef = useRef<Leaflet.Circle | null>(null);
  const inicialesRef = useRef(huertosIniciales);
  const puedeDibujarRef = useRef(puedeDibujar);
  const modoMarcaRef = useRef(modoMarca);
  const onCrearRef = useRef(onCrear);
  const onEditarRef = useRef(onEditar);
  const onEliminarRef = useRef(onEliminar);
  const onLimiteRef = useRef(onLimite);
  const onMarcarArbolRef = useRef(onMarcarArbol);
  const onEditarArbolRef = useRef(onEditarArbol);
  const onFueraHuertoRef = useRef(onFueraHuerto);
  const [mapaListo, setMapaListo] = useState(false);

  useEffect(() => {
    puedeDibujarRef.current = puedeDibujar;
    modoMarcaRef.current = modoMarca;
    onCrearRef.current = onCrear;
    onEditarRef.current = onEditar;
    onEliminarRef.current = onEliminar;
    onLimiteRef.current = onLimite;
    onMarcarArbolRef.current = onMarcarArbol;
    onEditarArbolRef.current = onEditarArbol;
    onFueraHuertoRef.current = onFueraHuerto;
  }, [puedeDibujar, modoMarca, onCrear, onEditar, onEliminar, onLimite, onMarcarArbol, onEditarArbol, onFueraHuerto]);

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
          // Conservador por defecto: en zonas rurales Esri suele terminar en
          // 17-18; el tilemap lo sube dinámicamente donde hay más detalle.
          maxNativeZoom: ZOOM_NATIVO_MIN,
          attribution: ESRI_ATTR,
        });
        sateliteRef.current = satelite;
        const calles = L.tileLayer(OSM_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          attribution: OSM_ATTR,
        });
        const sentinel = L.tileLayer(EOX_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          maxNativeZoom: 14,
          attribution: EOX_ATTR,
        });
        const limites = L.tileLayer(ESRI_REF_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          attribution: ESRI_REF_ATTR,
        });
        satelite.addTo(map);
        limites.addTo(map);
        L.control
          .layers(
            {
              "Satélite (Esri)": satelite,
              "Sentinel-2 (global, menos detalle)": sentinel,
              "Calles (OSM)": calles,
            },
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

        // Zoom nativo dinámico: consulta el tilemap de Esri para el tile
        // central y fija maxNativeZoom al nivel realmente disponible, para
        // que Leaflet reescale el último nivel existente en lugar de mostrar
        // tiles "Map data not yet available". Tope en 18: el nivel 19 de Esri
        // no es uniforme y un falso positivo deja tiles 404 (fondo blanco).
        const zoomNativoCache = new Map<string, number>();
        async function ajustarZoomNativo() {
          if (cancelled || mapRef.current !== map) return;
          const capa = sateliteRef.current;
          if (!capa) return;
          const zoom = Math.round(map.getZoom());
          if (zoom < ZOOM_NATIVO_MIN) return;
          const centro = map.getCenter();
          for (const nivel of [MAPA_MAX_ZOOM - 1, ZOOM_NATIVO_MIN]) {
            const { x, y } = tileDeCentro(centro.lat, centro.lng, nivel);
            const clave = `${x}_${y}_${nivel}`;
            let disponible = zoomNativoCache.get(clave);
            if (disponible === undefined) {
              try {
                const res = await fetch(
                  `https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tilemap/${nivel}/${y}/${x}?width=1&height=1&f=json`,
                );
                const json = (await res.json()) as { data?: number[] };
                disponible =
                  Array.isArray(json.data) && json.data.some((v) => v === 1)
                    ? nivel
                    : 0;
              } catch {
                disponible = 0;
              }
              zoomNativoCache.set(clave, disponible);
            }
            if (disponible >= nivel) {
              if (capa.options.maxNativeZoom !== nivel) {
                capa.options.maxNativeZoom = nivel;
                capa.redraw();
              }
              return;
            }
          }
        }

        map.on("moveend", () => {
          void ajustarZoomNativo();
        });

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

        // Marcar árboles: cada tap dentro de un polígono crea un árbol en
        // esa posición exacta.
        map.on("click", (e) => {
          if (!modoMarcaRef.current) return;
          const punto: PuntoMapa = { lat: e.latlng.lat, lng: e.latlng.lng };
          for (const [capa, huertoId] of capasRef.current) {
            const anillo = anilloDePolygon(capa);
            if (
              anillo.length >= 3 &&
              puntoEnPoligono(punto, anilloComoCoordenadas(anillo)[0])
            ) {
              void (async () => {
                await onMarcarArbolRef.current(huertoId, punto.lat, punto.lng);
              })();
              return;
            }
          }
          onFueraHuertoRef.current();
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
          void ajustarZoomNativo();
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

        if (!cancelled) setMapaListo(true);
      } catch {
        if (!cancelled) setError("No se pudo cargar el mapa. Revisa tu conexión.");
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      capasRef.current = new Map();
      marcadoresRef.current = new Map();
      sateliteRef.current = null;
      ubicacionMarkerRef.current = null;
      ubicacionCirculoRef.current = null;
      setMapaListo(false);
    };
    // El mapa se monta una sola vez; los huertos iniciales ya están cargados
    // cuando la sección lo renderiza (se oculta mientras carga).
  }, []);

  // Marcadores de árboles: sincroniza los puntos con posición guardada.
  useEffect(() => {
    const map = mapRef.current;
    const Ll = leafletRef.current;
    if (!mapaListo || !map || !Ll) return;

    const deseados = new Map<string, { arbol: ArbolMapa; latlng: [number, number] }>();
    for (const arbol of arboles) {
      if (arbol.posX === null || arbol.posY === null || !arbol.huertoId) continue;
      const capa = [...capasRef.current.entries()].find(
        ([, huertoId]) => huertoId === arbol.huertoId,
      )?.[0];
      if (!capa) continue;
      const latlng = latLngDesdePos(
        { x: arbol.posX, y: arbol.posY },
        anilloComoCoordenadas(anilloDePolygon(capa)),
      );
      deseados.set(arbol.id, { arbol, latlng: [latlng.lat, latlng.lng] });
    }

    for (const [id, marker] of marcadoresRef.current) {
      if (!deseados.has(id)) {
        map.removeLayer(marker);
        marcadoresRef.current.delete(id);
      }
    }

    for (const [id, { arbol, latlng }] of deseados) {
      if (marcadoresRef.current.has(id)) continue;
      const icono = Ll.divIcon({
        className: "",
        html: svgArbolHtml(arbol.especie),
        iconSize: [26, 32],
        iconAnchor: [13, 16],
      });
      const marker = Ll.marker(latlng, { icon: icono, keyboard: false })
        .addTo(map)
        .bindTooltip(arbol.especie)
        .on("click", () => onEditarArbolRef.current(id));
      marcadoresRef.current.set(id, marker);
    }
  }, [arboles, mapaListo]);

  // En modo marca se apagan las herramientas de geoman para no interferir
  // con los taps de conteo. Se consulta primero si están activas: apagar un
  // modo inactivo hace que geoman llame _off con listeners indefinidos
  // ("wrong listener type: undefined").
  useEffect(() => {
    const map = mapRef.current;
    if (!mapaListo || !map) return;
    for (const boton of ["drawPolygon", "editMode", "removalMode"]) {
      map.pm.Toolbar.setButtonDisabled(boton, modoMarca);
    }
    if (modoMarca) {
      const pm = map.pm as unknown as {
        globalEditModeEnabled?: () => boolean;
        globalRemovalModeEnabled?: () => boolean;
        disableGlobalEditMode?: () => void;
        disableGlobalRemovalMode?: () => void;
        disableDraw?: () => void;
        Draw?: { getActive?: () => boolean };
      };
      if (pm.globalEditModeEnabled?.()) pm.disableGlobalEditMode?.();
      if (pm.globalRemovalModeEnabled?.()) pm.disableGlobalRemovalMode?.();
      if (pm.Draw?.getActive?.()) pm.disableDraw?.();
    }
  }, [modoMarca, mapaListo]);

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
        className={`h-80 w-full overflow-hidden rounded-md border ${modoMarca ? "cursor-crosshair" : ""}`}
        aria-label="Mapa para delimitar tus huertos y marcar árboles"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {dibujando && areaPantalla !== null
            ? `Superficie aproximada: ${formatAreaM2(areaPantalla.total)}`
            : areaPantalla && areaPantalla.huertos > 0
              ? `${areaPantalla.huertos} ${areaPantalla.huertos === 1 ? "huerto" : "huertos"} · Superficie total: ${formatAreaM2(areaPantalla.total)}`
              : modoMarca
                ? "Activa el ícono de polígono para delimitar tu terreno primero."
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
        vértices o borra con las herramientas del mapa; con «Marcar árboles»
        activo, toca cada árbol que veas en el satélite para contarlo. Vista
        Satélite (Esri) ajusta el zoom a la imagen disponible; Sentinel-2 cubre
        todo el mundo.
      </p>
    </div>
  );
}
