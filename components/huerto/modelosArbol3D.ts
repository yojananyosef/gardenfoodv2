import * as THREE from "three";
import { modeloDeArbol, type ModeloArbol } from "@/lib/huerto/arbolModelo";

/**
 * Construye el ejemplar 3D de un árbol a partir de su modelo paramétrico.
 * Geometrías unitarias compartidas (se escalan por mesh) y materiales
 * cacheados por color: 200 árboles no cuestan 200 geometrías.
 */

// Eje del cilindro en Y → se rota una vez a Z-up (la escena usa camera.up Z).
function geometriaTronco(): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(0.85, 1, 1, 7);
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, 0.5); // base en z=0
  return g;
}

const GEO = {
  get tronco() {
    this._tronco ??= geometriaTronco();
    return this._tronco;
  },
  get copa() {
    this._copa ??= new THREE.IcosahedronGeometry(1, 1);
    return this._copa;
  },
  get fruto() {
    this._fruto ??= new THREE.IcosahedronGeometry(1, 0);
    return this._fruto;
  },
  get sombra() {
    this._sombra ??= new THREE.CircleGeometry(1, 20);
    return this._sombra;
  },
  _tronco: null as THREE.CylinderGeometry | null,
  _copa: null as THREE.IcosahedronGeometry | null,
  _fruto: null as THREE.IcosahedronGeometry | null,
  _sombra: null as THREE.CircleGeometry | null,
};

const MATS = new Map<string, THREE.MeshStandardMaterial>();
function matCopa(hex: string): THREE.MeshStandardMaterial {
  let m = MATS.get(hex);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      roughness: 0.9,
      flatShading: true,
    });
    MATS.set(hex, m);
  }
  return m;
}

let MAT_TRONCO: THREE.MeshStandardMaterial | null = null;
let MAT_SOMBRA: THREE.MeshBasicMaterial | null = null;
let MAT_BRILLO: THREE.MeshStandardMaterial | null = null;
let MAT_FRUTO: THREE.MeshStandardMaterial | null = null;

function hashId(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}

function tronco(
  grupo: THREE.Group,
  x: number,
  y: number,
  alto: number,
  radio: number,
  tiltX = 0,
  tiltY = 0,
): void {
  MAT_TRONCO ??= new THREE.MeshStandardMaterial({ color: "#6e4520", roughness: 1 });
  const t = new THREE.Mesh(GEO.tronco, MAT_TRONCO);
  t.position.set(x, y, 0);
  t.scale.set(radio, radio, alto);
  t.rotation.x = tiltX;
  t.rotation.y = tiltY;
  t.castShadow = true;
  grupo.add(t);
}

function copa(
  grupo: THREE.Group,
  golpeables: THREE.Object3D[],
  arbolId: string,
  modelo: ModeloArbol,
  x: number,
  y: number,
  z: number,
  r: number,
  sy: number,
  hex: string,
): THREE.Mesh {
  const c = new THREE.Mesh(GEO.copa, matCopa(hex));
  c.position.set(x, y, z);
  c.scale.set(r, r, r * sy);
  c.castShadow = true;
  c.userData.arbolId = arbolId;
  grupo.add(c);
  golpeables.push(c);
  void modelo;
  return c;
}

function frutos(
  grupo: THREE.Group,
  modelo: ModeloArbol,
  cx: number,
  cy: number,
  cz: number,
  r: number,
  sy: number,
  h: number,
): void {
  if (!modelo.frutos) return;
  MAT_FRUTO ??= new THREE.MeshStandardMaterial({ roughness: 0.55, flatShading: true });
  const mat = MAT_FRUTO.clone();
  mat.color = new THREE.Color(modelo.frutos.color);
  const n = modelo.frutos.cantidad;
  const off = (h % 628) / 100;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const phi = Math.acos(1 - 2 * t * 0.78); // sesgo al hemisferio superior
    const theta = i * 2.39996 + off;
    const dx = Math.sin(phi) * Math.cos(theta);
    const dy = Math.sin(phi) * Math.sin(theta);
    const dz = Math.cos(phi);
    if (dz < -0.15) continue;
    const f = new THREE.Mesh(GEO.fruto, mat);
    f.position.set(cx + dx * r * 0.96, cy + dy * r * 0.96, cz + dz * r * sy * 0.96);
    f.scale.setScalar(0.075);
    grupo.add(f);
  }
}

function brillo(grupo: THREE.Group, x: number, y: number, z: number, s: number): void {
  MAT_BRILLO ??= new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    roughness: 0.4,
  });
  const b = new THREE.Mesh(GEO.fruto, MAT_BRILLO);
  b.position.set(x, y, z);
  b.scale.setScalar(s);
  grupo.add(b);
}

