"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  bboxDe,
  colorDeEspecie,
  poligonoAMetros,
} from "@/lib/huerto/plano";
import {
  mosaicoDeTiles,
  SAT_ZOOM,
  tilesParaBbox,
  urlTileEsri,
  uvDeLngLat,
} from "@/lib/huerto/satelite";
import type { TerrenoPolygonCoordinates } from "@/lib/huerto/terreno";

export type Arbol3D = { id: string; especie: string; posX: number; posY: number };

const ALTURA_POLIGONO = 0.35;
const EXPANSION_PLATO = 1.1;

// `colorDeEspecie` devuelve `hsl(H S% L%)` (sintaxis moderna sin comas) que
// el parser de THREE.Color no entiende → la copa quedaba blanca. Se convierte
// a HSL numérico.
function colorEspecieThree(especie: string): THREE.Color {
  const css = colorDeEspecie(especie);
  const m = css.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
  if (!m) return new THREE.Color("#2f7a2f");
  return new THREE.Color().setHSL(
    Number(m[1]) / 360,
    Number(m[2]) / 100,
    Number(m[3]) / 100,
    THREE.SRGBColorSpace,
  );
}

function hashId(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

function puntoEnPoligonoXY(
  x: number,
  y: number,
  poli: { x: number; y: number }[],
): boolean {
  let dentro = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const xi = poli[i].x;
    const yi = poli[i].y;
    const xj = poli[j].x;
    const yj = poli[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
}

function texturaTierraProcedural(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "#5e6f36");
  grad.addColorStop(1, "#42501f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  // Ruido en dos escalas
  for (const [n, alpha, size] of [[2600, 0.16, 1.6], [500, 0.12, 3.2]] as const) {
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(20,30,10,${alpha})` : `rgba(190,200,130,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * size + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`tile ${url}`));
    img.src = url;
  });
}

