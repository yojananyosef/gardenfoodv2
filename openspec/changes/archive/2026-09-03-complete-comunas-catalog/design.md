# Design — complete-comunas-catalog

## Fuente de datos

- **Oficial primario**: PDF "DIVISIÓN POLÍTICO ADMINISTRATIVA DE CHILE — REGIONES, PROVINCIAS, COMUNAS" (SUBDERE, `subdere.gov.cl`), extraído con `pdftotext` y corregido a la estructura vigente (el PDF es de 2008 con 15 regiones: la provincia Ñuble se extrae como región propia desde 2018, ya presente en el catálogo).
- **Validación cruzada**: BCN "Nuestro País" (56 provincias / 346 comunas) e INE; conteos por región verificados: 4+7+9+9+15+38+52+33+30+21+33+32+12+30+10+11 = 346.
- **Correcciones al PDF**: `San José de Maipú→San José de Maipo` (errata), `Joaquín→San Joaquín` (clipping de pdftotext), `Los Alamos→Los Álamos`, `Tiltil→Til Til`, `Llaillay→Llay-Llay`, `Paiguano→Paihuano`, `Marchihue→Marchigüe`, `Coihaique→Coyhaique`, `Aisén→Aysén`, `Natales→Puerto Natales` (se conserva el nombre ya en el catálogo para no romper perfiles almacenados con `buscarComuna`).

## Asignación de zonaId para las 101 nuevas

Cada comuna nueva hereda la zona agroclimática canónica por contigüidad geográfica con las comunas ya mapeadas de su entorno:

| Comunas nuevas | Zona | Criterio |
|---|---|---|
| Putre, General Lagos | 1 Arica-Azapa | extremo norte (el legacy no modela altiplano aparte) |
| Caldera, Chañaral, Diego de Almagro | 2 Copiapó Valle | todo Atacama ya era Z2 |
| Concón, Juan Fernández, Isla de Pascua, Puchuncaví, Quintero, Algarrobo, Cartagena, El Quisco, El Tabo, Santo Domingo | 5 Valparaíso-Quillota | costa central (igual que San Antonio/Papudo/Zapallar) |
| 23 urbanas de Santiago | 8 Santiago Sur-Buin | urbano (igual que Santiago/Providencia/La Reina) |
| Mostazal, Pichidegua, Chépica, Palmilla, Peralillo, Placilla | 10 Rancagua-Cachapoal | valle VI |
| Lolol, Pumanque | 11 Pichilemu Costa | secano costero Colchagua |
| Empedrado, Pencahue, Chanco, Pelluhue | 14 Talca-Linares | costa/interior VII sur (igual que Curepto/Cauquenes) |
| Florida, Santa Juana, Negrete, Quilaco, Alto Biobío | 16 Los Ángeles Interior | interior VIII |
| Talcahuano, Hualpén, Contulmo, Curanilahue, Los Álamos, Tirúa | 17 Concepción Costa | costa VIII (igual que Coronel/Lebu/Cañete) |
| 17 de Araucanía | 18 Temuco-Araucanía | todo IX ya era Z18 |
| Corral, Mariquina, Panguipulli | 19 Valdivia-Los Ríos | XIV |
| 20 de Los Lagos (Llanquihue/Chiloé/Osorno/Palena) | 20 Osorno-Los Lagos | X..Patagonia ya era Z20 |

## Derivación en vez de duplicación

- `COMUNAS_ZONA` = `Object.fromEntries(COMUNAS.map(...))` — elimina el segundo literal de 245 entradas (líneas 272-982 de `zonas.ts`) y evita drift futuro.
- `lib/landing/zonas.ts`: `REGIONES` se deriva agrupando `COMUNAS` por región (orden oficial norte→sur); `zonaLandingDe(zonaId, region)` mapea las 20 zonas canónicas a las 9 groseras del landing (los únicos cortes: Z2 → Norte Grande/Norte Chico según región; Z20 → Zona Sur/Patagonia según región). Las tablas de tareas por mes (`ZONAS`) y `ZONAS_EXTRA` se conservan intactas.
- Bundle del landing: +~10 KB de strings de comunas (registro ya importaba el catálogo completo).

## Tests

- `tests/agronomy.test.ts`: 245→346 en ambas aserciones (COMUNAS y COMUNAS_ZONA).
- Verificación estructural ya cubierta por el assert del script generador: cada región con su conteo oficial exacto y cero duplicados normalizados.