export function construirArbol(
  arbolId: string,
  especie: string,
): { grupo: THREE.Group; golpeables: THREE.Object3D[] } {
  const modelo = modeloDeArbol(especie);
  const grupo = new THREE.Group();
  const golpeables: THREE.Object3D[] = [];
  const h = hashId(arbolId);
  const r = modelo.copaRadio;
  const sy = modelo.copaAchatadaY;

  MAT_SOMBRA ??= new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const sombra = new THREE.Mesh(GEO.sombra, MAT_SOMBRA);
  sombra.position.z = 0.012;
  sombra.scale.setScalar(r * 1.05);
  grupo.add(sombra);

  switch (modelo.forma) {
    case "arbusto": {
      // Mata baja: 3 varas finas en abanico + 3 copitas.
      const angulos = [0, 2.1, 4.2];
      angulos.forEach((a, i) => {
        const dx = Math.cos(a) * r * 0.32;
        const dy = Math.sin(a) * r * 0.32;
        const alto = modelo.troncoAlto * (0.85 + i * 0.1);
        tronco(grupo, dx, dy, alto, modelo.troncoRadio, dy * 0.5, -dx * 0.5);
        const cz = alto + r * 0.32;
        copa(grupo, golpeables, arbolId, modelo, dx * 1.3, dy * 1.3, cz, r * 0.55, sy, modelo.colorCopa);
        frutos(grupo, modelo, dx * 1.3, dy * 1.3, cz, r * 0.55, sy, h + i * 7);
      });
      break;
    }
    case "multitronco": {
      // Avellano: 3 troncos delgados inclinados + copa común.
      [-0.22, 0, 0.22].forEach((tilt, i) => {
        tronco(grupo, tilt * 0.5, (i - 1) * 0.08, modelo.troncoAlto, modelo.troncoRadio, 0, -tilt);
      });
      const cz = modelo.troncoAlto + r * 0.7;
      copa(grupo, golpeables, arbolId, modelo, 0, 0, cz, r, sy, modelo.colorCopa);
      copa(grupo, golpeables, arbolId, modelo, r * 0.4, r * 0.25, cz + r * 0.72, r * 0.6, sy, modelo.colorCopa2);
      brillo(grupo, -r * 0.35, -r * 0.25, cz + r * 0.5, r * 0.26);
      frutos(grupo, modelo, 0, 0, cz, r, sy, h);
      break;
    }
    case "penacho": {
      // Papayo: fuste alto y delgado + corona de hojas arriba.
      tronco(grupo, 0, 0, modelo.troncoAlto, modelo.troncoRadio);
      const cz = modelo.troncoAlto + r * 0.35;
      copa(grupo, golpeables, arbolId, modelo, 0, 0, cz, r, sy, modelo.colorCopa);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        copa(
          grupo, golpeables, arbolId, modelo,
          Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, cz + r * 0.18,
          r * 0.5, sy, modelo.colorCopa2,
        );
      }
      break;
    }
    case "parron": {
      // Vid / kiwi: tronco corto + parrón ancho y chato.
      tronco(grupo, 0, 0, modelo.troncoAlto, modelo.troncoRadio);
      const cz = modelo.troncoAlto + r * 0.32;
      copa(grupo, golpeables, arbolId, modelo, 0, 0, cz, r, sy, modelo.colorCopa);
      copa(grupo, golpeables, arbolId, modelo, r * 0.45, -r * 0.2, cz + r * 0.22, r * 0.55, sy, modelo.colorCopa2);
      frutos(grupo, modelo, 0, 0, cz - r * 0.1, r, sy, h);
      break;
    }
    default: {
      // esferico / citrico / grande / olivo / higuera: tronco + copa + copa alta.
      tronco(grupo, 0, 0, modelo.troncoAlto, modelo.troncoRadio);
      const cz = modelo.troncoAlto + r * 0.72;
      copa(grupo, golpeables, arbolId, modelo, 0, 0, cz, r, sy, modelo.colorCopa);
      copa(
        grupo, golpeables, arbolId, modelo,
        r * 0.38, r * 0.22, cz + r * 0.68, r * 0.6, sy, modelo.colorCopa2,
      );
      brillo(grupo, -r * 0.34, -r * 0.22, cz + r * 0.5, r * 0.26);
      frutos(grupo, modelo, 0, 0, cz, r, sy, h);
      break;
    }
  }

  grupo.scale.setScalar(modelo.escala * (0.92 + ((h % 16) / 100)));
  grupo.rotation.z = ((h >> 3) % 628) / 100;
  return { grupo, golpeables };
}
