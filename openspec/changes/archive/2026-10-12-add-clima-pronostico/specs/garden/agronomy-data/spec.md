# Spec Delta

## ADDED Requirements

### Requirement: Pronóstico meteorológico por día para la comuna del usuario

El sistema SHALL entregar un pronóstico meteorológico para los próximos días de la comuna configurada en el perfil del usuario, con temperatura máxima, temperatura mínima y probabilidad de precipitación por día y fecha. La fuente SHALL ser una que no requiera credencial de API para su uso previsto, y el sistema SHALL distinguir en la respuesta si los datos provienen del pronóstico o del perfil climático histórico de la zona.

#### Scenario: Pronóstico de los próximos días

- **WHEN** el usuario tiene comuna configurada y abre la pestaña Clima
- **THEN** el sistema muestra la máxima, la mínima y la probabilidad de lluvia de cada uno de los próximos días, con su fecha

#### Scenario: Pronóstico para la comuna del perfil

- **WHEN** el usuario cambia su comuna en el perfil
- **THEN** el pronóstico que se muestra corresponde a la nueva comuna

#### Scenario: Fuente del pronóstico identificable

- **WHEN** se muestran datos de pronóstico
- **THEN** la interfaz indica que son pronóstico; cuando solo hay perfil histórico disponible, lo indica como tal y no lo presenta como pronóstico

#### Scenario: Pronóstico no disponible

- **WHEN** la fuente de pronóstico no responde o no hay coordenadas para la comuna
- **THEN** el sistema sigue funcionando y muestra el perfil climático de la zona como respaldo, declarando que son promedios y no pronóstico

#### Scenario: El respaldo no rompe la pantalla principal

- **WHEN** la fuente de pronóstico falla durante la carga de la pantalla principal
- **THEN** la pantalla se renderiza igual, sin errores, con el perfil de la zona

### Requirement: Alertas climáticas predictivas y fechadas

Las alertas climáticas SHALL derivarse del pronóstico de los próximos días y SHALL incluir la fecha a la que se refieren, en lugar de dispararse por el mes del calendario ni describir eventos que ya ocurrieron. La severidad de cada alerta SHALL derivarse del valor previsto, no de un promedio anual.

#### Scenario: Helada prevista con fecha

- **WHEN** el pronóstico de los próximos días tiene una temperatura mínima por debajo del umbral de helada de la zona
- **THEN** el sistema muestra una alerta de riesgo de helada indicando qué día cae por debajo del umbral

#### Scenario: Lluvia prevista con fecha

- **WHEN** el pronóstico supera el umbral de probabilidad de precipitación en alguno de los próximos días
- **THEN** el sistema muestra una alerta de lluvia indicando el día y la probabilidad

#### Scenario: Alerta sin fecha se considera un defecto

- **WHEN** el sistema muestra una alerta climática
- **THEN** esta indica a qué día se refiere

#### Scenario: Sin coincidencias en el pronóstico

- **WHEN** ningún día del pronóstico alcanza ningún umbral
- **THEN** el sistema lo dice de forma explícita y no muestra alertas de relleno ni etiquetas de cobertura vacías

#### Scenario: La severidad responde al valor previsto

- **WHEN** la temperatura mínima prevista cae por debajo del umbral bajo
- **THEN** la severidad de la alerta de helada refleja ese valor y no un rango de días de helada promedio de la zona