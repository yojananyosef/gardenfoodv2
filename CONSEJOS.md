# Consejos de cultivo — los dos juegos y qué hacer con cada uno

> Generado con `scripts/generar_informe_consejos.mjs`. Los números salen de la base
> y del archivo `consejos.ts`.

## El resumen que decide

| | Base (`fact_consejos`) | Legacy (`consejos.ts`) |
|---|---|---|
| Consejos | **211** | **154** |
| Especies | 30 | 30 |
| **Es el otro un superconjunto?** | **No** | **No** |

**Los dos juegos tienen casi todo en común y a la vez le faltan cosas.** Eso es
lo que hace que la decisión no sea "migrar el mejor":

| Relación | Cuántos | Qué significa |
|---|---|---|
| **Idéntico** | **3** | El legacy tiene el mismo texto, palabra por palabra |
| **Mismo consejo, otras palabras** | **41** | Varios son al 100% de parecido |
| **Solo en la base** | **167** | La base aporta 167 consejos que el legacy no tiene |
| **Solo en el legacy** | **110** | **El legacy tiene 110 que la base no tiene** |

**Ese último número es el que cuesta.** Si se migra a la base, **110 consejos
desaparecen** del catálogo. No son variantes: son consejos sobre cosas que la
base no menciona.

## Cómo usar la tabla

Cada fila es un consejo de la base con dos casillas:

- **SÍ** → pasa a la app
- **NO** → no pasa

La columna final trae el consejo del legacy al que **reemplaza**, para no tener
que abrir los dos archivos. Y bajo cada especie están los consejos del legacy
que **no tienen equivalente**, que son los que se perderían.

## El desglose

### Almendro — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | El almendro florece MUY TEMPRANO (agosto): si su zona tiene heladas en agosto-septiembre, plante Guara o Tuono (floración tardía). | parecido 77% | Florece en agosto: si su zona tiene heladas en ago-sep, plante Guara o Tuono (floración tardía). |
| sí | no | Variedad Guara es autofértil: no necesita polinizador, ideal para jardines. | parecido 70% | Guara es AUTOFÉRTIL: no necesita polinizador. Ideal para jardines con un solo árbol. |
| sí | no | El almendro tolera la sequía mejor que casi cualquier frutal: ideal para zonas secas. | nuevo | — |
| sí | no | Floración del almendro es espectacular: blanca masiva, muy ornamental. | parecido 71% | La floración del almendro (agosto) es espectacular: blanca y masiva. |
| sí | no | Si las almendras están vacías: faltó polinización o agua. | nuevo | — |
| sí | no | Almendras amargas SON TÓXICAS (contienen cianuro): no confundir variedades. | nuevo | — |
| sí | no | Almendro no tolera suelos encharcados: se muere rápido. | nuevo | — |
| sí | no | Un almendro productivo necesita verano caluroso y seco. | nuevo | — |

> **2 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Tolera SEQUÍA mejor que casi cualquier frutal: adaptado al mediterráneo seco."
> - "Almendras AMARGAS son TÓXICAS (amigdalina → cianuro): comprar SOLO en viveros certificados."

---

### Arándano — base 8 · legacy 6

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | pH ÁCIDO es la regla N°1: sin suelo ácido (4.5-5.5) el arándano MUERE. Mida pH antes de plantar. | nuevo | — |
| sí | no | NUNCA use cal, ceniza, guano de gallina o estiércol fresco: suben pH y matan al arándano. | parecido 70% | NUNCA aplicar cal, ceniza ni guano de gallina: suben el pH y matan al arándano. |
| sí | no | Use mulch ácido siempre: aserrín de pino, corteza de pino, hojas de pino. | parecido 45% | Mulch ácido PERMANENTE: aserrín o corteza de pino. Descomponiéndose mantiene el pH bajo. |
| sí | no | Plante 2+ variedades: mejor polinización = frutos más grandes. | nuevo | — |
| sí | no | Riego FRECUENTE pero POCO: raíces superficiales se secan rápido. | nuevo | — |
| sí | no | El arándano congelado es excelente: congele el exceso de cosecha. | nuevo | — |
| sí | no | Drosophila suzukii es la nueva plaga devastadora: trampas de vinagre de manzana. | nuevo | — |
| sí | no | En macetón con sustrato ácido funciona perfecto para patios y terrazas. | nuevo | — |

> **4 del legacy sin equivalente en la base** (se pierden si se migra):
> - "pH ÁCIDO 4.5-5.5 es la REGLA N°1. Un arándano en suelo neutro o alcalino no produce."
> - "En Ñuble: cosecha de diciembre a inicios de marzo. NO esperar mayo."
> - "Plantar 2+ variedades para polinización cruzada y mayor rendimiento."
> - "Drosophila suzukii: instalar trampas de vinagre de manzana desde noviembre (INIA)."

---

### Avellano — base 5 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Necesita bastante espacio: no es ideal para patios pequeños, mejor en parcela | nuevo | — |
| sí | no | Florece en pleno invierno (jul-ago): elige un sitio protegido de heladas fuertes | nuevo | — |
| sí | no | Planta al menos 2 variedades para asegurar buena polinización cruzada | nuevo | — |
| sí | no | Chile es el principal productor mundial fuera del hemisferio norte (polo Biobío-Araucanía) | nuevo | — |
| sí | no | Nunca lo plantes en suelo calcáreo o de mal drenaje: es muy sensible a asfixia radicular | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Chile produce avellanas de alta calidad: Biobío y Araucanía concentran el 90% de la producción."
> - "NECESITA polinizador: plantar Daviana + Tonda Romana es la combinación clásica."
> - "El avellano se poliniza por viento: plantar 2+ variedades en radio de 50 metros."
> - "Cosecha fácil: los frutos caen solos. Usar malla bajo el árbol y recoger cada 2-3 días."
> - "Secar bien antes de guardar: con humedad se enmohece. Límite máximo 6% de humedad."

---

### Caqui — base 8 · legacy 6

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | HAY DOS TIPOS de caqui: Fuyu (se come duro como manzana) y Hachiya (se come blando como gelatina). PREGUNTE en vivero. | parecido 77% | HAY DOS TIPOS: Fuyu (comer DURO, como manzana) y Hachiya (comer BLANDO, como gelatina). Pregunte en vivero. |
| sí | no | Si come un Hachiya antes de madurar: la boca se le pega (astringente). ESPERE a que esté blando. | nuevo | — |
| sí | no | Para quitar astringencia rápido: ponga los caquis en una bolsa con manzanas o bananas maduras. | nuevo | — |
| sí | no | Caqui brota MUY TARDE: no se preocupe si en septiembre aún parece muerto. | parecido 60% | Caqui brota MUY TARDE (octubre): si en septiembre parece muerto, es normal. No lo arranque. |
| sí | no | Es muy ornamental en otoño: hojas rojas espectaculares. | parecido 71% | Muy ornamental en otoño: hojas rojas espectaculares antes de caer. |
| sí | no | Madera frágil: ralee frutos para evitar quiebre de ramas. | nuevo | — |
| sí | no | Tolera variedad de climas: desde frío hasta subtropical. | nuevo | — |
| sí | no | Caqui deshidratado (Hoshigaki) es una delicatessen japonesa. | parecido 63% | Caqui deshidratado (Hoshigaki): delicatessen japonesa, se masajea diariamente 4-6 semanas. |

