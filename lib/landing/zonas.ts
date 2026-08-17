export type Tarea = {
  accion: "Podar" | "Regar" | "Fertilizar";
  detalle: string;
};

export type Comuna = {
  nombre: string;
  zona: string;
};

export type Region = {
  nombre: string;
  comunas: Comuna[];
};

export const REGIONES: Region[] = [
  {
    nombre: "Arica y Parinacota",
    comunas: [
      { nombre: "Arica", zona: "Norte Grande" },
      { nombre: "Putre", zona: "Altiplano" },
    ],
  },
  {
    nombre: "Tarapacá",
    comunas: [
      { nombre: "Iquique", zona: "Norte Grande" },
      { nombre: "Pozo Almonte", zona: "Norte Grande" },
    ],
  },
  {
    nombre: "Antofagasta",
    comunas: [
      { nombre: "Antofagasta", zona: "Norte Grande" },
      { nombre: "Calama", zona: "Norte Grande" },
    ],
  },
  {
    nombre: "Atacama",
    comunas: [
      { nombre: "Copiapó", zona: "Norte Chico" },
      { nombre: "Vallenar", zona: "Norte Chico" },
    ],
  },
  {
    nombre: "Coquimbo",
    comunas: [
      { nombre: "La Serena", zona: "Norte Chico" },
      { nombre: "Ovalle", zona: "Norte Chico" },
      { nombre: "Illapel", zona: "Norte Chico" },
    ],
  },
  {
    nombre: "Valparaíso",
    comunas: [
      { nombre: "Valparaíso", zona: "Costa Central" },
      { nombre: "Viña del Mar", zona: "Costa Central" },
      { nombre: "Quillota", zona: "Valle Central" },
      { nombre: "Los Andes", zona: "Valle Cordillerano" },
    ],
  },
  {
    nombre: "Metropolitana",
    comunas: [
      { nombre: "Santiago", zona: "Valle Central" },
      { nombre: "Pirque", zona: "Valle Cordillerano" },
      { nombre: "Melipilla", zona: "Valle Central" },
    ],
  },
  {
    nombre: "O'Higgins",
    comunas: [
      { nombre: "Rancagua", zona: "Valle Central" },
      { nombre: "San Vicente", zona: "Valle Central" },
    ],
  },
  {
    nombre: "Maule",
    comunas: [
      { nombre: "Talca", zona: "Valle Central" },
      { nombre: "Constitución", zona: "Costa Central" },
    ],
  },
  {
    nombre: "Ñuble",
    comunas: [
      { nombre: "Chillán", zona: "Valle Central" },
      { nombre: "Quirihue", zona: "Costa Central" },
    ],
  },
  {
    nombre: "Biobío",
    comunas: [
      { nombre: "Concepción", zona: "Costa Sur" },
      { nombre: "Los Ángeles", zona: "Valle Central" },
    ],
  },
  {
    nombre: "La Araucanía",
    comunas: [
      { nombre: "Temuco", zona: "Zona Sur" },
      { nombre: "Villarrica", zona: "Zona Sur" },
    ],
  },
  {
    nombre: "Los Ríos",
    comunas: [
      { nombre: "Valdivia", zona: "Zona Sur" },
      { nombre: "La Unión", zona: "Zona Sur" },
    ],
  },
  {
    nombre: "Los Lagos",
    comunas: [
      { nombre: "Puerto Montt", zona: "Zona Sur" },
      { nombre: "Osorno", zona: "Zona Sur" },
    ],
  },
  {
    nombre: "Aysén",
    comunas: [
      { nombre: "Coyhaique", zona: "Patagonia" },
      { nombre: "Aysén", zona: "Patagonia" },
    ],
  },
  {
    nombre: "Magallanes",
    comunas: [
      { nombre: "Punta Arenas", zona: "Patagonia" },
      { nombre: "Puerto Natales", zona: "Patagonia" },
    ],
  },
];

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export const ZONAS: Record<string, Tarea[][]> = {
  "Norte Grande": [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [
      { accion: "Regar", detalle: "Reinicia el riego frecuente: el calor vuelve rápido." },
      { accion: "Podar", detalle: "Poda de mantención de cítricos y olivos antes del rebrote." },
    ],
    [
      { accion: "Fertilizar", detalle: "Nitrógeno para hortalizas de hoja y frutales jóvenes." },
      { accion: "Regar", detalle: "Riego por goteo cada 2 días; el desierto no perdona." },
    ],
    [
      { accion: "Fertilizar", detalle: "Fósforo y potasio en la floración de durazneros." },
      { accion: "Regar", detalle: "Aumenta frecuencia si hay olas de calor." },
    ],
    [
      { accion: "Regar", detalle: "Mantén riego constante en verano, idealmente al alba." },
      { accion: "Podar", detalle: "Aclareo de brotes en higueras y cítricos." },
    ],
  ],
  "Altiplano": [
    [
      { accion: "Fertilizar", detalle: "Composta en camas protegidas de la helada." },
    ],
    [],
    [],
    [],
    [],
    [
      { accion: "Podar", detalle: "Poda invernal de frutales caducifolios." },
    ],
    [],
    [],
    [
      { accion: "Regar", detalle: "Restablece riego: asciende el déficit hídrico." },
      { accion: "Fertilizar", detalle: "Fertilizante de liberación lenta en frutales." },
    ],
    [
      { accion: "Fertilizar", detalle: "Prepara el suelo con compost antes del cultivo." },
    ],
    [],
    [
      { accion: "Regar", detalle: "Riego diario en verano; las heladas ya pasaron." },
    ],
  ],
  "Norte Chico": [
    [],
    [],
    [],
    [],
    [
      { accion: "Podar", detalle: "Inicia la poda de limoneros y paltos tras la cosecha." },
    ],
    [
      { accion: "Podar", detalle: "Poda invernal de vides y olivos." },
      { accion: "Regar", detalle: "Reduce riego; baja la evapotranspiración." },
    ],
    [],
    [
      { accion: "Podar", detalle: "Últimas podas antes del brote primaveral." },
    ],
    [
      { accion: "Fertilizar", detalle: "Fertilizante base con compost en el huerto." },
      { accion: "Regar", detalle: "Recupera el riego semanal al subir las temperaturas." },
    ],
    [
      { accion: "Fertilizar", detalle: "Aporta nitrógeno en el crecimiento activo." },
    ],
    [
      { accion: "Fertilizar", detalle: "Refuerza potasio en la cuaja de frutos." },
    ],
    [
      { accion: "Regar", detalle: "Riego frecuente en verano, idealmente por goteo." },
      { accion: "Podar", detalle: "Aclareo de sombra para evitar golpe de sol." },
    ],
  ],
  "Costa Central": [
    [],
    [],
    [],
    [],
    [
      { accion: "Podar", detalle: "Poda liviana de palto y limonero." },
      { accion: "Regar", detalle: "La neblina costera ayuda; riega solo lo necesario." },
    ],
    [
      { accion: "Podar", detalle: "Poda de formación en frutales jóvenes." },
    ],
    [],
    [],
    [
      { accion: "Fertilizar", detalle: "Composta en la base de frutales y hortalizas." },
      { accion: "Regar", detalle: "Normaliza el riego con el calor primaveral." },
    ],
    [
      { accion: "Fertilizar", detalle: "Nitrógeno para el rebrote y la floración." },
    ],
    [
      { accion: "Fertilizar", detalle: "Potasio en frutales de carozo en cuaja." },
    ],
    [
      { accion: "Regar", detalle: "Riego por goteo; la costa seca en verano." },
    ],
  ],
  "Valle Central": [
    [],
    [],
    [],
    [
      { accion: "Podar", detalle: "Últimas podas de parronales antes del brote." },
    ],
    [
      { accion: "Podar", detalle: "Poda de frutales de carozo y pomáceas." },
    ],
    [
      { accion: "Podar", detalle: "Poda invernal de vides y manzanos." },
      { accion: "Regar", detalle: "Riego mínimo: el suelo está frío y húmedo." },
    ],
    [],
    [
      { accion: "Podar", detalle: "Termina la poda antes de la brotación." },
      { accion: "Fertilizar", detalle: "Composta y guano en la base de los árboles." },
    ],
    [
      { accion: "Fertilizar", detalle: "Fertilizante nitrogenado en el rebrote." },
      { accion: "Regar", detalle: "Comienza el riego regular con las heladas atrás." },
    ],
    [
      { accion: "Fertilizar", detalle: "Fósforo en la floración de pomáceas." },
    ],
    [
      { accion: "Fertilizar", detalle: "Potasio en la cuaja de frutales." },
    ],
    [
      { accion: "Regar", detalle: "Riego frecuente: el verano del valle es seco." },
      { accion: "Podar", detalle: "Aclareo de brotes vigorosos." },
    ],
  ],
  "Valle Cordillerano": [
    [],
    [],
    [],
    [],
    [
      { accion: "Podar", detalle: "Poda de frutales, resguardándose de heladas tardías." },
    ],
    [
      { accion: "Podar", detalle: "Poda invernal de vides y carozos." },
    ],
    [
      { accion: "Regar", detalle: "Riego casi nulo: nieve y heladas dominan." },
    ],
    [
      { accion: "Podar", detalle: "Cierra la poda con el fin del invierno." },
    ],
    [
      { accion: "Fertilizar", detalle: "Prepara el suelo apenas pase el frío." },
      { accion: "Regar", detalle: "Primeros riegos moderados de primavera." },
    ],
    [
      { accion: "Fertilizar", detalle: "Nitrógeno en el brote; vigila heladas tardías." },
    ],
    [
      { accion: "Fertilizar", detalle: "Refuerza potasio en la floración." },
    ],
    [
      { accion: "Regar", detalle: "Riego constante en el verano cordillerano." },
    ],
  ],
  "Costa Sur": [
    [],
    [],
    [],
    [],
    [
      { accion: "Podar", detalle: "Poda liviana de frutales de hoja caduca." },
    ],
    [
      { accion: "Podar", detalle: "Poda de invierno; la lluvia exige drenaje." },
      { accion: "Regar", detalle: "Evita el riego: llueve lo suficiente." },
    ],
    [
      { accion: "Regar", detalle: "Suspende riego; revisa drenajes." },
    ],
    [],
    [
      { accion: "Fertilizar", detalle: "Composta con el suelo aún húmedo." },
      { accion: "Regar", detalle: "Recién aquí vuelve el riego auxiliar." },
    ],
    [
      { accion: "Fertilizar", detalle: "Nitrógeno en el crecimiento primaveral." },
    ],
    [],
    [
      { accion: "Regar", detalle: "Riego suplementario en el verano húmedo." },
    ],
  ],
  "Zona Sur": [
    [],
    [],
    [],
    [],
    [
      { accion: "Podar", detalle: "Poda de frutales menores y frambueso." },
    ],
    [
      { accion: "Podar", detalle: "Poda invernal de manzanos y ciruelos." },
    ],
    [
      { accion: "Regar", detalle: "No riegues: la lluvia mantiene el suelo saturado." },
    ],
    [],
    [
      { accion: "Fertilizar", detalle: "Composta y guano en el huerto familiar." },
      { accion: "Regar", detalle: "Riego auxiliar solo en canícula." },
    ],
    [
      { accion: "Fertilizar", detalle: "Nitrógeno en el rebrote de frutales." },
    ],
    [],
    [
      { accion: "Regar", detalle: "Riego ocasional; el verano sur es corto y fresco." },
    ],
  ],
  Patagonia: [
    [],
    [],
    [],
    [],
    [
      { accion: "Podar", detalle: "Poda de frutales caducifolios resistentes." },
    ],
    [
      { accion: "Podar", detalle: "Poda de invierno en cerezos y manzanos." },
      { accion: "Regar", detalle: "Suspende riego; suelo congelado." },
    ],
    [
      { accion: "Regar", detalle: "Protege del hielo: no riegues al atardecer." },
    ],
    [],
    [
      { accion: "Fertilizar", detalle: "Composta al descongelarse el suelo." },
    ],
    [
      { accion: "Fertilizar", detalle: "Fertilizante de liberación lenta en primavera." },
    ],
    [],
    [
      { accion: "Regar", detalle: "Riego moderado en el corto verano." },
    ],
  ],
};

export const ZONAS_EXTRA: Record<string, string[]> = {
  "Norte Grande": ["Zona desértica", "Temperaturas extremas"],
  Altiplano: ["Zona de altura", "Heladas nocturnas"],
  "Norte Chico": ["Zona semiárida", "Baja precipitación"],
  "Costa Central": ["Mediterráneo costero", "Neblina y brisa"],
  "Valle Central": ["Mediterráneo continental", "Estaciones marcadas"],
  "Valle Cordillerano": ["Mediterráneo de altura", "Heladas tardías"],
  "Costa Sur": ["Húmedo templado", "Lluvias de invierno"],
  "Zona Sur": ["Templado lluvioso", "Alta precipitación"],
  Patagonia: ["Frío extremo", "Vientos y escarcha"],
};