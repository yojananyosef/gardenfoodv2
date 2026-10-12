# Spec Delta

## ADDED Requirements

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