export function PlanoHuerto3D({
  coordinates,
  arboles,
  onEditar,
}: {
  coordinates: TerrenoPolygonCoordinates;
  arboles: Arbol3D[];
  onEditar: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"cargando" | "satelite" | "procedural" | "sin-webgl">(
    "cargando",
  );
  const onEditarRef = useRef(onEditar);
  useEffect(() => {
    onEditarRef.current = onEditar;
  }, [onEditar]);

  useEffect(() => {
    const cont = ref.current;
    if (!cont) return;
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setEstado("sin-webgl"));
      return;
    }
    const bbox = bboxDe(coordinates);
    const metrico = poligonoAMetros(coordinates);
    if (!bbox || !metrico) {
      queueMicrotask(() => setEstado("sin-webgl"));
      return;
    }
    const { anchoM, altoM } = metrico;
    const k = Math.max(anchoM, altoM, 1e-9) / 10; // lado mayor = 10 unidades
    const aEscena = (nx: number, ny: number) => ({
      sx: (nx * anchoM) / k,
      sy: (ny * altoM) / k,
    });
    const dLng = Math.max(bbox.maxX - bbox.minX, 1e-9);
    const dLat = Math.max(bbox.maxY - bbox.minY, 1e-9);
    const centroLng = (bbox.minX + bbox.maxX) / 2;
    const centroLat = (bbox.minY + bbox.maxY) / 2;
    const escenaALngLat = (sx: number, sy: number) => ({
      // Inversa de poligonoAMetros + escala escena (lineal, equirectangular)
      lng: centroLng + ((sx * k) / anchoM) * dLng,
      lat: centroLat - ((sy * k) / altoM) * dLat,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    cont.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(6, -7.5, 6.5);
    camera.up.set(0, 0, 1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0.4);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.5;
    controls.maxDistance = 30;
    // Elevación 28°-88° ↔ polar 2°-62°
    controls.minPolarAngle = 0.12;
    controls.maxPolarAngle = 1.13;
    controls.update();
    const vistaInicial = camera.position.clone();
    const objetivoInicial = controls.target.clone();

    scene.add(new THREE.HemisphereLight(0xdff2ff, 0x2d3a1a, 1.0));
    const sol = new THREE.DirectionalLight(0xfff6e0, 1.8);
    sol.position.set(7, -5, 11);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    sol.shadow.camera.left = -9;
    sol.shadow.camera.right = 9;
    sol.shadow.camera.top = 9;
    sol.shadow.camera.bottom = -9;
    scene.add(sol);
    const relleno = new THREE.DirectionalLight(0xcfe8ff, 0.4);
    relleno.position.set(-6, 5, 6);
    scene.add(relleno);

    // --- Plato base: bbox expandido, MISMA proyección que el polígono ---
    const platoW = (anchoM / k) * EXPANSION_PLATO;
    const platoH = (altoM / k) * EXPANSION_PLATO;
    const texTierra = texturaTierraProcedural();
    texTierra.repeat.set(2, 2);
    const plato = new THREE.Mesh(
      new THREE.BoxGeometry(platoW, platoH, 0.6),
      new THREE.MeshStandardMaterial({ map: texTierra, roughness: 1 }),
    );
    plato.position.z = -0.31;
    plato.receiveShadow = true;
    scene.add(plato);

    // --- Polígono extruido sobre el plato ---
    const anilloExt = metrico.anillos[0] ?? [];
    const shape = new THREE.Shape();
    anilloExt.forEach((p, i) => {
      const { sx, sy } = aEscena(p.x, p.y);
      if (i === 0) shape.moveTo(sx, sy);
      else shape.lineTo(sx, sy);
    });
    shape.closePath();
    const geoPoli = new THREE.ExtrudeGeometry(shape, {
      depth: ALTURA_POLIGONO,
      bevelEnabled: false,
    });
    // Tapas (0) con satélite / pasto, laterales (1) de tierra oscura para que
    // el polígono "asiente" sobre el plato en vez de flotar con caras negras.
    const matPoli = new THREE.MeshStandardMaterial({
      color: "#4d7c3a",
      roughness: 0.95,
    });
    const matLateral = new THREE.MeshStandardMaterial({
      color: "#3a4520",
      roughness: 1,
    });
    const mallaPoli = new THREE.Mesh(geoPoli, [matPoli, matLateral]);
    mallaPoli.castShadow = true;
    mallaPoli.receiveShadow = true;
    scene.add(mallaPoli);

    // Borde luminoso del polígono (misma geometría, sin relleno)
    const bordePts = anilloExt.map((p) => {
      const { sx, sy } = aEscena(p.x, p.y);
      return new THREE.Vector3(sx, sy, ALTURA_POLIGONO + 0.02);
    });
    if (bordePts.length > 1) {
      bordePts.push(bordePts[0].clone());
      const borde = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(bordePts),
        new THREE.LineBasicMaterial({ color: 0xd9f99d }),
      );
      scene.add(borde);
    }

    // --- Textura satélite Esri sobre la cara superior (con fallback) ---
    let cancelado = false;
    (async () => {
      try {
        const { tiles, cols, rows } = tilesParaBbox(bbox, SAT_ZOOM);
        const mosaico = mosaicoDeTiles(tiles);
        const canvas = document.createElement("canvas");
        canvas.width = cols * 256;
        canvas.height = rows * 256;
        const ctx = canvas.getContext("2d")!;
        const minX = Math.min(...tiles.map((t) => t.x));
        const minY = Math.min(...tiles.map((t) => t.y));
        await Promise.all(
          tiles.map(async (t) => {
            const img = await cargarImagen(urlTileEsri(t));
            ctx.drawImage(img, (t.x - minX) * 256, (t.y - minY) * 256, 256, 256);
          }),
        );
        if (cancelado) return;
        const texSat = new THREE.CanvasTexture(canvas);
        texSat.colorSpace = THREE.SRGBColorSpace;
        texSat.anisotropy = 4;
        // Re-mapear UVs de la cara superior a u,v del mosaico
        const pos = geoPoli.attributes.position;
        const uv = geoPoli.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const sx = pos.getX(i);
          const sy = pos.getY(i);
          const { lng, lat } = escenaALngLat(sx, sy);
          const { u, v } = uvDeLngLat(lng, lat, bbox, mosaico);
          uv.setXY(i, u, v);
        }
        uv.needsUpdate = true;
        matPoli.map = texSat;
        matPoli.color.set("#ffffff");
        matPoli.needsUpdate = true;
        setEstado("satelite");
      } catch {
        if (!cancelado) setEstado("procedural");
      }
    })();

    // Grilla de matriz sobre la cara superior (solo segmentos dentro del
    // polígono, para que se lea como una sola capa y no como fondo aparte).
    {
      const escena = anilloExt.map((p) => {
        const { sx, sy } = aEscena(p.x, p.y);
        return { x: sx, y: sy };
      });
      const minSx = Math.min(...escena.map((p) => p.x));
      const maxSx = Math.max(...escena.map((p) => p.x));
      const minSy = Math.min(...escena.map((p) => p.y));
      const maxSy = Math.max(...escena.map((p) => p.y));
      const DIV = 10;
      const pts: THREE.Vector3[] = [];
      const z = ALTURA_POLIGONO + 0.015;
      for (let i = 1; i < DIV; i++) {
        const fx = minSx + ((maxSx - minSx) * i) / DIV;
        const fy = minSy + ((maxSy - minSy) * i) / DIV;
        // vertical: recorre en tramos y conserva los que caen dentro
        let prevY = minSy;
        const STEPS = 40;
        for (let s = 1; s <= STEPS; s++) {
          const y = minSy + ((maxSy - minSy) * s) / STEPS;
          const inside =
            puntoEnPoligonoXY(fx, (prevY + y) / 2, escena) &&
            puntoEnPoligonoXY(fx, y, escena);
          if (inside) {
            pts.push(new THREE.Vector3(fx, prevY, z), new THREE.Vector3(fx, y, z));
          }
          prevY = y;
        }
        let prevX = minSx;
        for (let s = 1; s <= STEPS; s++) {
          const x = minSx + ((maxSx - minSx) * s) / STEPS;
          const inside =
            puntoEnPoligonoXY((prevX + x) / 2, fy, escena) &&
            puntoEnPoligonoXY(x, fy, escena);
          if (inside) {
            pts.push(new THREE.Vector3(prevX, fy, z), new THREE.Vector3(x, fy, z));
          }
          prevX = x;
        }
      }
      if (pts.length > 0) {
        const grilla = new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }),
        );
        scene.add(grilla);
      }
    }

    // --- Árboles: tronco vertical + copa en 2 capas + sombra de contacto ---
    // OJO: la escena es Z-up (camera.up 0,0,1) pero CylinderGeometry nace con
    // su eje en Y → sin rotateX queda ACOSTADO. Se rota la geometría una vez.
    const troncoGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.7, 8);
    troncoGeo.rotateX(Math.PI / 2);
    const copaGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const copaAltaGeo = new THREE.IcosahedronGeometry(0.32, 1);
    const brilloGeo = new THREE.IcosahedronGeometry(0.14, 0);
    const sombraGeo = new THREE.CircleGeometry(0.42, 20);
    const troncoMat = new THREE.MeshStandardMaterial({ color: "#7a4a21", roughness: 1 });
    const sombraMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const brilloMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.4,
    });
    const copaMats = new Map<string, THREE.MeshStandardMaterial>();
    const copaClaraMats = new Map<string, THREE.MeshStandardMaterial>();
    const copaDe = (especie: string) => {
      let m = copaMats.get(especie);
      if (!m) {
        m = new THREE.MeshStandardMaterial({
          color: colorEspecieThree(especie),
          roughness: 0.9,
          flatShading: true,
        });
        copaMats.set(especie, m);
      }
      return m;
    };
    const copaClaraDe = (especie: string) => {
      let m = copaClaraMats.get(especie);
      if (!m) {
        const base = colorEspecieThree(especie);
        base.offsetHSL(0, 0.02, 0.09);
        m = new THREE.MeshStandardMaterial({
          color: base,
          roughness: 0.9,
          flatShading: true,
        });
        copaClaraMats.set(especie, m);
      }
      return m;
    };
    const grupoArboles = new THREE.Group();
    const golpeables: THREE.Object3D[] = [];
    for (const a of arboles) {
      const nx = a.posX - 0.5;
      const ny = -(a.posY - 0.5);
      const { sx, sy } = aEscena(nx, ny);
      const h = hashId(a.id);
      const escala = 0.9 + ((h % 40) / 100); // 0.9–1.29 variación natural
      const giro = ((h >> 3) % 628) / 100;
      const g = new THREE.Group();
      const sombra = new THREE.Mesh(sombraGeo, sombraMat);
      sombra.position.z = ALTURA_POLIGONO + 0.012;
      const tronco = new THREE.Mesh(troncoGeo, troncoMat);
      tronco.position.z = ALTURA_POLIGONO + 0.35;
      tronco.castShadow = true;
      const copa = new THREE.Mesh(copaGeo, copaDe(a.especie));
      copa.position.z = ALTURA_POLIGONO + 0.95;
      copa.castShadow = true;
      copa.userData.arbolId = a.id;
      const copaAlta = new THREE.Mesh(copaAltaGeo, copaClaraDe(a.especie));
      copaAlta.position.set(0.2, 0.12, ALTURA_POLIGONO + 1.32);
      copaAlta.castShadow = true;
      copaAlta.userData.arbolId = a.id;
      const brillo = new THREE.Mesh(brilloGeo, brilloMat);
      brillo.position.set(-0.18, -0.12, ALTURA_POLIGONO + 1.18);
      g.add(sombra, tronco, copa, copaAlta, brillo);
      g.position.set(sx, sy, 0);
      g.rotation.z = giro;
      g.scale.setScalar(escala);
      grupoArboles.add(g);
      golpeables.push(copa, copaAlta);
    }
    scene.add(grupoArboles);

    // Click (no drag) → editar
    const ray = new THREE.Raycaster();
    const puntero = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const r = renderer!.domElement.getBoundingClientRect();
      puntero.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      puntero.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(puntero, camera);
      const hit = ray.intersectObjects(golpeables, false)[0];
      const id = hit?.object.userData.arbolId as string | undefined;
      if (id) onEditarRef.current(id);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const redimensionar = () => {
      const w = cont.clientWidth || 1;
      const h = cont.clientHeight || 1;
      renderer!.setSize(w, h, false);
      renderer!.domElement.style.width = "100%";
      renderer!.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    redimensionar();
    const ro = new ResizeObserver(redimensionar);
    ro.observe(cont);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer!.render(scene, camera);
    };
    loop();

    (cont as unknown as { __reset3D?: () => void }).__reset3D = () => {
      camera.position.copy(vistaInicial);
      controls.target.copy(objetivoInicial);
      controls.update();
    };

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer!.domElement.removeEventListener("pointerdown", onDown);
      renderer!.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      texTierra.dispose();
      (matPoli.map as THREE.Texture | null)?.dispose();
      matPoli.dispose();
      matLateral.dispose();
      renderer!.dispose();
      renderer!.domElement.remove();
      renderer = null;
    };
  }, [coordinates, arboles]);

  return (
    <div className="relative size-full bg-gradient-to-b from-sky-200 to-emerald-100 dark:from-sky-950 dark:to-emerald-950">
      <div ref={ref} className="absolute inset-0 cursor-grab active:cursor-grabbing [&>canvas]:block" />
      <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">
        {estado === "cargando" ? "Cargando 3D…" : estado === "satelite" ? "3D · satélite" : estado === "procedural" ? "3D · suelo procedural" : "3D no disponible"}
      </div>
      <button
        type="button"
        className="absolute right-2 top-2 rounded-full border bg-white/90 px-2.5 py-1 text-[11px] hover:bg-white"
        onClick={() => {
          const cont = ref.current as unknown as { __reset3D?: () => void } | null;
          cont?.__reset3D?.();
        }}
      >
        Vista inicial
      </button>
      {estado === "sin-webgl" ? (
        <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Tu navegador no soporta WebGL; usa la vista 2D.
        </p>
      ) : null}
    </div>
  );
}
