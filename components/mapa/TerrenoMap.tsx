"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
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
import { medidasIconoArbol, svgArbolPorEspecie } from "@/components/huerto/IconoArbol";

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
  nombreArbol: (especie: string) => string;
  /** Huerto activo global: se dibuja destacado para no confundirlo con los demás. */
  huertoActivoId?: string | null;
  /** Click en un polígono selecciona ese huerto (sin salir del mapa). */
  onSeleccionarHuerto?: (id: string) => void;
  /** Alto del contenedor del mapa en px (default 520; usa menos dentro de modales). */
  alto?: number;
  ref?: Ref<TerrenoMapHandle>;
};

// Borde del polígono activo vs. inactivos: el activo se distingue de un vistazo.
const ESTILO_POLIGONO_ACTIVO = { color: "#22c55e", weight: 3, fillOpacity: 0.12 };
const ESTILO_POLIGONO_INACTIVO = { color: "#3388ff", weight: 2, fillOpacity: 0.2 };

export interface TerrenoMapHandle {
  /** Encuadra un huerto (o todos con null) sin remontar el mapa. */
  encuadrarHuerto: (id: string | null) => void;
}

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
  nombreArbol,
  huertoActivoId,
  onSeleccionarHuerto,
  alto = 520,
  ref,
}: TerrenoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const capasRef = useRef<Map<Leaflet.Polygon, string>>(new Map());
  const marcadoresRef = useRef<Map<string, Leaflet.Marker>>(new Map());
  const sateliteRef = useRef<Leaflet.TileLayer | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const ubicacionMarkerRef = useRef<Leaflet.CircleMarker | null>(null);
  const ubicacionCirculoRef = useRef<Leaflet.Circle | null>(null);
  const ubicacionBtnRef = useRef<HTMLButtonElement | null>(null);
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
  const nombreArbolRef = useRef(nombreArbol);
  const huertoActivoRef = useRef(huertoActivoId ?? null);
  const onSeleccionarHuertoRef = useRef(onSeleccionarHuerto);
  const [mapaListo, setMapaListo] = useState(false);
  const [cargandoSatelite, setCargandoSatelite] = useState(true);

  useEffect(() => {
    puedeDibujarRef.current = puedeDibujar;
    modoMarcaRef.current = modoMarca;
    huertoActivoRef.current = huertoActivoId ?? null;
    onSeleccionarHuertoRef.current = onSeleccionarHuerto;
    onCrearRef.current = onCrear;
    onEditarRef.current = onEditar;
    onEliminarRef.current = onEliminar;
    onLimiteRef.current = onLimite;
    onMarcarArbolRef.current = onMarcarArbol;
    onEditarArbolRef.current = onEditarArbol;
    onFueraHuertoRef.current = onFueraHuerto;
    nombreArbolRef.current = nombreArbol;
  }, [puedeDibujar, modoMarca, huertoActivoId, onSeleccionarHuerto, onCrear, onEditar, onEliminar, onLimite, onMarcarArbol, onEditarArbol, onFueraHuerto, nombreArbol]);

  const [areaPantalla, setAreaPantalla] = useState<{
    total: number;
    huertos: number;
  } | null>(null);
  const [dibujando, setDibujando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localizando, setLocalizando] = useState(false);
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);
  const [precisionM, setPrecisionM] = useState<number | null>(null);
  // Cada pulsación de «Mi ubicación» invalida la anterior (evita setState
  // tardíos y puntos de una petición vieja).
  const pedidoUbicacionRef = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      encuadrarHuerto: (id: string | null) => {
        const map = mapRef.current;
        if (!map || capasRef.current.size === 0) return;
        if (id === null) {
          const grupo = (leafletRef.current as unknown as {
            featureGroup: (capas: Leaflet.Polygon[]) => Leaflet.FeatureGroup;
          } | null)?.featureGroup([...capasRef.current.keys()]);
          if (grupo) map.fitBounds(grupo.getBounds(), { padding: [24, 24] });
          return;
        }
        const capa = [...capasRef.current.entries()].find(
          ([, huertoId]) => huertoId === id,
        )?.[0];
        if (capa) map.fitBounds(capa.getBounds(), { padding: [24, 24] });
      },
    }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        // Geoman se importa ANTES de crear el mapa: el plugin registra
        // `map.pm` al cargarse; diferirlo dejaba `map.pm` indefinido y
        // rompía con `map.pm.setLang` (TypeError).
        await import("@geoman-io/leaflet-geoman-free");
        if (cancelled || !containerRef.current) return;

        leafletRef.current = L as unknown as typeof Leaflet;

        const map = L.map(containerRef.current, {
          maxZoom: MAPA_MAX_ZOOM,
          // Sin zoomControl por defecto: se agrega abajo con títulos en
          // español (Acercar/Alejar en vez de Zoom in/out).
          zoomControl: false,
        });
        mapRef.current = map;
        L.control
          .zoom({ zoomInTitle: "Acercar", zoomOutTitle: "Alejar" })
          .addTo(map);

        // «Mi ubicación» integrado al mapa (abajo-derecha, estilo Google
        // Maps) en vez de un botón React desacoplado bajo el mapa. Es DOM
        // puro de Leaflet: llama a la misma localización en dos fases.
        class ControlUbicacion extends L.Control {
          override onAdd(): HTMLElement {
            const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            const btn = L.DomUtil.create("button", "", container) as HTMLButtonElement;
            btn.type = "button";
            btn.title = "Centrar en mi ubicación";
            btn.setAttribute("aria-label", "Centrar en mi ubicación");
            btn.style.cssText =
              "display:flex;align-items:center;justify-content:center;width:34px;height:34px;cursor:pointer;background:#fff;border:none;border-radius:4px;color:#333;";
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>`;
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            L.DomEvent.on(btn, "click", (ev) => {
              L.DomEvent.stopPropagation(ev);
              void centrarEnMiUbicacion();
            });
            ubicacionBtnRef.current = btn;
            return container;
          }
        }
        new ControlUbicacion({ position: "bottomright" }).addTo(map);

        const satelite = L.tileLayer(ESRI_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          // Conservador por defecto: en zonas rurales Esri suele terminar en
          // 17-18; el tilemap lo sube dinámicamente donde hay más detalle.
          maxNativeZoom: ZOOM_NATIVO_MIN,
          attribution: ESRI_ATTR,
          keepBuffer: 4,
          updateWhenIdle: true,
        });
        sateliteRef.current = satelite;
        const calles = L.tileLayer(OSM_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          attribution: OSM_ATTR,
          keepBuffer: 4,
          updateWhenIdle: true,
        });
        const sentinel = L.tileLayer(EOX_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          maxNativeZoom: 14,
          attribution: EOX_ATTR,
          keepBuffer: 4,
          updateWhenIdle: true,
        });
        const limites = L.tileLayer(ESRI_REF_URL, {
          maxZoom: MAPA_MAX_ZOOM,
          attribution: ESRI_REF_ATTR,
          keepBuffer: 4,
          updateWhenIdle: true,
        });
        satelite.addTo(map);
        limites.addTo(map);
        // Controles en español: Geoman trae traducción "es" (Dibujar
        // Polígono, Editar/Eliminar Capas, Finalizar/Cancelar…).
        map.pm.setLang("es");
        // Sin snap: el "auto-enganche" a esquinas de huertos cercanos hacía
        // saltar el cursor al dibujar parcelas chicas. Se desactiva el imán
        // global y se exige polígono simple para dibujos precisos.
        try {
          (
            map.pm as unknown as {
              setGlobalOptions?: (o: Record<string, unknown>) => void;
            }
          ).setGlobalOptions?.({
            snappable: false,
            snapDistance: 0,
            allowSelfIntersection: false,
            finishOn: "dblclick",
            markerEditable: true,
          });
        } catch {
          // Versiones de Geoman sin setGlobalOptions: se sigue sin snap por defecto en draw.
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
        // Distintivo de carga: se oculta con los primeros tiles o por
        // seguridad a los 15 s (red lenta con tiles 404 persistentes).
        satelite.once("load", () => {
          if (!cancelled) setCargandoSatelite(false);
        });
        window.setTimeout(() => {
          if (!cancelled) setCargandoSatelite(false);
        }, 15_000);
        const controlCapas = L.control
          .layers(
            {
              "Satélite (Esri)": satelite,
              "Sentinel-2 (global, menos detalle)": sentinel,
              "Calles (OSM)": calles,
            },
            { "Límites y lugares": limites },
          )
          .addTo(map);
        // El toggle de capas trae title="Layers" de fábrica: en español.
        controlCapas
          .getContainer()
          ?.querySelector(".leaflet-control-layers-toggle")
          ?.setAttribute("title", "Capas");
        controlCapas
          .getContainer()
          ?.querySelector(".leaflet-control-layers-toggle")
          ?.setAttribute("aria-label", "Capas del mapa");

        // Sin vista por defecto aquí: se fija UNA sola vez más abajo (huertos
        // → fitBounds, si no → vista país). Fijar dos vistas en el mismo tick
        // aborta la carga de tiles y deja el satélite en gris (#3002).

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
            .bindTooltip(
              accuracy !== null && Number.isFinite(accuracy)
                ? `Tu ubicación (±${Math.round(accuracy)} m)`
                : "Tu ubicación",
            )
            .openTooltip();
        }

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
        // tiles "Map data not yet available". Se prueba hasta 19 (MAPA_MAX_ZOOM
        // 20 = overzoom para parcelas chicas como Rapel); un falso positivo
        // solo deja un nivel reescalado, no fondo blanco (blankTile=false).
        // Persiste en sessionStorage: al volver a la página no se re-consulta.
        const zoomNativoCache = new Map<string, number>();
        try {
          const raw = sessionStorage.getItem("gf-esri-zoom");
          if (raw) {
            for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, number>)) {
              zoomNativoCache.set(k, v);
            }
          }
        } catch {
          // sessionStorage no disponible: caché solo en memoria.
        }
        function guardarZoomCache() {
          try {
            const obj: Record<string, number> = {};
            for (const [k, v] of zoomNativoCache) obj[k] = v;
            sessionStorage.setItem("gf-esri-zoom", JSON.stringify(obj));
          } catch {
            // Sin persistencia: no bloquea el mapa.
          }
        }
        let ajustandoZoom = false;
        async function ajustarZoomNativo() {
          if (cancelled || mapRef.current !== map || ajustandoZoom) return;
          const capa = sateliteRef.current;
          if (!capa) return;
          const zoom = Math.round(map.getZoom());
          if (zoom < ZOOM_NATIVO_MIN) return;
          ajustandoZoom = true;
          try {
            const centro = map.getCenter();
            for (const nivel of [MAPA_MAX_ZOOM - 1, MAPA_MAX_ZOOM - 2, ZOOM_NATIVO_MIN]) {
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
                guardarZoomCache();
              }
              if (disponible >= nivel) {
                if (capa.options.maxNativeZoom !== nivel) {
                  capa.options.maxNativeZoom = nivel;
                  capa.redraw();
                }
                return;
              }
            }
          } finally {
            ajustandoZoom = false;
          }
        }

        // Debounce 400ms: evita una consulta tilemap por cada micro-movimiento.
        let moveendTimer: ReturnType<typeof setTimeout> | null = null;
        map.on("moveend", () => {
          if (moveendTimer) clearTimeout(moveendTimer);
          moveendTimer = setTimeout(() => {
            void ajustarZoomNativo();
          }, 400);
        });
        // El ajuste nativo corre tras la primera carga, no en el mismo tick
        // de la vista inicial (evita redraw encima de tiles en vuelo).
        map.once("load", () => {
          void ajustarZoomNativo();
        });

        map.on("pm:drawstart", () => {
          if (!puedeDibujarRef.current) {
            // Geoman puede aún estar cargando (import diferido): guard.
            (map.pm as unknown as { disableDraw?: () => void } | undefined)?.disableDraw?.();
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
              capa.setStyle(
                id === huertoActivoRef.current
                  ? ESTILO_POLIGONO_ACTIVO
                  : ESTILO_POLIGONO_INACTIVO,
              );
              capa.on("click", () => onSeleccionarHuertoRef.current?.(id));
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

        // Agregar árboles: cada tap dentro de un polígono crea un árbol en
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
              // Marcador optimista: el árbol aparece al instante mientras el
              // server action guarda (ese roundtrip es el "par de segundos").
              // El marcador real llega por props; el temporal se retira igual.
              let temporal: Leaflet.CircleMarker | null = null;
              try {
                temporal = L.circleMarker([punto.lat, punto.lng], {
                  radius: 7,
                  color: "#ffffff",
                  weight: 2,
                  fillColor: "#22c55e",
                  fillOpacity: 0.9,
                }).addTo(map);
              } catch {
                temporal = null;
              }
              void (async () => {
                try {
                  await onMarcarArbolRef.current(huertoId, punto.lat, punto.lng);
                } finally {
                  if (temporal) map.removeLayer(temporal);
                }
              })();
              return;
            }
          }
          onFueraHuertoRef.current();
        });

        for (const huerto of inicialesRef.current) {
          const puntos = puntosDesdeFeature(huerto.feature);
          if (puntos.length < 3) continue;
          const esActivo = huerto.id === huertoActivoRef.current;
          const capa = L.polygon(puntos, esActivo ? ESTILO_POLIGONO_ACTIVO : ESTILO_POLIGONO_INACTIVO).addTo(map);
          capa.bindTooltip(huerto.nombre);
          capasRef.current.set(capa, huerto.id);
          const huertoIdCapturado = huerto.id;
          capa.on("click", () => onSeleccionarHuertoRef.current?.(huertoIdCapturado));
        }

        // Vista inicial ÚNICA: si hay huerto activo recordado se encuadra ese
        // (retoma donde estaba trabajando); si no, todos los bounds; sin
        // huertos, vista país (la geolocalización la refina async).
        if (capasRef.current.size > 0) {
          const activo = huertoActivoRef.current
            ? [...capasRef.current.entries()].find(([, id]) => id === huertoActivoRef.current)?.[0]
            : undefined;
          if (activo) {
            map.fitBounds(activo.getBounds(), { padding: [24, 24] });
          } else {
            const grupo = L.featureGroup([...capasRef.current.keys()]);
            map.fitBounds(grupo.getBounds(), { padding: [24, 24] });
          }
          actualizarAreaPantalla();
        } else {
          map.setView([CENTRO_DEFAULT.lat, CENTRO_DEFAULT.lng], ZOOM_DEFAULT);
          // Best-effort silencioso: fix rápido de baja precisión solo como
          // fondo inicial (caché permitida, sin GPS frío). La ubicación
          // precisa la pide el botón «Mi ubicación» en dos fases.
          if ("geolocation" in navigator) {
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
              { enableHighAccuracy: false, timeout: 8_000, maximumAge: 300_000 },
            );
          }
        }

        // Revalida el tamaño tras el primer pintado: si el layout aún no
        // asentó el contenedor, Leaflet calcula mal los tiles (gris parcial).
        requestAnimationFrame(() => {
          if (!cancelled && mapRef.current === map) map.invalidateSize();
        });

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
      ubicacionBtnRef.current = null;
      setMapaListo(false);
    };
    // El mapa se monta una sola vez; los huertos iniciales ya están cargados
    // cuando la sección lo renderiza (se oculta mientras carga).
    // centrarEnMiUbicacion solo usa refs + setState: el closure del primer
    // render sigue válido para el botón del control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Con keepMounted el tab puede ocultarse (display:none) y volver: el
  // contenedor pasa por tamaño 0 y Leaflet debe revalidar al reaparecer.
  useEffect(() => {
    if (!mapaListo) return;
    const el = containerRef.current;
    const map = mapRef.current;
    if (!el || !map) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (mapRef.current === map && el.clientWidth > 0 && el.clientHeight > 0) {
          map.invalidateSize();
        }
      }, 150);
    });
    ro.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      ro.disconnect();
    };
  }, [mapaListo]);

  // Estado del botón de ubicación dentro del mapa (DOM de Leaflet, fuera
  // de React): se atenúa y cambia su etiqueta mientras localiza.
  useEffect(() => {
    const btn = ubicacionBtnRef.current;
    if (!mapaListo || !btn) return;
    btn.disabled = localizando;
    btn.classList.toggle("leaflet-disabled", localizando);
    btn.style.opacity = localizando ? "0.5" : "";
    btn.style.cursor = localizando ? "wait" : "pointer";
    const etiqueta = localizando ? "Ubicando…" : "Centrar en mi ubicación";
    btn.setAttribute("aria-label", etiqueta);
    btn.title = etiqueta;
  }, [localizando, mapaListo]);

  // Resalta el polígono del huerto activo sin remontar el mapa.
  useEffect(() => {
    if (!mapaListo) return;
    for (const [capa, id] of capasRef.current) {
      capa.setStyle(
        id === (huertoActivoId ?? null)
          ? ESTILO_POLIGONO_ACTIVO
          : ESTILO_POLIGONO_INACTIVO,
      );
    }
  }, [huertoActivoId, mapaListo]);

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
      const nombre = nombreArbolRef.current(arbol.especie);
      const med = medidasIconoArbol(arbol.especie);
      const existente = marcadoresRef.current.get(id);
      if (existente) {
        // La especie o la posición pueden haber cambiado: se actualiza el
        // icono en vez de conservar el anterior.
        existente.setLatLng(latlng);
        existente.setIcon(
          Ll.divIcon({
            className: "",
            html: svgArbolPorEspecie(arbol.especie),
            iconSize: [med.ancho, med.alto],
            iconAnchor: [med.anchorX, med.anchorY],
          }),
        );
        existente.setTooltipContent(nombre);
        continue;
      }
      const icono = Ll.divIcon({
        className: "",
        html: svgArbolPorEspecie(arbol.especie),
        iconSize: [med.ancho, med.alto],
        iconAnchor: [med.anchorX, med.anchorY],
      });
      const marker = Ll.marker(latlng, { icon: icono, keyboard: false })
        .addTo(map)
        .bindTooltip(nombre)
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
    // Crosshair por estilo inline (no por className): React reescribe el
    // atributo class completo cuando cambia y borraría las clases que
    // Leaflet agrega al contenedor (leaflet-container, leaflet-grab…).
    // Sin .leaflet-container, la guarda `.leaflet-container .leaflet-tile
    // { max-width: none }` deja de aplicar, Tailwind (max-width: 100%)
    // colapsa los tiles a 0 px y el satélite queda en blanco fijo.
    // El inline además pisa el cursor grab de Leaflet sin pelear
    // especificidad con sus hojas.
    if (containerRef.current) {
      containerRef.current.style.cursor = modoMarca ? "crosshair" : "";
    }
    // Geoman carga diferido: si aún no llegó, no hay botones que deshabilitar.
    const pmToolbar = (map.pm as unknown as { Toolbar?: { setButtonDisabled?: (b: string, d: boolean) => void } } | undefined)?.Toolbar;
    if (!pmToolbar?.setButtonDisabled) return;
    for (const boton of ["drawPolygon", "editMode", "removalMode"]) {
      pmToolbar.setButtonDisabled(boton, modoMarca);
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

  /** Más de esto se considera señal débil: se avisa en vez de callar. */
  const UMBRAL_PRECISION_M = 100;

  /** Detección simple sin dependencias: Safari/iOS no trae Permissions API
   *  fiable y no tiene "candado" (usa botón aA / Ajustes del sistema). */
  function esIOS(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } })
      ?.userAgentData?.platform
      ?? (navigator as Navigator & { platform?: string })?.platform
      ?? "";
    return (
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Mac") && "ontouchend" in document) ||
      /iPad|iPhone|iPod/.test(platform)
    );
  }
  function esSafari(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  }
  /** Guía paso a paso según navegador (lenguaje simple).
   *  Chrome/Android habla de "candado"; Safari iOS/Mac usa botón aA y
   *  Ajustes → Privacidad → Localización, donde el bloqueo suele ser a
   *  nivel de sistema y el navegador ni siquiera pregunta. */
  function guiaUbicacionBloqueada(): string {
    if (esIOS()) {
      return "La ubicación está bloqueada. Actívala así en iPhone/iPad: 1) abre Ajustes → Privacidad y seguridad → Localización y actívala, 2) en la lista busca Safari (o tu navegador) y elige «Al usar la app», 3) vuelve aquí, toca el botón aA junto a la dirección, abre «Configuración del sitio web» y permite Ubicación, 4) pulsa de nuevo el botón de ubicación del mapa. Si igual no pregunta, escribe tu comuna en el perfil: el huerto funciona igual sin GPS.";
    }
    if (esSafari()) {
      return "La ubicación está bloqueada en Safari. Actívala así: 1) toca el botón aA junto a la dirección → «Configuración del sitio web» → Ubicación → Permitir, 2) en Mac revisa además Ajustes del Sistema → Privacidad y seguridad → Localización, 3) recarga y pulsa de nuevo el botón de ubicación del mapa.";
    }
    return "La ubicación está bloqueada en tu navegador. Actívala así: 1) toca el candado junto a la dirección de esta página, 2) toca Ubicación y elige Permitir, 3) pulsa de nuevo el botón de ubicación del mapa.";
  }

  const [infoUbicacion, setInfoUbicacion] = useState<string | null>(null);

  type EstadoPermisoGeo = "granted" | "prompt" | "denied" | "desconocido";

  /** Pre-chequeo del permiso ANTES de pedir la posición: si ya está
   *  bloqueado no se lanza una petición condenada al fallo y se muestra
   *  la guía al instante. Con fallback al flujo actual si el navegador
   *  no soporta la Permissions API. */
  async function estadoPermisoUbicacion(): Promise<EstadoPermisoGeo> {
    try {
      const permisos = navigator.permissions as Permissions | undefined;
      if (!permisos?.query) return "desconocido";
      const estado = await permisos.query({ name: "geolocation" as PermissionName });
      if (estado.state === "granted" || estado.state === "prompt" || estado.state === "denied") {
        return estado.state;
      }
      return "desconocido";
    } catch {
      return "desconocido";
    }
  }

  function leerPosicion(opciones: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("sin-soporte"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, opciones);
    });
  }

  function mensajeErrorUbicacion(err: unknown): string {
    if (err instanceof Error && err.message === "sin-soporte") {
      return "Tu navegador no soporta geolocalización.";
    }
    const code = (err as GeolocationPositionError | undefined)?.code;
    if (code === 1) {
      return guiaUbicacionBloqueada();
    }
    if (code === 2) return "Ubicación no disponible en este dispositivo.";
    if (code === 3) {
      return "Tiempo agotado buscando señal GPS. Acércate a una ventana o sal al exterior y vuelve a intentar.";
    }
    return "No se pudo obtener tu ubicación. Revisa los permisos.";
  }

  function dibujarUbicacion(lat: number, lng: number, accuracy: number | null) {
    const currentMap = mapRef.current;
    const Ll = leafletRef.current as unknown as {
      circle: typeof import("leaflet").circle;
      circleMarker: typeof import("leaflet").circleMarker;
    } | null;
    if (!currentMap || !Ll) return;
    currentMap.setView(
      [lat, lng],
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
    if (accuracy !== null && Number.isFinite(accuracy)) {
      ubicacionCirculoRef.current = Ll.circle([lat, lng], {
        radius: Math.min(accuracy, 5000),
        color: "#2563eb",
        weight: 1,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
      }).addTo(currentMap);
    }
    const etiqueta =
      accuracy !== null && Number.isFinite(accuracy)
        ? `Tu ubicación (±${Math.round(accuracy)} m)`
        : "Tu ubicación";
    ubicacionMarkerRef.current = Ll.circleMarker([lat, lng], {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: "#2563eb",
      fillOpacity: 0.95,
    })
      .addTo(currentMap)
      .bindTooltip(etiqueta)
      .openTooltip();
  }

  /**
   * «Mi ubicación» en dos fases (web, iOS y Android): primero un fix rápido
   * de baja precisión para responder al toque (en iOS el GPS frío con alta
   * precisión suele exceder 10 s), luego un refinamiento GPS que solo
   * reemplaza el punto si es mejor. Nunca se dibuja un fix grueso como
   * si fuera preciso: se muestra su ±m y se avisa de señal débil.
   */
  async function centrarEnMiUbicacion() {
    if (!mapRef.current || !leafletRef.current) return;
    const pedido = pedidoUbicacionRef.current + 1;
    pedidoUbicacionRef.current = pedido;
    const vigente = () => pedidoUbicacionRef.current === pedido && mapRef.current;
    setLocalizando(true);
    setUbicacionError(null);
    setInfoUbicacion(null);
    let mejor: { lat: number; lng: number; accuracy: number | null } | null = null;
    try {
      // Pre-chequeo: si el permiso ya está bloqueado se muestra la guía
      // paso a paso al instante, sin pedir una posición que va a fallar.
      const permiso = await estadoPermisoUbicacion();
      if (!vigente()) return;
      if (permiso === "denied") {
        setPrecisionM(null);
        setUbicacionError(guiaUbicacionBloqueada());
        return;
      }
      if (permiso === "prompt") {
        // Primera vez (o permiso revertido a pregunta): se avisa qué hacer
        // cuando el navegador pregunte, para no perder ese único intento.
        setInfoUbicacion("Tu navegador te va a preguntar: pulsa «Permitir» para centrar el mapa en tu posición.");
      }
      // Fase 1: respuesta inmediata (caché/WiFi/red). En iOS evita el largo
      // arranque del GPS antes de mostrar algo.
      try {
        const rapido = await leerPosicion({
          enableHighAccuracy: false,
          timeout: 8_000,
          maximumAge: 30_000,
        });
        if (!vigente()) return;
        mejor = {
          lat: rapido.coords.latitude,
          lng: rapido.coords.longitude,
          accuracy: rapido.coords.accuracy ?? null,
        };
        dibujarUbicacion(mejor.lat, mejor.lng, mejor.accuracy);
        if (mejor.accuracy !== null) setPrecisionM(mejor.accuracy);
      } catch {
        // Sin fix rápido: se intenta igual el refinamiento GPS abajo.
      }
      // Fase 2: refinamiento GPS fresco (timeout largo: el GPS frío de iOS
      // y Android lo necesita). Solo reemplaza si mejora la precisión.
      try {
        const fino = await leerPosicion({
          enableHighAccuracy: true,
          timeout: 25_000,
          maximumAge: 0,
        });
        if (!vigente()) return;
        const accuracyFino = fino.coords.accuracy ?? null;
        const mejorPrevia = mejor?.accuracy;
        const esMejor =
          accuracyFino !== null &&
          (mejorPrevia === null ||
            mejorPrevia === undefined ||
            !Number.isFinite(mejorPrevia) ||
            accuracyFino < mejorPrevia);
        if (esMejor || !mejor) {
          mejor = {
            lat: fino.coords.latitude,
            lng: fino.coords.longitude,
            accuracy: accuracyFino,
          };
          dibujarUbicacion(mejor.lat, mejor.lng, mejor.accuracy);
          if (accuracyFino !== null) setPrecisionM(accuracyFino);
        }
      } catch (err) {
        // Sin refinamiento: se conserva el fix rápido si lo hubo.
        if (!mejor) throw err;
      }
      if (!mejor) return;
      // Hubo fix (rápido o fino): el aviso previo ya cumplió su misión.
      setInfoUbicacion(null);
      if (
        mejor.accuracy !== null &&
        Number.isFinite(mejor.accuracy) &&
        mejor.accuracy > UMBRAL_PRECISION_M
      ) {
        setUbicacionError(
          `Señal débil (±${Math.round(mejor.accuracy)} m): el punto es aproximado. Sal al exterior o acércate a una ventana y pulsa de nuevo el botón de ubicación del mapa.`,
        );
      }
    } catch (err) {
      if (!vigente()) return;
      setPrecisionM(null);
      setInfoUbicacion(null);
      setUbicacionError(mensajeErrorUbicacion(err));
    } finally {
      if (vigente()) setLocalizando(false);
    }
  }

  function cancelarDibujo() {
    const map = mapRef.current;
    if (!map) return;
    (map.pm as unknown as { disableDraw?: () => void } | undefined)?.disableDraw?.();
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
      <div className="relative">
        <div
          ref={containerRef}
          style={{ height: alto }}
          // isolate: contiene los z-index internos de Leaflet (panes hasta
          // 1000) dentro del mapa para que no tapen los modales (z-50).
          // className INTENCIONALMENTE estático: si React lo reescribe,
          // borra las clases de Leaflet (leaflet-container…) y el fondo
          // satelital colapsa a blanco (ver efecto modoMarca).
          className="isolate w-full overflow-hidden rounded-md border"
          aria-label="Mapa para delimitar tus huertos y agregar árboles"
        />
        {cargandoSatelite && (
          <p className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">
            Cargando satélite…
          </p>
        )}
        {/* Precisión y errores de ubicación como chips superpuestos al mapa
            (el botón vive dentro del mapa, abajo-derecha). */}
        {precisionM !== null && Number.isFinite(precisionM) && !localizando ? (
          <p className="pointer-events-none absolute left-2 bottom-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">
            ±{Math.round(precisionM)} m
          </p>
        ) : null}
        {ubicacionError ? (
          <p
            role="alert"
            className="absolute left-2 right-14 bottom-2 rounded-lg bg-amber-50/95 px-2.5 py-1.5 text-[11px] leading-snug text-amber-800 shadow"
          >
            {ubicacionError}
          </p>
        ) : infoUbicacion ? (
          <p className="absolute left-2 right-14 bottom-2 rounded-lg bg-sky-50/95 px-2.5 py-1.5 text-[11px] leading-snug text-sky-900 shadow">
            {infoUbicacion}
          </p>
        ) : null}
      </div>
      {/* Barra contextual solo mientras se dibuja: superficie en vivo +
          cancelar. El resumen agregado («N huertos · Superficie total») se
          eliminó: el nombre vive en la card y el conteo en los chips. */}
      {dibujando && areaPantalla !== null ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Superficie aproximada: {formatAreaM2(areaPantalla.total)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9"
            onClick={cancelarDibujo}
          >
            Cancelar dibujo
          </Button>
        </div>
      ) : huertosIniciales.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Activa el ícono de polígono y toca las esquinas de tu terreno.
        </p>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        Dibuja cada huerto con el ícono de polígono; puedes tener varios. Edita
        vértices o borra con las herramientas del mapa; con «Agregar árboles»
        activo, toca cada árbol que veas en el satélite para contarlo. Vista
        Satélite (Esri) ajusta el zoom a la imagen disponible; Sentinel-2 cubre
        todo el mundo.
      </p>
    </div>
  );
}
