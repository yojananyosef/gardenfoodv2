# Spec Delta

## ADDED Requirements

### Requirement: La zona resuelta distingue comuna ausente de comuna válida

La resolución de zona SHALL exponer si la comuna del usuario está efectivamente resuelta en el catálogo o si no hay comuna configurada, de modo que las pantallas dependientes de zona puedan distinguir ambos casos. El valor por defecto SHALL seguir existiendo para que la aplicación no falle, pero SHALL ser identificable por el consumidor en vez de presentarse como la zona real del usuario.

#### Scenario: Comuna válida se marca como resuelta

- **WHEN** el usuario tiene una comuna presente en el catálogo
- **THEN** la resolución entrega la zona correspondiente marcada como resuelta desde la comuna del usuario

#### Scenario: Comuna ausente se marca como no resuelta

- **WHEN** el usuario no tiene comuna configurada en su perfil
- **THEN** la resolución entrega la zona por defecto marcada como no resuelta desde la comuna del usuario, para que la interfaz pueda advertirlo

#### Scenario: Comuna desconocida en el catálogo

- **WHEN** el perfil tiene una comuna que no está en el catálogo
- **THEN** la resolución no falla, entrega la zona por defecto y la marca como no resuelta