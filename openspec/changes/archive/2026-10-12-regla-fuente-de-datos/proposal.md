---
status: proposed
---

# Regla de fuente de datos para los catalogos

## Que se decide

Los **numeros** de los catalogos agronomicos salen de la base. El **texto
editorial** sigue en el codigo. Y antes de migrar cualquier catalogo se mide
cuanto falta en cada lado.

## Por que

Porque el Excel maestro v3 es una fuente de **datos**, no de **contenido**, y
esto no estaba escrito en ningun lado. Seenosiguio cuatro veces al mismo
precio:

| Que paso | Costo |
|---|---|
| Las 4 FKs de la 10.4 ya existian y validadas | Ninguno, se verifico antes |
| La 0045 dropeo columnas que si se escribian | **28 minutos sin telemetria** |
| `imagen` y `descripcion` no estan en ninguna hoja | Se hubieron borrado |
| El oraculo de riego ya existia, con igualdad exacta | Un test redundante y mas debil |

La 0045 es la que duele: se verifico que **nadie leia** las columnas y era
cierto, pero no se verifico **quien las escribia**.

## La tabla que lo resume

Recorriendo las 47 hojas del Excel celda por celda:

| Campo | Donde esta |
|---|---|
| Todo el dato agronomico de las 30 especies | la base, completo |
| El veredicto de viabilidad de 600 combinaciones | la base |
| La razon de cada veredicto | **en ninguna parte** (se creo en la 0048) |
| Imagen y descripcion de especie | **en ninguna parte** |
| Consejos | los dos lados, **y no coinciden** |

`fact_consejos` declara venir de "Base 20 especies". Tiene 211 textos, y con
los 154 que usa el codigo comparte **uno**.

## Que se hizo con esta regla

- `lib/agronomy/especies.ts`: 565 lineas -> 190. Los datos agronomicos salen de
  `especies.generado.ts`, que produce `scripts/generar_especies.mjs`. El
  editorial queda en `especies.editorial.ts`. **0 diferencias en 270
  comparaciones.**
- `fact_viabilidad_zona.razon`: columna nueva (0048), poblada con 551 de las
  600 razones. Sin cambiar lo que ve el usuario.
- `viabilidad.ts` y `consejos.ts`: **NO migrados**. Sus diferencias no son de
  higiene, son de contenido.

## Lo que queda abierto y por que

Tres decisiones que no son tecnicas, documentadas en `PENDING.md`:

1. Las **49 combinaciones** de viabilidad que la tabla tiene y el codigo no.
   Poblarlas cambia que especies se recomiendan por zona.
2. El veredicto de **olivo en la zona 20**: el codigo dice `no`, la base `SI`.
3. **Cual fuente de consejos manda**: los 211 del Excel o los 154 del legacy.

Y dos que esperan una migracion de pagos:

4. Mercado Pago -> Flow.
5. Licencia de Open-Meteo para uso comercial.