> **2 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Truco para madurar Hachiya rápido: poner con manzanas o bananas en bolsa cerrada (gas etileno)."
> - "Tolera -15°C en reposo: se puede plantar en zonas bastante frías."

---

### Cerezo — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | El cerezo es exigente: NO lo plante en suelos pesados o con agua estancada (se muere en 2 años). | nuevo | — |
| sí | no | Variedades autofértiles (Lapins, Stella) son ideales si tiene espacio para un solo árbol. | nuevo | — |
| sí | no | Mallas anti-pájaros: invierta en buenas mallas, sin ellas perderá 50-80% de la cosecha. | nuevo | — |
| sí | no | La partidura por lluvia es el mayor problema: aplique calcio foliar y cubra con plástico si llueve cerca de cosecha. | nuevo | — |
| sí | no | Poda en VERANO post-cosecha es mejor que en invierno: menos riesgo de cancrosis bacteriana. | nuevo | — |
| sí | no | Cerezo en injerto enano (Gisela) cabe en patios y produce en 3 años. | nuevo | — |
| sí | no | Coseche en la mañana fresca, las cerezas duran más. | nuevo | — |
| sí | no | Si las cerezas saben amargas: faltó agua durante el crecimiento o le falta sol. | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Poda verde post-cosecha (dic-ene) es preferible a la poda invernal: cicatriza más rápido (INIA Quilamapu)."
> - "Calcio foliar (CaCl₂ 0.5%) cada 10-15 días desde cuaja: PREVIENE la partidura por lluvia."
> - "Mallas antipájaros obligatorias: sin ellas pierde el 50-80% de la cosecha."
> - "Cosechar SIEMPRE con el cabito (pedúnculo): sin él la cereza dura solo 1 día."
> - "En Ñuble y zonas sur, la cosecha es 2-3 semanas más tarde que en O'Higgins."

---

### Chirimoya — base 5 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | La polinización manual con pincel es casi obligatoria para buena producción | nuevo | — |
| sí | no | Solo apto en la franja costera libre de heladas (Coquimbo-Valparaíso) | nuevo | — |
| sí | no | Protege el tronco joven de sol y viento los primeros años | nuevo | — |
| sí | no | Es de las especies más exigentes del catálogo: reserva para huertos con experiencia previa | nuevo | — |
| sí | no | El polo productivo nacional está en La Serena-Ovalle-Quillota | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Chile es el mayor productor mundial: La Serena, Ovalle y Quillota concentran la producción."
> - "Polinización manual con pincel en la mañana: multiplica la cuaja por 3-4 veces."
> - "NO tolera heladas: -2°C ya daña ramas. Buscar microclima costero protegido."
> - "Fruto maduro = pulpa cremosa blanca con sabor a vainilla-piña. Comerlo con cuchara."
> - "La chirimoya es autoincompatible: la flor no puede fecundarse con su propio polen."

---

### Ciruelo — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Las ciruelas japonesas (Santa Rosa, Black Amber) son más fáciles que las europeas (D'Agen). | nuevo | — |
| sí | no | Si planta para deshidratar, elija D'Agen: es la mejor del mundo para ciruela seca. | parecido 50% | D'Agen es la mejor ciruela del mundo para deshidratar: alta en azúcar y pectina. |
| sí | no | Algunas variedades necesitan polinizador: pregunte en el vivero antes de comprar. | nuevo | — |
| sí | no | El ciruelo es generoso: una vez establecido, produce mucho con poco cuidado. | nuevo | — |
| sí | no | No deje frutos en el árbol después de cosecha: atraen mosca y monilia. | nuevo | — |
| sí | no | Si las ramas se quiebran de tantos frutos, ralee más fuerte el próximo año. | nuevo | — |
| sí | no | Pinte el tronco con cal en invierno: previene grietas por sol y entrada de plagas. | nuevo | — |
| sí | no | Las ciruelas caídas al suelo son ideales para hacer mermelada (si están sanas). | nuevo | — |

