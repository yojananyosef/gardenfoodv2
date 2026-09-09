# admin/media-kit Delta

## ADDED Requirements

### Requirement: Segmentos con k-anonymity

El sistema SHALL proveer en `/admin/media-kit` segmentos agregados de `gf_user_audiences` con conteo de usuarios por: segmento comercial (`commercial_segments` desdoblado), tier de poder adquisitivo, especie de interés primaria y región (via `perfiles`). Cada segmento publicado SHALL cumplir **k-anonymity ≥50**: los grupos con menos de 50 usuarios SHALL omitirse de la vista y del export, mostrándose en su lugar un indicador de cuántos segmentos quedan bajo el umbral.

#### Scenario: Admin abre media kit
- **WHEN** un admin abre `/admin/media-kit`
- **THEN** el sistema muestra solo segmentos con ≥50 usuarios, con conteo agregado y sin ningún identificador individual

#### Scenario: Ningún segmento llega al umbral
- **WHEN** todos los segmentos tienen <50 usuarios
- **THEN** la página muestra el estado vacío "aún no hay segmentos publicables (k≥50)" y ningún export con datos

### Requirement: Export CSV/JSON

El sistema SHALL permitir exportar los segmentos publicables como CSV y JSON, generado en cliente desde los datos ya cargados (sin endpoint adicional ni consultas sin guard). El export SHALL incluir un encabezado con fecha de generación, definición k-anonymity y la nota "estadísticas agregadas — no incluye datos personales".

#### Scenario: Admin exporta para pitch
- **WHEN** un admin pulsa "Exportar CSV" o "Exportar JSON"
- **THEN** el navegador descarga el archivo con solo los segmentos ≥50 y la cabecera de contexto legal
