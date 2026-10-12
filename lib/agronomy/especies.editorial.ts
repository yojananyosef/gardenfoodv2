/**
 * Lo del catalogo de especies que NO esta en la base: el orden en que se
 * muestran, la imagen, la descripcion y el clima.
 *
 * EL ORDEN
 * --------
 *
 * `especies.ts` antes era un array con `id: 1..30` en un orden curado a mano:
 * duraznero primero, luego el resto de los carozos, luego las pomaceas, luego
 * los citricos. La base devuelve por `especie_id`, que es alfabetico, asi que
 * sin este orden el catalogo empieza en Almendro.
 *
 * Y eso no es cosmético: `CalculadorasView` hace `useState(ESPECIES[0].dbKey)`
 * y `WorkbenchModular` hace `setEspecie(ESPECIES[0]?.dbKey)`. Con el orden
 * alfabetico, la calculadora abriria en almendro en vez de duraznero, sin error
 * de por medio: solo un valor distinto.
 *
 * LO QUE NO ESTA EN EL EXCEL
 * --------------------------
 *
 * `imagen` y `descripcion` se buscaron celda por celda en las 47 hojas y no
 * existen. Son texto de presentacion y una ruta a un archivo del repo.
 *
 * `dbKey`, `nombre`, `dificultad` y `grupo` SI estan en la base, y aun asi
 * se leen de aca. `scripts/verificar_especies_migradas.mjs` comparo las 30
 * especies campo por campo y salio con 29 diferencias:
 *
 *   dificultad  el codigo usa una escala de 5 (Facil, Moderado, Avanzado,
 *               Dificil, Alto) y el Excel texto libre: "Media", "Muy facil",
 *               "Facil-Media", "Media-Dificil". Los ultimos estan FUERA del
 *               tipo, o sea que leerlo de la base obligaria a ampliar
 *               `Dificultad` o a castear en silencio.
 *   grupo       el codigo tiene 7 grupos, el Excel 8 y distintos: Berries en
 *               vez de Baya, Vid y Oleaceo en vez de Otros.
 *   dbKey       es la URL de /especies/<dbKey> y la llave con que se busca la
 *               especie. Pasarlo a "Arandano" con tilde rompe los enlaces que
 *               ya existen.
 *
 * Los valores del Excel no se pierden: quedan en
 * `especies.generado.ts` y `getEspecieCompleta()` los devuelve. Lo que se
 * decide aca es cual de los dos vocabularios ve el usuario, y por ahora gana el
 * de siempre porque cambiarlo no es gratis.
 *
 * `clima` es la excepcion: `ESPECIES_FICHA_BD20.clima_ideal` tiene el dato
 * para 20 de las 30. Estas 10 no lo tienen, asi que el clima de aca es el unico
 * que existe. Cuando se llene la hoja, se pone `clima: null` en la entrada y
 * empieza a mandar la base.
 *
 * `scripts/extraer_editorial_especies.mjs` genero este archivo desde el
 * `especies.ts` anterior. Ni el texto ni el orden se transcribieron a mano.
 *
 * 2026-10-12 · 30 especies
 */

export interface EditorialEspecie {
  /** Posicion en el catalogo, la del array original. */
  orden: number;
  dbKey: string | null;
  nombre: string | null;
  dificultad: string | null;
  grupo: string | null;
  imagen: string | null;
  descripcion: string | null;
  clima: string | null;
}

