"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { poligonoAMetros } from "@/lib/huerto/plano";
import { construirArbol } from "@/components/huerto/modelosArbol3D";
import type { TerrenoPolygonCoordinates } from "@/lib/huerto/terreno";

export type Arbol3D = { id: string; especie: string; posX: number; posY: number };

const ALTURA_POLIGONO = 0.35;
const EXPANSION_PLATO = 1.1;

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
  // Tierra marrón-verdosa: base parda con matiz oliva.
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "#77683a");
  grad.addColorStop(1, "#4a3f22");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  // Ruido en dos escalas: terrones oscuros + pasto seco claro.
  for (const [n, alpha, size] of [[2600, 0.16, 1.6], [500, 0.12, 3.2]] as const) {
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(35,26,10,${alpha})` : `rgba(208,196,138,${alpha})`;
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
  const [sinWebgl, setSinWebgl] = useState(false);
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
      queueMicrotask(() => setSinWebgl(true));
      return;
    }
    const metrico = poligonoAMetros(coordinates);
    if (!metrico) {
      queueMicrotask(() => setSinWebgl(true));
      return;
    }
    const { anchoM, altoM } = metrico;
    const k = Math.max(anchoM, altoM, 1e-9) / 10; // lado mayor = 10 unidades
    const aEscena = (nx: number, ny: number) => ({
      sx: (nx * anchoM) / k,
      sy: (ny * altoM) / k,
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
    const platoGeo = new THREE.BoxGeometry(platoW, platoH, 0.6);
    const platoMat = new THREE.MeshStandardMaterial({ map: texTierra, roughness: 1 });
    const plato = new THREE.Mesh(platoGeo, platoMat);
    plato.position.z = -0.31;
    plato.receiveShadow = true;
    scene.add(plato);

    // --- Polígono extruido sobre el plato: 3D puro procedural ---
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
    // Tapas (0) de tierra cultivada oliva, laterales (1) de tierra oscura para
    // que el polígono "asiente" sobre el plato en vez de flotar.
    const matPoli = new THREE.MeshStandardMaterial({
      color: "#68713b",
      roughness: 1,
    });
    const matLateral = new THREE.MeshStandardMaterial({
      color: "#38311f",
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
    let borde: THREE.Line | null = null;
    let bordeGeo: THREE.BufferGeometry | null = null;
    if (bordePts.length > 1) {
      bordePts.push(bordePts[0].clone());
      bordeGeo = new THREE.BufferGeometry().setFromPoints(bordePts);
      borde = new THREE.Line(
        bordeGeo,
        new THREE.LineBasicMaterial({ color: 0xe7f5c0 }),
      );
      scene.add(borde);
    }

    // Nota: antes la cara superior llevaba mosaico satélite Esri, pero al no
    // ser 3D metía ruido visual. Ahora es 3D puro procedural.

    // Grilla de matriz sobre la cara superior (solo segmentos dentro del
    // polígono, para que se lea como una sola capa y no como fondo aparte).
    let grillaGeo: THREE.BufferGeometry | null = null;
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
        grillaGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const grilla = new THREE.LineSegments(
          grillaGeo,
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }),
        );
        scene.add(grilla);
      }
    }

    // --- Árboles por especie (porte propio: olivo ≠ duraznero) ---
    const grupoArboles = new THREE.Group();
    const golpeables: THREE.Object3D[] = [];
    for (const a of arboles) {
      const nx = a.posX - 0.5;
      const ny = -(a.posY - 0.5);
      const { sx, sy } = aEscena(nx, ny);
      const { grupo, golpeables: hits } = construirArbol(a.id, a.especie);
      grupo.position.set(sx, sy, ALTURA_POLIGONO);
      grupoArboles.add(grupo);
      golpeables.push(...hits);
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
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer!.domElement.removeEventListener("pointerdown", onDown);
      renderer!.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      // OJO: no se recorre la escena liberando geometrías: los árboles usan
      // geometrías/materiales compartidos en caché entre montajes.
      platoGeo.dispose();
      platoMat.dispose();
      geoPoli.dispose();
      bordeGeo?.dispose();
      (borde?.material as THREE.Material | undefined)?.dispose();
      grillaGeo?.dispose();
      texTierra.dispose();
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
        3D
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
      {sinWebgl ? (
        <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Tu navegador no soporta WebGL; usa la vista 2D.
        </p>
      ) : null}
    </div>
  );
}