> **4 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Ciruelo japonés (Santa Rosa, Angeleno) necesita menos frío que el europeo (D'Agen): más adaptable en zona central."
> - "Verificar en vivero si la variedad necesita polinizador: muchas lo requieren."
> - "Pintar tronco con cal + cobre en invierno: previene hongos y quemaduras solares."
> - "Sellar TODOS los cortes de poda: la enfermedad del Plateado (Chondrostereum) entra por heridas."

---

### Damasco — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | El damasco florece MUY temprano (agosto): si vive en zona con heladas tardías, plante variedades como Goldcot que florecen más tarde. | nuevo | — |
| sí | no | Para protegerlo de heladas: pinte tronco de blanco, ponga bidones de agua bajo el árbol, use riego por aspersión durante la helada. | nuevo | — |
| sí | no | Damasco es de vida más corta que otros frutales: 20-25 años máximo. | nuevo | — |
| sí | no | Si el árbol no produce: probablemente la flor se quemó por helada, no es problema del árbol. | nuevo | — |
| sí | no | Variedad Tilton es muy productiva y aguanta heladas mejor. | nuevo | — |
| sí | no | Damasco deshidratado al sol es delicia: cosechar maduros y secar en mallas con sol y aire. | nuevo | — |
| sí | no | El carozo (cuesco) del damasco contiene ALMENDRA AMARGA con cianuro: NO comer. | parecido 60% | El carozo del damasco contiene amigdalina (cianuro): NO comer la almendra interior. |
| sí | no | Los damascos caídos son ideales para mermelada y compota. | nuevo | — |

> **4 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Florece en agosto: mayor riesgo de helada tardía de todos los frutales. Use Tilton o Goldcot en zonas con heladas."
> - "Para proteger de heladas: bidones de agua negros bajo la copa liberan calor de noche."
> - "Damasco deshidratado al sol (orejones): la concentración de azúcar se multiplica por 4."
> - "Variedad Tilton: más productiva Y tolerante a heladas. La más plantada en Chile."

---

### Duraznero — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | El durazno produce en ramas del año anterior: SIEMPRE necesita poda anual. | nuevo | — |
| sí | no | Pinte el tronco con cal blanca en invierno: protege del sol fuerte y de bichos que entran por la corteza. | nuevo | — |
| sí | no | Coloque mulch (paja, hojas secas) bajo el árbol: ahorra agua y mejora el suelo. | nuevo | — |
| sí | no | Si las hojas se ven amarillas con venas verdes: falta hierro. Aplique sulfato ferroso. | nuevo | — |
| sí | no | Riego por goteo es ideal: ahorra 50% de agua y evita enfermedades. | nuevo | — |
| sí | no | Plante caléndulas y albahaca alrededor: alejan plagas naturalmente. | nuevo | — |
| sí | no | Si nunca floreció: probablemente no le dieron suficientes horas de frío en invierno. | nuevo | — |
| sí | no | Después de cada cosecha, agradezca al árbol con compost: es como una buena comida después de un esfuerzo. | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Poda ANUAL obligatoria en junio-julio: el durazno produce en madera del año anterior (Bol. INIA 373)."
> - "Cloca (Taphrina deformans): aplicar cobre ANTES de brotación (julio-agosto). Después ya no tiene solución."
> - "Raleo de frutos en noviembre es tan importante como la poda: sin raleo, frutos chicos y alternancia."
> - "Pintar tronco con cal blanca + cobre en invierno: refleja el sol, previene hongos."
> - "Riego por goteo ahorra 50% agua. Mulch de 10-15 cm bajo la copa conserva humedad."

---

### Frambuesa — base 5 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Elige variedades remontantes (ej. Heritage) si quieres poda simple: corte total anual | nuevo | — |
| sí | no | El tutorado no es opcional: sin él, la cosecha se pierde en el suelo | nuevo | — |
| sí | no | En maceta grande (40-50 L) también produce bien, ideal para patios chicos | nuevo | — |
| sí | no | Riego por goteo evita mojar el fruto y reduce Botrytis en cosecha | nuevo | — |
| sí | no | Cosecha frecuente evita que el fruto sobremadure y atraiga Drosophila | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Variedades remontantes (Heritage, Autumn Bliss): poda TOTAL en invierno. Sin complejidad."
> - "Chile es el 2.° exportador mundial: Biobío y Araucanía son las zonas de mayor volumen."
> - "Drosophila suzukii (mosca del vinagre): trampa de vinagre + detergente desde noviembre."
> - "La frambuesa necesita FRÍO para rendir bien: veranos frescos del sur son su hábitat ideal."
> - "Tutores o espaldera obligatorios: sin soporte los cañones caen y el fruto se pudre."

---

### Frutilla — base 5 · legacy 6

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Renueva las plantas cada 2-3 años: el rendimiento baja notoriamente después | parecido 78% | Renueva las plantas cada 2-3 años: el rendimiento cae notoriamente después de la 3.ª temporada. |
| sí | no | El mulch (paja o film plástico) es la diferencia entre fruta limpia y fruta podrida | parecido 58% | Mulch permanente (paja, film negro): la diferencia entre frutilla limpia y frutilla podrida. |
| sí | no | Riego por goteo, nunca por aspersión sobre el follaje: reduce Botrytis drásticamente | parecido 100% | Riego por goteo, NUNCA aspersión sobre el follaje: reduce Botrytis drásticamente. |
| sí | no | En maceta o jardinera colgante funciona igual de bien que en el suelo | nuevo | — |
| sí | no | Cosecha frecuente (cada 2-3 días) estimula la formación de más flores | parecido 88% | Cosechar CADA 2-3 días: la cosecha frecuente estimula la formación de más flores. |

> **2 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Deshija los estolones en plena temporada: si los dejas todos, el fruto sale chico."
> - "Funciona perfectamente en maceta colgante o jardinera: ideal para balcón."

---

### Granado — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | El granado es RESISTENTE: tolera sequía, salinidad, suelos pobres, calor extremo. | nuevo | — |
| sí | no | El rajado es el mayor problema: riegue PAREJO sin altibajos (sequía → lluvia = rajado). | nuevo | — |
| sí | no | Las flores rojas son espectaculares: es ornamental y productivo. | **EXACTO** · reemplaza al legacy | Las flores rojas son espectaculares: es ornamental Y productivo. |
| sí | no | Quite los hijuelos de la base cada invierno: si no, se vuelve arbusto desordenado. | parecido 45% | Quitar hijuelos de la base CADA INVIERNO: si no, se vuelve matorral improductivo. |
| sí | no | Para sacar los granos fácil: corte la corona, haga cortes superficiales, sumérjalo en agua y separe. | nuevo | — |
| sí | no | Granada dura MESES entera en refrigerador: cosecha y guarde. | nuevo | — |
| sí | no | Variedad Wonderful: la más plantada del mundo, excelente calidad. | nuevo | — |
| sí | no | El jugo de granada es un superalimento: antioxidantes potentísimos. | nuevo | — |

> **3 del legacy sin equivalente en la base** (se pierden si se migra):
> - "RAJADO = RIEGO IRREGULAR. La regla N°1 del granado: regar PAREJO, nunca seco y después inundar."
> - "Wonderful: la variedad más plantada del mundo. Granos grandes, rojos, dulces."
> - "Jugo de granada: altísimo en antocianinas (antioxidantes potentes)."

---

### Higuera — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Higuera es probablemente el frutal MÁS FÁCIL del mundo: crece casi sin cuidado. | nuevo | — |
| sí | no | Produce en 1-2 años: rápida gratificación. | parecido 100% | Produce en 1-2 años: gratificación rápida. |
| sí | no | Algunas variedades dan DOS cosechas: brevas (diciembre) e higos (febrero-marzo). | parecido 55% | Brown Turkey y Kadota dan DOS cosechas: brevas (diciembre) e higos (febrero-marzo). |
| sí | no | El higo fresco no dura: coma rápido o deshidrate al sol. | nuevo | — |
| sí | no | El látex blanco de la higuera IRRITA la piel: use guantes al cosechar y podar. | parecido 75% | El látex IRRITA la piel: use guantes al cosechar y podar. |
| sí | no | Higuera tolera suelos pésimos, sequía y abandono. | nuevo | — |
| sí | no | Si quiere higos más grandes: riegue en crecimiento y pode despuntando. | nuevo | — |
| sí | no | Higuera en macetón funciona bien: controla el tamaño y puede moverla. | nuevo | — |

> **2 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Probablemente el frutal MÁS FÁCIL del mundo: crece en suelos pésimos, poca agua, abandono."
> - "El higo fresco NO dura: comerlo rápido, deshidratar al sol o congelar. No es como manzana."

---

### Kiwi — base 5 · legacy 6

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Necesitas una planta macho por cada 5-8 hembras (o un injerto mixto) para que haya polinización | nuevo | — |
| sí | no | Instala una estructura de parrón o pérgola resistente antes de plantar, no después | nuevo | — |
| sí | no | El Psa (cancro bacteriano) es el riesgo mayor: compra siempre plantas certificadas libres de Psa | nuevo | — |
| sí | no | Se cosecha firme y se deja madurar junto a una manzana (acelera maduración por etileno) | parecido 46% | Cosechar firme en abril y dejar madurar en casa con una manzana (etileno acelera maduración). |
| sí | no | Excelente para cubrir una pérgola de patio: da sombra en verano y fruta en otoño | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "NECESITA planta macho: 1 macho por 6-8 hembras. Sin macho no hay fruto. La planta más olvidada."
> - "Hayward: variedad femenina estándar. Matua o Tomuri: masculinas que la acompañan."
> - "Chile es el 3.° exportador mundial: Talca y Curicó concentran el grueso de la producción."
> - "Psa (Pseudomonas): la enfermedad más destructiva del kiwi. Sin síntoma claro al inicio: vigilar."
> - "La poda de invierno es INTENSA: hasta 70% de la madera se elimina. No tengas miedo."

---

### Limonero — base 8 · legacy 6

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Limonero es PERFECTO para principiantes: produce mucho, vive muchos años, requiere poco cuidado. | nuevo | — |
| sí | no | NO PLANTE en zonas con heladas fuertes: -3°C lo daña, -5°C lo mata. | nuevo | — |
| sí | no | Si vive en zona fría, plántelo en macetón grande y guárdelo en invierno. | nuevo | — |
| sí | no | Cochinilla es la peor plaga: aplique aceite mineral mensual. | nuevo | — |
| sí | no | Si las hojas se ven amarillas con venas verdes: falta hierro. Aplique sulfato ferroso. | nuevo | — |
| sí | no | Pinte el tronco con cal blanca: protege del sol fuerte. | nuevo | — |
| sí | no | Limonero es siempre verde: las hojas son la 'fábrica' del árbol, NO se las saque. | nuevo | — |
| sí | no | Variedad Meyer es semi-dulce, ideal para postres. | parecido 55% | Variedad Meyer: semi-dulce, tolera -4°C, ideal para zona central protegida. |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Limonero perfecto para principiantes: produce mucho, durante años. NO en zonas con heladas fuertes (-3°C lo mata)."
> - "Cochinilla = enemigo principal: aceite mineral mensual. El aceite ahoga a la cochinilla tapando sus poros (Bol. INIA 282)."
> - "Hojas amarillas con venas verdes (clorosis): no es falta de hierro, es pH alto. Aplicar quelato EDDHA."
> - "NUNCA regar el tronco: Phytophthora (gomosis) entra por la corteza húmeda. Goteo a 30 cm del tronco."
> - "Si bota hojas = ALERTA: algo está muy mal (raíz, frío, sequía extrema)."

---

### Lúcuma — base 5 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Fruto emblemático andino, muy apreciado en repostería (helados, tortas) | nuevo | — |
| sí | no | Árbol grande: solo para patios amplios o parcelas, no apto para espacios reducidos | nuevo | — |
| sí | no | Solo viable en la franja costera libre de heladas de Coquimbo-Valparaíso | nuevo | — |
| sí | no | Se cosecha firme (como palta) y madura fuera del árbol en unos días | nuevo | — |
| sí | no | Muy tolerante a sequía una vez establecida, pero crece más rápido con riego regular | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Fruto andino único: pulpa seca, harinosa, sabor a caramelo-maple. No tiene par en el mundo."
> - "La lúcuma chilena (variedad Seda) es la referencia mundial de sabor."
> - "NO tolera heladas: temperatura mínima -1°C ya daña la planta. Solo costa norte-centro."
> - "Árbol de LARGO plazo: primera cosecha a los 4-5 años. Vive y produce por décadas."
> - "La pulpa deshidratada en polvo es el producto con mayor valor comercial."

---

### Mandarino — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Mandarino es perfecto para patios chicos: árbol pequeño, productivo, fruta deliciosa. | nuevo | — |
| sí | no | Variedad Clemenules: la mejor sin semillas, fácil de pelar. | parecido 50% | Clemenules: sin semillas, fácil de pelar, la más popular de Chile. |
| sí | no | Resiste mejor el frío que naranjo: hasta -4°C en reposo. | nuevo | — |
| sí | no | Las mandarinas se cosechan ANTES que las naranjas: cosecha temprana. | nuevo | — |
| sí | no | Si las mandarinas se rajan en el árbol: exceso de agua tras sequía. Riegue parejo. | nuevo | — |
| sí | no | Cochinilla y pulgón son las plagas principales: aceite mineral mensual. | nuevo | — |
| sí | no | Los frutos pueden quedarse semanas en el árbol sin perder calidad. | nuevo | — |
| sí | no | Pinte tronco con cal blanca. | nuevo | — |

> **4 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Árbol compacto (3-5 m): ideal para patios y espacios reducidos."
> - "Más resistente al frío que el naranjo (-4°C vs -2°C): mejor opción en zona central."
> - "Si las mandarinas se rajan: RIEGO IRREGULAR. Regar parejo sin altibajos seco→mojado."
> - "Trips en floración: deja cicatrices plateadas en la fruta (daño estético, no sanitario)."

---

### Manzano — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Manzano necesita polinizador: si tiene espacio, plante 2 variedades distintas que florezcan a la vez. | nuevo | — |
| sí | no | Variedades enanas (M9, M27) caben en patios chicos y producen rápido (2-3 años). | parecido 78% | Variedades enanas (portainjerto M9) producen en 2-3 años y caben en patios chicos. |
| sí | no | Calcio foliar mensual desde noviembre: PREVIENE Bitter Pit (manchas marrones que arruinan la fruta guardada). | parecido 57% | Calcio foliar MENSUAL (noviembre a febrero) previene el Bitter Pit (manchas marrones en poscosecha). |
| sí | no | Carpocapsa es la peor plaga: sin trampas y manejo, perderá 50-80% de cosecha. | nuevo | — |
| sí | no | La manzana mejora su sabor unas semanas después de cosechada (en frío). | parecido 70% | La manzana mejora sabor semanas después de cosechada: almidón → azúcar en el frío. |
| sí | no | Si nunca floreció: puede faltar frío invernal, polinizador, o fertilizar de más con nitrógeno. | nuevo | — |
| sí | no | Pinte tronco con cal blanca en invierno. | nuevo | — |
| sí | no | Manzano es generoso: una vez establecido, dura décadas produciendo. | nuevo | — |

> **2 del legacy sin equivalente en la base** (se pierden si se migra):
> - "NECESITA POLINIZADOR: plante 2+ variedades que florezcan al mismo tiempo. Gala + Fuji es combinación clásica."
> - "Carpocapsa (gusano de la manzana): enemigo N°1. Trampas de feromona desde octubre obligatorias."

---

### Membrillo — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Membrillo es uno de los frutales MÁS FÁCILES: tolerante, generoso, requiere mínimo cuidado. | nuevo | — |
| sí | no | NO se come crudo: es duro y áspero. Se usa para mermelada, dulce de membrillo, jalea, codoñate. | nuevo | — |
| sí | no | El aroma del membrillo perfuma toda la casa: ponga frutos maduros en un canasto. | nuevo | — |
| sí | no | Es autofértil: con un solo árbol tendrá producción. | nuevo | — |
| sí | no | Tolera suelos pesados y húmedos mejor que otros frutales. | nuevo | — |
| sí | no | Florece muy bonito en primavera: es ornamental y productivo. | nuevo | — |
| sí | no | Si las hojas se ven con manchas oscuras: aplicar caldo bordelés. | nuevo | — |
| sí | no | Una vez establecido, vive 50+ años con muy poco cuidado. | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Probablemente el frutal MÁS FÁCIL: tolera sequía, suelos pobres y casi cualquier condición."
> - "NO se come crudo: los taninos se descomponen con el calor de la cocción (mermelada, dulce)."
> - "El aroma del membrillo perfuma toda la casa: úselo como ambientador natural."
> - "Es AUTOFÉRTIL: un solo árbol produce abundantemente sin necesitar otro."
> - "Vive 50+ años con casi cero cuidados. El dulce de membrillo casero tiene alto valor."

---

### Mora — base 5 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Elige siempre variedades sin espina para patio (ej. Thornfree) | nuevo | — |
| sí | no | Instala una espaldera firme desde el inicio: el vigor de la planta la supera rápido si no | nuevo | — |
| sí | no | Es la baya más productiva y de menor exigencia de cuidados del catálogo | nuevo | — |
| sí | no | Mantén distancia de otros cultivos: sus raíces y brotes son muy invasivos | nuevo | — |
| sí | no | Cosecha apenas madura: el fruto pasado atrae mosca de la fruta | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "El frutal más RÚSTICO de todos: tolera suelos pobres, sequía moderada y abandono relativo."
> - "Elige Thornfree o Triple Crown: sin espinas, se trabaja cómodo y rinde igual."
> - "Fruto negro BRILLANTE = listo. Negro OPACO = se pasó. Cosechar diariamente en temporada."
> - "Vigila Drosophila suzukii igual que en frambuesa: trampa de vinagre desde noviembre."
> - "Una planta adulta rinde 3-5 kg/año con mínimo manejo. Productividad muy alta para el esfuerzo."

---

### Naranjo — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Naranjo es ideal para zona templada-cálida. NO en zonas con heladas fuertes. | nuevo | — |
| sí | no | La flor del naranjo (azahar) perfuma todo el jardín en primavera. | **EXACTO** · reemplaza al legacy | La flor del naranjo (azahar) perfuma todo el jardín en primavera. |
| sí | no | Variedad Washington Navel: la mejor de mesa, sin pepas, dulce. | nuevo | — |
| sí | no | Variedad Valencia: ideal para jugo, madura en verano. | nuevo | — |
| sí | no | La naranja puede quedarse en el árbol semanas: cosecha gradual. | parecido 56% | La naranja puede quedarse semanas en el árbol sin perder calidad. |
| sí | no | Cochinilla es enemigo principal: aceite mineral mensual. | nuevo | — |
| sí | no | Pinte el tronco con cal blanca: previene grietas por sol. | nuevo | — |
| sí | no | Si las hojas se ven amarillas con venas verdes: falta hierro. | nuevo | — |

> **3 del legacy sin equivalente en la base** (se pierden si se migra):
> - "W. Navel: mejor para mesa, sin pepas. Valencia: mejor para jugo (cosecha tardía ago-oct)."
> - "El color naranja se desarrolla con frío nocturno: en zonas calurosas puede madurar pero quedar verde."
> - "Más sensible al frío que el limonero: -2°C ya produce daño. Proteger de heladas."

---

### Nectarino — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | El nectarino es un durazno sin pelusa: se cuida igual que el durazno. | nuevo | — |
| sí | no | Es más sensible a la cloca que el durazno: aplique cobre preventivo en julio-agosto. | parecido 78% | Más sensible a cloca que el durazno: cobre preventivo en julio-agosto es OBLIGATORIO. |
| sí | no | Variedades de pulpa amarilla son más aromáticas; las blancas son más dulces. | nuevo | — |
| sí | no | Pinte el tronco con cal blanca en invierno. | nuevo | — |
| sí | no | Coloque mulch (paja) bajo el árbol: ahorra agua y mejora suelo. | nuevo | — |
| sí | no | Riego por goteo es ideal. | nuevo | — |
| sí | no | Ralee bien: nectarino tiene tendencia a producir mucho fruto pequeño. | nuevo | — |
| sí | no | Cosechar 1-2 días antes de madurar completo: aguantan más en mesa. | nuevo | — |

> **4 del legacy sin equivalente en la base** (se pierden si se migra):
> - "El nectarino ES un duraznero sin pelusa: todo el manejo del Bol. INIA 373 aplica."
> - "Piel lisa se daña más fácil: cosechar con cuidado y no apilar en el cajón."
> - "Raleo más intenso que en durazno: el mercado exige calibre grande."
> - "Fantasia y Independence: pulpa amarilla aromática. Arctic Star: pulpa blanca dulce."

---

### Nogal — base 8 · legacy 6

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Nogal necesita MUCHO espacio: 10 metros mínimo de otros árboles. NO lo plante cerca de la casa. | nuevo | — |
| sí | no | Boro y zinc son los micronutrientes más importantes: aplique foliar en octubre. | nuevo | — |
| sí | no | Chandler es la variedad más plantada del mundo: excelente calidad, producción alta. | nuevo | — |
| sí | no | Necesita polinizador: plante Chandler + Franquette o Serr para asegurar cosecha. | nuevo | — |
| sí | no | Seque las nueces bien antes de guardar: húmedas se enmohecen rápido. | nuevo | — |
| sí | no | Nogal produce juglona (sustancia tóxica): NO plante hortalizas bajo su copa. | parecido 70% | Nogal produce JUGLONA: NO plantar hortalizas bajo la copa (les es tóxica). |
| sí | no | Si la nuez está vacía o negra: faltó agua en enero-febrero. | parecido 80% | Si la nuez está vacía o negra: faltó agua en enero-febrero (etapa de llenado). |
| sí | no | Un nogal adulto puede producir 100+ años. Es una inversión para generaciones. | nuevo | — |

> **4 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Boro y zinc foliares en octubre = práctica MÁS IMPORTANTE para calidad de nuez (Bol. INIA 454)."
> - "NECESITA polinizador: Chandler necesita Franquette o Serr cerca. Verificar con el vivero."
> - "Secar bien antes de guardar: húmedas se enmohecen y producen aflatoxinas (tóxicas)."
> - "Árbol generacional: produce 100+ años. RM concentra 15.521 ha (ODEPA)."

---

### Níspero — base 5 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Es de los frutales más rústicos y fáciles del catálogo: casi no requiere manejo sanitario | nuevo | — |
| sí | no | Florece en invierno: en zonas con heladas fuertes elige un sitio protegido | nuevo | — |
| sí | no | También funciona como árbol ornamental de hoja perenne todo el año | parecido 45% | Árbol ornamental: hoja perenne grande y brillante, atractivo todo el año. |
| sí | no | Protege los frutos con malla si hay muchas aves en el sector | nuevo | — |
| sí | no | No apto para el sur de Chile: necesita clima mediterráneo sin heladas invernales severas | nuevo | — |

> **4 del legacy sin equivalente en la base** (se pierden si se migra):
> - "El PRIMER fruto del año: listo en agosto-octubre cuando casi no hay otra fruta fresca."
> - "La floración invernal (julio-agosto) es su talón de Aquiles: buscar ubicación protegida del frío."
> - "Autofértil: un solo árbol produce abundantemente sin necesitar otro."
> - "Níspero fresco no dura: consumir o procesar en mermelada en los primeros 3-5 días."

---

### Olivo — base 8 · legacy 7

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Olivo es para toda la vida: vive 100+ años, plante uno y sus nietos lo disfrutarán. | **EXACTO** · reemplaza al legacy | Olivo es para TODA LA VIDA: vive 100+ años. Plante uno y sus nietos lo disfrutarán. |
| sí | no | NUNCA plante donde antes hubo tomate, papa o pimiento: Verticilium mata el olivo. | parecido 64% | NUNCA plantar donde hubo tomate, papa, pimiento o berenjena: Verticilium del suelo mata al olivo. |
| sí | no | Boro foliar en floración es CRÍTICO: sin boro, la cuaja cae dramáticamente. | nuevo | — |
| sí | no | Olivo tiene vecería: un año produce mucho, al siguiente poco. La poda atenúa esto. | parecido 62% | Olivo tiene VECERÍA (alternancia): un año mucho, otro poco. Poda de aclareo atenúa esto. |
| sí | no | Para aceitunas de mesa: cosechar verdes y curar en salmuera (agua + sal + aromáticas). | parecido 64% | Para aceitunas de mesa: cosechar VERDES y curar en salmuera (8% sal + laurel) por 2-6 meses. |
| sí | no | Aceite de oliva casero: necesita prensa, pero es posible con aceitunas maduras. | parecido 50% | El aceite de oliva casero necesita 5-8 kg de aceitunas por litro. |
| sí | no | Arbequina es la mejor variedad para aceite en espacio pequeño: árbol chico, mucho aceite. | parecido 91% | Arbequina: mejor variedad para aceite en espacio pequeño. Árbol chico, mucho aceite, autofértil. |
| sí | no | Olivo tolera sequía, calor, suelos pobres: es uno de los frutales más resistentes del planeta. | nuevo | — |

> **1 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Boro foliar en floración (noviembre) = práctica MÁS IMPORTANTE para la cuaja."

---

### Palto — base 6 · legacy 0

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | El riesgo mayor no es la sequía: es el exceso de agua y el mal drenaje (Phytophthora cinnamomi) | nuevo | — |
| sí | no | Nunca plantes en un sitio donde se acumule agua después de llover | nuevo | — |
| sí | no | Protege el tronco joven del viento: la raíz superficial ancla poco al árbol | nuevo | — |
| sí | no | Es normal ver una floración masiva con muy poca fruta cuajada (0.1-0.3%): no indica un problema | nuevo | — |
| sí | no | Elige un sitio libre de heladas fuertes: el daño en flor ocurre ya a -1°C | nuevo | — |
| sí | no | Huerto adulto en plena producción: 12.000-13.000 m³ de agua/ha/año (Bol. INIA 160) | nuevo | — |

---

### Papayo chileno — base 5 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Es la especie de más rápida producción del catálogo: primeros frutos en 10-15 meses | nuevo | — |
| sí | no | Extremadamente sensible a heladas: solo para la franja costera libre de heladas (Coquimbo-Valparaíso) | nuevo | — |
| sí | no | Vida productiva corta (4-8 años): planifica renovación periódica | nuevo | — |
| sí | no | Protege del viento fuerte, su tallo es semi-herbáceo y frágil | nuevo | — |
| sí | no | Fruto nativo de Chile de alto potencial gastronómico y funcional (antioxidantes) | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Especie ÚNICA en el mundo: solo crece en Chile. Fruto en 8-12 meses desde semilla."
> - "Produce TODO EL AÑO en zonas sin heladas: sin pausa, sin estación seca."
> - "El virus de la mancha anular (PRSV) es incurable y se propaga por áfidos. Comprar solo plantas certificadas."
> - "La raíz NO tolera encharcamiento ni siquiera 48 horas: drenaje perfecto es obligatorio."
> - "Fruto inmaduro: se usa cocido como verdura. Maduro: dulce, suave, semillas negras."

---

### Peral — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | El peral se cosecha VERDE FIRME y madura en casa: no espere a que madure en el árbol. | nuevo | — |
| sí | no | Necesita polinizador: plante al menos 2 variedades distintas (ej: Packham's + Williams). | nuevo | — |
| sí | no | Fuego bacteriano es el peor enemigo: si ve brotes 'quemados', corte 30 cm más abajo y desinfecte tijera con alcohol entre cortes. | nuevo | — |
| sí | no | Variedades de pera asiática (Nashi) son crocantes y se cosechan maduras. | nuevo | — |
| sí | no | Carpocapsa también ataca peras: trampas desde octubre. | nuevo | — |
| sí | no | Peral es de vida muy larga: 50+ años produciendo. | nuevo | — |
| sí | no | Si las peras se ven con piel marrón rugosa (russet): es genético en algunas variedades, no es enfermedad. | nuevo | — |
| sí | no | Pinte el tronco con cal blanca en invierno. | nuevo | — |

> **5 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Cosechar VERDE FIRME y madurar en casa: en el árbol la pera se pone harinosa."
> - "NECESITA polinizador: Packham's + Williams es la combinación clásica."
> - "Fuego bacteriano (Erwinia): cortar 30 cm más abajo del síntoma y desinfectar la tijera ENTRE CADA CORTE."
> - "El peral vive 50+ años produciendo: es inversión de largo plazo."
> - "Pera asiática (Nashi) se cosecha MADURA del árbol (al revés de la europea): crocante como manzana."

---

### Pomelo — base 8 · legacy 5

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | Pomelo necesita ESPACIO: es de los cítricos más grandes (hasta 10 metros). | parecido 45% | Pomelo necesita MUCHO ESPACIO: hasta 6-10 metros. Plante lejos de construcciones. |
| sí | no | Mejor sabor en invierno: la fruta gana dulzor con el frío. | nuevo | — |
| sí | no | Variedad Star Ruby: rosada, dulce, sin pepas. Marsh: blanca, clásica. | nuevo | — |
| sí | no | Pomelo aguanta más tiempo en el árbol: cosecha gradual. | nuevo | — |
| sí | no | Si vive en zona muy cálida sin invierno: el sabor puede ser muy amargo. | nuevo | — |
| sí | no | ATENCIÓN: el pomelo interactúa con muchos medicamentos. Si toma medicación, consulte. | parecido 45% | ATENCIÓN MÉDICA: el pomelo interactúa con muchos medicamentos (estatinas, antihistamínicos). |
| sí | no | Cochinilla y aceite mineral son la pareja inseparable del cítrico. | nuevo | — |
| sí | no | Pomelo es generoso: una cosecha alimenta a muchos. | nuevo | — |

> **3 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Mejor sabor en INVIERNO: el frío reduce la naringina (amargo) y concentra azúcares."
> - "Star Ruby: rosado, dulce, sin pepas. Marsh: blanco, clásico."
> - "El pomelo puede quedarse meses en el árbol sin perder calidad."

---

### Vid — base 8 · legacy 6

| SÍ | NO | Consejo de la base | Estado | Consejo del legacy que reemplaza |
|---|---|---|---|---|
| sí | no | La vid NECESITA estructura: parrón, pérgola o espaldera. Sin soporte crece por el suelo. | nuevo | — |
| sí | no | Poda invernal es OBLIGATORIA cada año: sin poda no hay fruta de calidad. | parecido 67% | PODA INVERNAL OBLIGATORIA cada julio: sin poda, la vid no produce fruta de calidad (Bol. INIA 383). |
| sí | no | Oidio es la peor enfermedad: azufre preventivo cada 15 días desde brotación. | parecido 58% | Oidio = enemigo N°1: azufre preventivo cada 15 días desde brotación. Sin azufre, pierde la cosecha. |
| sí | no | SIEMPRE plante vid INJERTADA sobre portainjerto: protege de Filoxera (insecto de raíz). | parecido 55% | SIEMPRE plantar vid injertada sobre portainjerto americano: protege de Filoxera. |
| sí | no | Para uva más dulce: reduzca riego y racimos. | nuevo | — |
| sí | no | El parrón domiciliario es tradición chilena: sombra en verano + uva para la mesa. | parecido 75% | El parrón domiciliario da sombra en verano + uva para la mesa. |
| sí | no | Para hacer pasas: cosechar maduras y secar al sol 7-10 días. | nuevo | — |
| sí | no | Si quiere uva sin pepa: Crimson Seedless o Thompson. | nuevo | — |

> **2 del legacy sin equivalente en la base** (se pierden si se migra):
> - "Deshoje en enero: expone racimos a luz y aire → color, salud y calidad."
> - "Crimson Seedless o Thompson: uva sin pepa. País o Italia: clásico parrón chileno."

## Los 110 del legacy que la base no tiene

Estos son los que se pierden si se decide pasar a la base. Están agrupados por
especie para poder decidir si vale la pena recuperarlos.

**Almendro** (2)
- "Tolera SEQUÍA mejor que casi cualquier frutal: adaptado al mediterráneo seco."
- "Almendras AMARGAS son TÓXICAS (amigdalina → cianuro): comprar SOLO en viveros certificados."

**Arándano** (4)
- "pH ÁCIDO 4.5-5.5 es la REGLA N°1. Un arándano en suelo neutro o alcalino no produce."
- "En Ñuble: cosecha de diciembre a inicios de marzo. NO esperar mayo."
- "Plantar 2+ variedades para polinización cruzada y mayor rendimiento."
- "Drosophila suzukii: instalar trampas de vinagre de manzana desde noviembre (INIA)."

**Avellano** (5)
- "Chile produce avellanas de alta calidad: Biobío y Araucanía concentran el 90% de la producción."
- "NECESITA polinizador: plantar Daviana + Tonda Romana es la combinación clásica."
- "El avellano se poliniza por viento: plantar 2+ variedades en radio de 50 metros."
- "Cosecha fácil: los frutos caen solos. Usar malla bajo el árbol y recoger cada 2-3 días."
- "Secar bien antes de guardar: con humedad se enmohece. Límite máximo 6% de humedad."

**Caqui** (2)
- "Truco para madurar Hachiya rápido: poner con manzanas o bananas en bolsa cerrada (gas etileno)."
- "Tolera -15°C en reposo: se puede plantar en zonas bastante frías."

**Cerezo** (5)
- "Poda verde post-cosecha (dic-ene) es preferible a la poda invernal: cicatriza más rápido (INIA Quilamapu)."
- "Calcio foliar (CaCl₂ 0.5%) cada 10-15 días desde cuaja: PREVIENE la partidura por lluvia."
- "Mallas antipájaros obligatorias: sin ellas pierde el 50-80% de la cosecha."
- "Cosechar SIEMPRE con el cabito (pedúnculo): sin él la cereza dura solo 1 día."
- "En Ñuble y zonas sur, la cosecha es 2-3 semanas más tarde que en O'Higgins."

**Chirimoya** (5)
- "Chile es el mayor productor mundial: La Serena, Ovalle y Quillota concentran la producción."
- "Polinización manual con pincel en la mañana: multiplica la cuaja por 3-4 veces."
- "NO tolera heladas: -2°C ya daña ramas. Buscar microclima costero protegido."
- "Fruto maduro = pulpa cremosa blanca con sabor a vainilla-piña. Comerlo con cuchara."
- "La chirimoya es autoincompatible: la flor no puede fecundarse con su propio polen."

**Ciruelo** (4)
- "Ciruelo japonés (Santa Rosa, Angeleno) necesita menos frío que el europeo (D'Agen): más adaptable en zona central."
- "Verificar en vivero si la variedad necesita polinizador: muchas lo requieren."
- "Pintar tronco con cal + cobre en invierno: previene hongos y quemaduras solares."
- "Sellar TODOS los cortes de poda: la enfermedad del Plateado (Chondrostereum) entra por heridas."

**Damasco** (4)
- "Florece en agosto: mayor riesgo de helada tardía de todos los frutales. Use Tilton o Goldcot en zonas con heladas."
- "Para proteger de heladas: bidones de agua negros bajo la copa liberan calor de noche."
- "Damasco deshidratado al sol (orejones): la concentración de azúcar se multiplica por 4."
- "Variedad Tilton: más productiva Y tolerante a heladas. La más plantada en Chile."

**Duraznero** (5)
- "Poda ANUAL obligatoria en junio-julio: el durazno produce en madera del año anterior (Bol. INIA 373)."
- "Cloca (Taphrina deformans): aplicar cobre ANTES de brotación (julio-agosto). Después ya no tiene solución."
- "Raleo de frutos en noviembre es tan importante como la poda: sin raleo, frutos chicos y alternancia."
- "Pintar tronco con cal blanca + cobre en invierno: refleja el sol, previene hongos."
- "Riego por goteo ahorra 50% agua. Mulch de 10-15 cm bajo la copa conserva humedad."

**Frambuesa** (5)
- "Variedades remontantes (Heritage, Autumn Bliss): poda TOTAL en invierno. Sin complejidad."
- "Chile es el 2.° exportador mundial: Biobío y Araucanía son las zonas de mayor volumen."
- "Drosophila suzukii (mosca del vinagre): trampa de vinagre + detergente desde noviembre."
- "La frambuesa necesita FRÍO para rendir bien: veranos frescos del sur son su hábitat ideal."
- "Tutores o espaldera obligatorios: sin soporte los cañones caen y el fruto se pudre."

**Frutilla** (2)
- "Deshija los estolones en plena temporada: si los dejas todos, el fruto sale chico."
- "Funciona perfectamente en maceta colgante o jardinera: ideal para balcón."

**Granado** (3)
- "RAJADO = RIEGO IRREGULAR. La regla N°1 del granado: regar PAREJO, nunca seco y después inundar."
- "Wonderful: la variedad más plantada del mundo. Granos grandes, rojos, dulces."
- "Jugo de granada: altísimo en antocianinas (antioxidantes potentes)."

**Higuera** (2)
- "Probablemente el frutal MÁS FÁCIL del mundo: crece en suelos pésimos, poca agua, abandono."
- "El higo fresco NO dura: comerlo rápido, deshidratar al sol o congelar. No es como manzana."

**Kiwi** (5)
- "NECESITA planta macho: 1 macho por 6-8 hembras. Sin macho no hay fruto. La planta más olvidada."
- "Hayward: variedad femenina estándar. Matua o Tomuri: masculinas que la acompañan."
- "Chile es el 3.° exportador mundial: Talca y Curicó concentran el grueso de la producción."
- "Psa (Pseudomonas): la enfermedad más destructiva del kiwi. Sin síntoma claro al inicio: vigilar."
- "La poda de invierno es INTENSA: hasta 70% de la madera se elimina. No tengas miedo."

**Limonero** (5)
- "Limonero perfecto para principiantes: produce mucho, durante años. NO en zonas con heladas fuertes (-3°C lo mata)."
- "Cochinilla = enemigo principal: aceite mineral mensual. El aceite ahoga a la cochinilla tapando sus poros (Bol. INIA 282)."
- "Hojas amarillas con venas verdes (clorosis): no es falta de hierro, es pH alto. Aplicar quelato EDDHA."
- "NUNCA regar el tronco: Phytophthora (gomosis) entra por la corteza húmeda. Goteo a 30 cm del tronco."
- "Si bota hojas = ALERTA: algo está muy mal (raíz, frío, sequía extrema)."

**Lúcuma** (5)
- "Fruto andino único: pulpa seca, harinosa, sabor a caramelo-maple. No tiene par en el mundo."
- "La lúcuma chilena (variedad Seda) es la referencia mundial de sabor."
- "NO tolera heladas: temperatura mínima -1°C ya daña la planta. Solo costa norte-centro."
- "Árbol de LARGO plazo: primera cosecha a los 4-5 años. Vive y produce por décadas."
- "La pulpa deshidratada en polvo es el producto con mayor valor comercial."

**Mandarino** (4)
- "Árbol compacto (3-5 m): ideal para patios y espacios reducidos."
- "Más resistente al frío que el naranjo (-4°C vs -2°C): mejor opción en zona central."
- "Si las mandarinas se rajan: RIEGO IRREGULAR. Regar parejo sin altibajos seco→mojado."
- "Trips en floración: deja cicatrices plateadas en la fruta (daño estético, no sanitario)."

**Manzano** (2)
- "NECESITA POLINIZADOR: plante 2+ variedades que florezcan al mismo tiempo. Gala + Fuji es combinación clásica."
- "Carpocapsa (gusano de la manzana): enemigo N°1. Trampas de feromona desde octubre obligatorias."

**Membrillo** (5)
- "Probablemente el frutal MÁS FÁCIL: tolera sequía, suelos pobres y casi cualquier condición."
- "NO se come crudo: los taninos se descomponen con el calor de la cocción (mermelada, dulce)."
- "El aroma del membrillo perfuma toda la casa: úselo como ambientador natural."
- "Es AUTOFÉRTIL: un solo árbol produce abundantemente sin necesitar otro."
- "Vive 50+ años con casi cero cuidados. El dulce de membrillo casero tiene alto valor."

**Mora** (5)
- "El frutal más RÚSTICO de todos: tolera suelos pobres, sequía moderada y abandono relativo."
- "Elige Thornfree o Triple Crown: sin espinas, se trabaja cómodo y rinde igual."
- "Fruto negro BRILLANTE = listo. Negro OPACO = se pasó. Cosechar diariamente en temporada."
- "Vigila Drosophila suzukii igual que en frambuesa: trampa de vinagre desde noviembre."
- "Una planta adulta rinde 3-5 kg/año con mínimo manejo. Productividad muy alta para el esfuerzo."

**Naranjo** (3)
- "W. Navel: mejor para mesa, sin pepas. Valencia: mejor para jugo (cosecha tardía ago-oct)."
- "El color naranja se desarrolla con frío nocturno: en zonas calurosas puede madurar pero quedar verde."
- "Más sensible al frío que el limonero: -2°C ya produce daño. Proteger de heladas."

**Nectarino** (4)
- "El nectarino ES un duraznero sin pelusa: todo el manejo del Bol. INIA 373 aplica."
- "Piel lisa se daña más fácil: cosechar con cuidado y no apilar en el cajón."
- "Raleo más intenso que en durazno: el mercado exige calibre grande."
- "Fantasia y Independence: pulpa amarilla aromática. Arctic Star: pulpa blanca dulce."

**Nogal** (4)
- "Boro y zinc foliares en octubre = práctica MÁS IMPORTANTE para calidad de nuez (Bol. INIA 454)."
- "NECESITA polinizador: Chandler necesita Franquette o Serr cerca. Verificar con el vivero."
- "Secar bien antes de guardar: húmedas se enmohecen y producen aflatoxinas (tóxicas)."
- "Árbol generacional: produce 100+ años. RM concentra 15.521 ha (ODEPA)."

**Níspero** (4)
- "El PRIMER fruto del año: listo en agosto-octubre cuando casi no hay otra fruta fresca."
- "La floración invernal (julio-agosto) es su talón de Aquiles: buscar ubicación protegida del frío."
- "Autofértil: un solo árbol produce abundantemente sin necesitar otro."
- "Níspero fresco no dura: consumir o procesar en mermelada en los primeros 3-5 días."

**Olivo** (1)
- "Boro foliar en floración (noviembre) = práctica MÁS IMPORTANTE para la cuaja."

**Papayo chileno** (5)
- "Especie ÚNICA en el mundo: solo crece en Chile. Fruto en 8-12 meses desde semilla."
- "Produce TODO EL AÑO en zonas sin heladas: sin pausa, sin estación seca."
- "El virus de la mancha anular (PRSV) es incurable y se propaga por áfidos. Comprar solo plantas certificadas."
- "La raíz NO tolera encharcamiento ni siquiera 48 horas: drenaje perfecto es obligatorio."
- "Fruto inmaduro: se usa cocido como verdura. Maduro: dulce, suave, semillas negras."

**Peral** (5)
- "Cosechar VERDE FIRME y madurar en casa: en el árbol la pera se pone harinosa."
- "NECESITA polinizador: Packham's + Williams es la combinación clásica."
- "Fuego bacteriano (Erwinia): cortar 30 cm más abajo del síntoma y desinfectar la tijera ENTRE CADA CORTE."
- "El peral vive 50+ años produciendo: es inversión de largo plazo."
- "Pera asiática (Nashi) se cosecha MADURA del árbol (al revés de la europea): crocante como manzana."

**Pomelo** (3)
- "Mejor sabor en INVIERNO: el frío reduce la naringina (amargo) y concentra azúcares."
- "Star Ruby: rosado, dulce, sin pepas. Marsh: blanco, clásico."
- "El pomelo puede quedarse meses en el árbol sin perder calidad."

**Vid** (2)
- "Deshoje en enero: expone racimos a luz y aire → color, salud y calidad."
- "Crimson Seedless o Thompson: uva sin pepa. País o Italia: clásico parrón chileno."

## Las dos diferencias de fondo

1. **La base tiene 8 consejos por especie en casi todas; el legacy, 5.** La base
   cubre más, y de、 manera más parejo.

2. **La base declara dos fuentes** (`Base de Conocimiento` y `Base 20
   especies`) y varias veces cita la fuente (`Bol. INIA 373`). El legacy es
   más conversacional pero menos uniforme.

**Mi lectura:** la base es mejor contenido, pero **no es reemplazo, es
complemento**. Lo razonable sería quedarse con la base y recuperar de a uno los
110 del legacy que valgan la pena, en vez de cambiar de golpe y perderlos.

---

*Generado el 2026-10-12. La decisión no se aplicó: no se borró nada.*