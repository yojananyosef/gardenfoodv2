# garden/especies Specification

## Purpose
Fichas de especie compartidas con los cuidados agronómicos (etapas por estación, dosis en medidas caseras y calendario anual de 12 meses), más el asistente «¿Qué árbol tienes?» que crea el alta del huerto y la conexión «Lo eché» que agenda el trabajo en el Calendario del usuario.

## Requirements

### Requirement: Ficha de especie compartida con cuidados

El sistema SHALL mantener una ficha por especie del catálogo con su plan de cuidados anual: etapas de aplicación (abono de crecimiento, abono de fruta, riego, podas) asociadas a meses del calendario y dosis expresadas en medidas caseras (tazas, puñados, cucharadas). La ficha SHALL ser compartida: los cuidados no se duplican por árbol ni por usuario, y cualquier árbol de la especie del usuario enlaza a la misma ficha.

#### Scenario: Ver la ficha de mi duraznero

- **WHEN** el usuario abre el detalle de un árbol de durazno y pulsa «Ver ficha de Durazno»
- **THEN** el sistema muestra la ficha de la especie Durazno con la etapa activa del mes en curso, la dosis casera por árbol y el calendario de 12 meses con las etapas marcadas

#### Scenario: La ficha es igual para todos los árboles de la especie

- **WHEN** el usuario tiene 16 durazneros y abre la ficha desde cualquiera de ellos
- **THEN** el sistema muestra la misma ficha de especie de Durazno, sin filas duplicadas por árbol

### Requirement: Etapa actual y dosis caseras por mes

El sistema SHALL calcular, para la zona aplicada del usuario y el mes en curso, la etapa activa de la especie y su dosis en unidades caseras equivalentes a la dosis técnica (taza = 2 puñados grandes, etc.), junto con una instrucción de aplicación de una línea (dónde se reparte, riego posterior). Si la especie no tiene cuidados definidos para ese mes SHALL mostrar «sin cuidados este mes» en vez de un bloque vacío.

#### Scenario: Etapa activa en septiembre

- **WHEN** el usuario con zona Ñuble abre en septiembre la ficha de Durazno
- **THEN** el sistema marca septiembre en el calendario anual y muestra la etapa activa con su dosis (por ejemplo «El echa HOY: ⅔ taza de abono de fruta por árbol») y la instrucción de aplicación

#### Scenario: Mes sin cuidados

- **WHEN** la ficha de una especie no tiene etapa programada para el mes actual
- **THEN** el sistema muestra «sin cuidados este mes» y no el calendario vacío por defecto

### Requirement: «Lo eché» agenda en el Calendario

Al marcar un cuidado como aplicado («Lo eché»), el sistema SHALL registrar la aplicación a los árboles de esa especie del usuario (o al árbol individual si viene de su detalle) y SHALL generar la entrada del siguiente cuidado programado en el Calendario del usuario, con la fecha del próximo momento según el calendario oficial de la especie y la zona.

#### Scenario: Registrar aplicación para todos mis árboles

- **WHEN** el usuario con 16 durazneros pulsa «Lo eché a mis 16 duraznos» en la ficha
- **THEN** el sistema registra la aplicación para los 16 árboles y agenda el próximo cuidado de la especie en su Calendario

#### Scenario: Aplicación desde la ficha del árbol

- **WHEN** el usuario registra «Lo eché» desde el detalle de un solo árbol
- **THEN** el sistema registra la aplicación solo para ese árbol y agenda el próximo cuidado correspondiente

### Requirement: Asistente «¿Qué árbol tienes?» crea el alta

El asistente de Especies SHALL identificar la especie mediante el patrón de tarjetas con la fruta (más buscador para las que no tienen tarjeta) y SHALL crear en una sola pasada el cultivo del huerto del usuario y los árboles de esa especie (cantidad consultada en el asistente), dejando el usuario en la ficha de la especie creada. La creación del cultivo SHALL respetar el límite del plan freemium.

#### Scenario: Alta desde una tarjeta de fruta

- **WHEN** el usuario elige la tarjeta Durazno y confirma cantidad 16 en el asistente
- **THEN** el sistema crea el cultivo de Durazno y 16 árboles sin posición en el huerto activo, y muestra la ficha de especie de Durazno con la etapa actual

#### Scenario: Especie sin tarjeta

- **WHEN** el usuario busca una especie que no tiene tarjeta ilustrada
- **THEN** el asistente la ofrece desde el buscador del catálogo y continúa el flujo de alta con la misma ficha de resultado

#### Scenario: Límite freemium

- **WHEN** un usuario del plan gratuito alcanza su límite de cultivos en el asistente
- **THEN** el sistema muestra el estado de límite alcanzado y no crea el cultivo

### Requirement: Programa de fertilización casera por región y método de riego