export const EDITORIAL: Record<string, EditorialEspecie> = {
  "duraznero": {
    orden: 1,
    dbKey: "Duraznero",
    nombre: "Duraznero",
    dificultad: "Fácil",
    grupo: "Carozo",
    imagen: "/frutas/duraznero.webp",
    descripcion: "Frutal de hueso muy cultivado en Chile central. Produce abundantemente con poda anual.",
    clima: "Templado, frío invernal y calor estival",
  },
  "ciruelo": {
    orden: 2,
    dbKey: "Ciruelo",
    nombre: "Ciruelo",
    dificultad: "Fácil",
    grupo: "Carozo",
    imagen: "/frutas/ciruelo.webp",
    descripcion: "Frutal generoso y longevo. Producción alta una vez establecido con poca intervención.",
    clima: "Templado, tolera bien el frío",
  },
  "cerezo": {
    orden: 3,
    dbKey: "Cerezo",
    nombre: "Cerezo",
    dificultad: "Moderado",
    grupo: "Carozo",
    imagen: "/frutas/cerezo.webp",
    descripcion: "Chile es uno de los mayores exportadores mundiales de cereza. Exige buen drenaje y frío invernal.",
    clima: "Templado-frío, veranos suaves",
  },
  "damasco": {
    orden: 4,
    dbKey: "Damasco",
    nombre: "Damasco",
    dificultad: "Moderado",
    grupo: "Carozo",
    imagen: "/frutas/damasco.webp",
    descripcion: "Uno de los primeros frutos del verano. Florece en agosto y requiere protección ante heladas tardías.",
    clima: "Templado con inviernos fríos",
  },
  "nectarino": {
    orden: 5,
    dbKey: "Nectarino",
    nombre: "Nectarino",
    dificultad: "Fácil",
    grupo: "Carozo",
    imagen: "/frutas/nectarino.webp",
    descripcion: "El durazno sin pelusa. Se cuida igual pero es más sensible a la cloca (hongo foliar).",
    clima: "Templado, frío invernal y calor estival",
  },
  "manzano": {
    orden: 6,
    dbKey: "Manzano",
    nombre: "Manzano",
    dificultad: "Moderado",
    grupo: "Pomácea",
    imagen: "/frutas/manzano.webp",
    descripcion: "Frutal clásico de larga vida (30–50 años). Necesita polinizador y frío invernal para producir bien.",
    clima: "Templado-frío",
  },
  "peral": {
    orden: 7,
    dbKey: "Peral",
    nombre: "Peral",
    dificultad: "Moderado",
    grupo: "Pomácea",
    imagen: "/frutas/peral.webp",
    descripcion: "Se cosecha verde y madura en casa. Árbol longevo de hasta 50 años. Necesita polinizador.",
    clima: "Templado, tolera frío",
  },
  "membrillo": {
    orden: 8,
    dbKey: "Membrillo",
    nombre: "Membrillo",
    dificultad: "Fácil",
    grupo: "Pomácea",
    imagen: "/frutas/membrillo.webp",
    descripcion: "Uno de los frutales más fáciles y longevos (50+ años). Ideal para mermelada y dulce casero.",
    clima: "Templado, muy tolerante",
  },
  "limonero": {
    orden: 9,
    dbKey: "Limonero",
    nombre: "Limonero",
    dificultad: "Fácil",
    grupo: "Cítrico",
    imagen: "/frutas/limonero.webp",
    descripcion: "Produce casi todo el año. Perfecto para principiantes en zonas templado-cálidas sin heladas fuertes.",
    clima: "Subtropical y templado cálido",
  },
  "naranjo": {
    orden: 10,
    dbKey: "Naranjo",
    nombre: "Naranjo",
    dificultad: "Fácil",
    grupo: "Cítrico",
    imagen: "/frutas/naranjo.webp",
    descripcion: "Cítrico de larga vida (40–60 años). La floración de azahar perfuma todo el jardín.",
    clima: "Subtropical y templado cálido",
  },
  "mandarino": {
    orden: 11,
    dbKey: "Mandarino",
    nombre: "Mandarino",
    dificultad: "Fácil",
    grupo: "Cítrico",
    imagen: "/frutas/mandarino.webp",
    descripcion: "Árbol compacto, ideal para patios. Más resistente al frío que el naranjo.",
    clima: "Subtropical-templado",
  },
  "pomelo": {
    orden: 12,
    dbKey: "Pomelo",
    nombre: "Pomelo",
    dificultad: "Fácil",
    grupo: "Cítrico",
    imagen: "/frutas/pomelo.webp",
    descripcion: "Cítrico grande y longevo. El fruto mejora su sabor con el frío invernal.",
    clima: "Subtropical y templado cálido",
  },
  "nogal": {
    orden: 13,
    dbKey: "Nogal",
    nombre: "Nogal",
    dificultad: "Fácil",
    grupo: "Fruto seco",
    imagen: "/frutas/nogal.webp",
    descripcion: "Árbol de gran tamaño y vida centenaria. Inversión generacional con alta demanda de nueces.",
    clima: "Templado con inviernos fríos",
  },
  "almendro": {
    orden: 14,
    dbKey: "Almendro",
    nombre: "Almendro",
    dificultad: "Moderado",
    grupo: "Fruto seco",
    imagen: "/frutas/almendro.webp",
    descripcion: "Florece espectacularmente en agosto. Muy tolerante a la sequía una vez establecido.",
    clima: "Mediterráneo seco",
  },
  "higuera": {
    orden: 15,
    dbKey: "Higuera",
    nombre: "Higuera",
    dificultad: "Fácil",
    grupo: "Otros",
    imagen: "/frutas/higuera.webp",
    descripcion: "Probablemente el frutal más fácil del mundo. Produce en 1–2 años y tolera casi cualquier condición.",
    clima: "Mediterráneo, muy tolerante",
  },
  "granado": {
    orden: 16,
    dbKey: "Granado",
    nombre: "Granado",
    dificultad: "Fácil",
    grupo: "Otros",
    imagen: "/frutas/granado.webp",
    descripcion: "Flores rojas espectaculares. Tolerante a sequía y suelos salinos. La granada dura meses en el refrigerador.",
    clima: "Mediterráneo, calor seco",
  },
  "caqui": {
    orden: 17,
    dbKey: "Caqui",
    nombre: "Caqui",
    dificultad: "Fácil",
    grupo: "Otros",
    imagen: "/frutas/caqui.webp",
    descripcion: "Brota muy tarde (octubre). Hay dos tipos: Fuyu (se come duro) y Hachiya (se come completamente blando).",
    clima: "Templado a subtropical",
  },
  "vid": {
    orden: 18,
    dbKey: "Vid",
    nombre: "Vid",
    dificultad: "Moderado",
    grupo: "Otros",
    imagen: "/frutas/vid.webp",
    descripcion: "Enredadera muy productiva. Necesita estructura (parrón o espaldera) y poda anual obligatoria.",
    clima: "Mediterráneo, veranos secos y calurosos",
  },
  "arandano": {
    orden: 19,
    dbKey: "Arandano",
    nombre: "Arándano",
    dificultad: "Moderado",
    grupo: "Baya",
    imagen: "/frutas/arandano.webp",
    descripcion: "Chile es el mayor exportador del hemisferio sur. Requiere suelo ácido obligatorio (pH 4.5–5.5).",
    clima: "Templado-frío",
  },
  "olivo": {
    orden: 20,
    dbKey: "Olivo",
    nombre: "Olivo",
    dificultad: "Fácil",
    grupo: "Otros",
    imagen: "/frutas/olivo.webp",
    descripcion: "Árbol milenario que vive 100+ años. Tolerante a casi todo. NUNCA plantar donde hubo tomate o papa.",
    clima: "Mediterráneo, veranos secos",
  },
  "frutilla": {
    orden: 21,
    dbKey: "Frutilla",
    nombre: "Frutilla",
    dificultad: "Fácil",
    grupo: "Baya",
    imagen: "/frutas/frutilla.webp",
    descripcion: "Fruto fácil, rápido y muy gratificante. Produce a los 2-3 meses de plantar. Ideal para macetas.",
    clima: "Templado, fresco; tolera calor con riego constante",
  },
  "frambuesa": {
    orden: 22,
    dbKey: "Frambuesa",
    nombre: "Frambuesa",
    dificultad: "Moderado",
    grupo: "Baya",
    imagen: "/frutas/frambuesa.webp",
    descripcion: "Arbusto frutal con altísimo rendimiento. Chile es el 2.º exportador mundial. Ideal para zonas con veranos frescos.",
    clima: "Templado-frío; veranos frescos son ideales",
  },
  "mora": {
    orden: 23,
    dbKey: "Mora",
    nombre: "Mora",
    dificultad: "Fácil",
    grupo: "Baya",
    imagen: "/frutas/mora.webp",
    descripcion: "El frutal más rústico de los berries. Vigoroso, tolerante y muy productivo desde el 2.º año.",
    clima: "Templado; muy adaptable desde zona central al sur",
  },
  "kiwi": {
    orden: 24,
    dbKey: "Kiwi",
    nombre: "Kiwi",
    dificultad: "Moderado",
    grupo: "Otros",
    imagen: "/frutas/kiwi.webp",
    descripcion: "Enredadera frutal de largo plazo (30+ años). Chile es el 3.º exportador mundial. Necesita polinizador macho.",
    clima: "Mediterráneo con veranos cálidos; 600–800 h frío",
  },
  "avellano-europeo": {
    orden: 25,
    dbKey: "Avellano Europeo",
    nombre: "Avellano",
    dificultad: "Moderado",
    grupo: "Fruto seco",
    imagen: "/frutas/avellano-europeo.webp",
    descripcion: "Arbusto resistente que crece bien en Chile central y sur. Biobío y Araucanía concentran el 90% de la producción nacional.",
    clima: "Templado-frío; requiere 800–1200 h frío",
  },
  "nispero-japones": {
    orden: 26,
    dbKey: "Níspero Japonés",
    nombre: "Níspero",
    dificultad: "Fácil",
    grupo: "Subtropical",
    imagen: "/frutas/nispero-japones.webp",
    descripcion: "El primer fruto del año: listo en agosto-octubre. Árbol ornamental de hoja perenne, tolera costa y calor.",
    clima: "Mediterráneo o semiárido; sensible a heladas invernales en flor",
  },
  "chirimoya": {
    orden: 27,
    dbKey: "Chirimoya",
    nombre: "Chirimoyo",
    dificultad: "Avanzado",
    grupo: "Subtropical",
    imagen: "/frutas/chirimoya.webp",
    descripcion: "Frutal tropical-subtropical nativo de los Andes. Chile es el mayor productor mundial. Solo viable en el norte-centro costero.",
    clima: "Semiárido-mediterráneo costero; sin heladas",
  },
  "lucuma": {
    orden: 28,
    dbKey: "Lúcuma",
    nombre: "Lúcumo",
    dificultad: "Moderado",
    grupo: "Subtropical",
    imagen: "/frutas/lucuma.webp",
    descripcion: "Frutal andino de pulpa única, sabor a caramelo. Solo viable en la franja costera norte-centro sin heladas.",
    clima: "Semiárido costero; muy sensible al frío (-2°C la mata)",
  },
  "papayo-chileno": {
    orden: 29,
    dbKey: "Papayo Chileno",
    nombre: "Papayo chileno",
    dificultad: "Moderado",
    grupo: "Subtropical",
    imagen: "/frutas/papayo-chileno.webp",
    descripcion: "Frutal nativo chileno de crecimiento muy rápido. Produce todo el año en zonas sin heladas. Único del mundo.",
    clima: "Mediterráneo costero sin heladas; muy sensible al frío",
  },
  "palto": {
    orden: 30,
    dbKey: "Palto",
    nombre: "Palto",
    dificultad: "Avanzado",
    grupo: "Subtropical",
    imagen: "/frutas/palto.webp",
    descripcion: "El frutal de mayor crecimiento en Chile. Quillota es el epicentro nacional. Sensible a heladas y raíz con poca tolerancia al encharcamiento.",
    clima: "Mediterráneo costero sin heladas fuertes",
  },
};
