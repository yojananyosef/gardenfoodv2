// Huella determinista de dispositivo (solo con consentimiento `deviceLinking`).
// FNV-1a de 32 bits en 2 rondas → hex de 16 caracteres. No es criptografía ni
// anti-fraude: solo continuidad de identidad consentida cuando no hay storage.

export const HUELLA_SAL = "gf-v1";

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface PartesHuella {
  userAgent: string;
  pantalla: string;
  idioma: string;
  zonaHoraria: string;
}

export function huellaDispositivo(partes: PartesHuella): string {
  const base = `${HUELLA_SAL}|${partes.userAgent}|${partes.pantalla}|${partes.idioma}|${partes.zonaHoraria}`;
  const r1 = fnv1a(base);
  const r2 = fnv1a(`${r1.toString(16)}|${base}`);
  return `${r1.toString(16).padStart(8, "0")}${r2.toString(16).padStart(8, "0")}`;
}