El sistema SHALL mantener el programa de fertilización (del XLSX «GARDENFOOD_Guia_Fertilizacion_Casera») por especie y región: momentos del año con meses y frecuencia según método de riego (al suelo / por goteo), productos con gramos por aplicación, y ajuste por edad de la planta (joven/adulta). La ficha SHALL mostrar los gramos UNA VEZ convertidos a medidas caseras usando el peso por cucharada del catálogo de fertilizantes (por ejemplo urea ≈ 11 g) y SHALL declarar el criterio «calculado para planta adulta» junto al ajuste aplicado. Los datos SHALL provenir de un módulo de datos estático, versionado en Git con seed reproducible desde el archivo de origen (XLSX), citando la fuente (INIA, Boletín 426) en la ficha. La elección entre programas SHALL presentarse al usuario por el nombre del fertilizante («granulados» / «solubles») y no por el método de riego.

#### Scenario: Programa al suelo para duraznero adulto en Ñuble

- **WHEN** un usuario con zona de transición (Ñuble-Biobío) y durazneros adultos («ya produce») abre la ficha de Durazno en septiembre y elige «Fertilizantes granulados»
- **THEN** el sistema muestra el bloque de meses de ese período con los productos y dosis convertidos a medidas caseras (cucharadas/tazas según peso por cucharada del producto) y la nota «calculado para planta adulta»

#### Scenario: Método de riego cambia la dosis

- **WHEN** el usuario cambia su selección de «Fertilizantes granulados» a «Fertilizantes solubles»
- **THEN** la ficha recalcula con el programa de goteo (aplicaciones más frecuentes y gramos menores por aplicación), sin duplicar la especie ni la región

#### Scenario: Planta joven recibe ajuste

- **WHEN** el árbol consultado es joven («recién plantado» o «empieza a producir») según la edad guardada del cultivo
- **THEN** la ficha aplica el factor de ajuste del programa y muestra la dosis reducida respectiva al adulto

#### Scenario: Fuente de datos verificable

- **WHEN** cualquier usuario abre la ficha de una especie con programa de fertilización
- **THEN** el sistema muestra la referencia al origen (INIA, Hirzel y Hepp, Boletín N.º 426) sin exponer datos de otros usuarios

### Requirement: Buscador en el índice de especies

El índice de especies SHALL ofrecer un buscador que filtra las tarjetas por nombre de especie (o sinónimo común) en tiempo real, sin recargar la página; con texto vacío se muestran todas.

#### Scenario: Filtrar por texto

- **WHEN** el usuario escribe «dur» en el buscador
- **THEN** quedan visibles solo las tarjetas cuyo nombre/specie coincide (Durazno) y el resto se ocultan

#### Scenario: Sin coincidencias

- **WHEN** el texto no coincide con ninguna especie
- **THEN** el índice muestra un estado vacío con opción de limpiar el filtro

### Requirement: Tarjeta-puente al asistente

El índice de especies SHALL incluir una tarjeta destacada de estilo dashed «¿Qué árbol tienes en casa?» con CTA al flujo de alta por tarjetas (asistente del huerto, paso Árboles), sirviendo de único puente between módulo Especies y alta (R2), sin duplicar lógica de creación.

#### Scenario: Puente al asistente

- **WHEN** el usuario activa la tarjeta dashed
- **THEN** se abre el asistente del huerto en el paso de alta de árboles/cultivos (tarjetas de fruta)

### Requirement: La ficha de especie calcula el riego con el motor único

La ficha de especie SHALL calcular los litros y los días de cada mes llamando al motor de riego de la aplicación, y SHALL NOT reimplementar la fórmula. La ficha SHALL aplicar los mismos factores que el resto de la aplicación: suelo, edad, zona de riego con su desfase, copa, humedad y volumen de mantenimiento en reposo.

#### Scenario: La ficha coincide con el motor en la configuración por defecto
- **WHEN** se abre la ficha de una especie con suelo Media, árbol adulto, zona de riego templada y humedad en punto de riego
- **THEN** los 12 meses muestran los mismos litros y días que devuelve el motor para esas condiciones

#### Scenario: La ficha respeta la humedad
- **WHEN** se abre la ficha de una especie con humedad seca
- **THEN** los litros mostrados incluyen el factor de humedad, y son mayores que con humedad en punto de riego

#### Scenario: La ficha respeta el volumen de mantenimiento
- **WHEN** se abre la ficha de una especie en un mes de reposo vegetativo
- **THEN** el mes muestra el volumen de mantenimiento de la especie y no cero

#### Scenario: La ficha respeta el desfase de la zona
- **WHEN** se abre la ficha de una especie para una zona de riego con desfase de temporada
- **THEN** los meses mostrados están corridos según el desfase de esa zona

### Requirement: La ficha no supone datos que no tiene

Cuando falte el dato de suelo, edad, zona o humedad, la ficha de especie SHALL indicar que ese dato no está disponible y SHALL NOT asumir el valor promedio ni mostrarlo como real.

#### Scenario: Falta el dato de suelo
- **WHEN** la base de riego no trae la clase de suelo seleccionada
- **THEN** la ficha indica que falta el dato de suelo en lugar de calcular con factor 1

#### Scenario: Falta el dato de zona
- **WHEN** la base de riego no trae la zona de riego de la comuna del usuario
- **THEN** la ficha indica que falta el dato de zona en lugar de calcular con clima 1

#### Scenario: Sin datos supuestos
- **WHEN** se inspecciona la ficha
- **THEN** no contiene valores por defecto asumidos para suelo, edad, zona o humedad

### Requirement: Los bloques de dosis se identifican por sus meses

La ficha SHALL identificar cada bloque de dosis por el rango de meses que cubre, sin mostrar nombres de estado fenológico del tipo «cuando despierta», «cuando engorda la fruta» o «cuando se recupera», ni textos descriptivos que usen esa jerga.

#### Scenario: El título del bloque son los meses

- **WHEN** el usuario abre un bloque de dosis de la ficha
- **THEN** su título es el rango de meses que cubre ese bloque

#### Scenario: No aparece la jerga fenológica

- **WHEN** se renderiza la tab de nutrición completa
- **THEN** no aparece en pantalla ningún texto de estado fenológico de los del XLSX

#### Scenario: El calendario sigue describiendo cada mes

- **WHEN** el usuario recorre el calendario de 12 meses con un lector de pantalla
- **THEN** cada mes queda anunciado con nombre y los meses en que corresponde abonar, sin depender de los títulos eliminados

#### Scenario: La ficha espejo usa el mismo criterio

- **WHEN** el usuario abre la ficha de una especie desde el módulo de huerto, que renderiza el programa por separado
- **THEN** ese render identifica los bloques por sus meses y tampoco muestra los nombres de estado fenológico

### Requirement: La región de la guía sigue a la comuna del perfil

La región usada para el programa de fertilización SHALL derivarse de la comuna guardada en el perfil del usuario y SHALL recalcularse cuando esa comuna cambie, sin depender del momento en que se abrió la ficha. La región SHALL cambiarse únicamente desde el perfil y la ficha SHALL ofrecer los ajustes que le son propios —la edad del árbol y el tipo de fertilizante— sin exponer un selector de región.

#### Scenario: La región sigue a la comuna del perfil

- **WHEN** el usuario tiene comuna «Rancagua» en su perfil y abre la ficha de una especie
- **THEN** el programa mostrado corresponde a la región de la guía que cubre Rancagua

#### Scenario: Cambiar la comuna cambia la región

- **WHEN** el usuario cambia su comuna en el perfil a «Los Angeles» y vuelve a la ficha
- **THEN** el programa mostrado corresponde a la región de la guía de Los Angeles, no a la que se mostraba antes

#### Scenario: La ficha no ofrece cambiar la región

- **WHEN** el usuario está en la pestaña de nutrición de la ficha
- **THEN** no hay un control para elegir la región, y el pie indica que la región viene de su comuna con un enlace al perfil

#### Scenario: Sin comuna en el perfil

- **WHEN** el usuario no tiene comuna configurada
- **THEN** la ficha lo dice de forma explícita y ofrece configurar la comuna, en vez de presentar datos de una región por defecto como los de su zona

#### Scenario: Cambiar la comuna desde la ficha

- **WHEN** el usuario cambia su comuna en el perfil y regresa a la ficha sin recargarla
- **THEN** la ficha refleja la región de la nueva comuna

### Requirement: La ficha no muestra datos de otra región sin decirlo

Cuando la guía de fertilización no tenga programa calibrado para la especie en la región del perfil del usuario, la ficha SHALL mostrar un estado vacío que indique que la guía no cubre esa combinación, en vez de mostrar el programa de otra región.

#### Scenario: Especie sin guía para la comuna

- **WHEN** el usuario tiene comuna en una región donde la guía no tiene programa para la especie que abre
- **THEN** la ficha indica que no hay guía para esa especie en su zona, sin mostrar el calendario ni las dosis de otra región

#### Scenario: El estado vacío ofrece salida

- **WHEN** se muestra el estado vacío por falta de guía regional
- **THEN** el usuario puede cambiar su comuna desde ahí mismo, con un enlace al perfil

#### Scenario: El estado vacío no contradice al pie

- **WHEN** la ficha muestra el estado vacío por falta de guía
- **THEN** no hay ninguna parte de la ficha que afirme que los datos corresponden a una región distinta de la del usuario
