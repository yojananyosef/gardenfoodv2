import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — GardenFood",
  robots: { index: false, follow: false },
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-3 text-lg font-semibold">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="mb-3 list-disc pl-5 text-sm leading-relaxed text-muted-foreground">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function PrivacidadPage() {
  return (
    <article className="prose-sm max-w-none">
      <h1 className="mb-1 text-2xl font-semibold">Política de Privacidad</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Vigente desde el 9 de septiembre de 2026 · Cumple la Ley 21.719 sobre Protección de Datos
        Personales (rige plenamente desde el 1 de diciembre de 2026)
      </p>

      <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
        Responsable: Hugo Montenegro (GardenFood), emprendedor individual · RUT por completar al
        formalizar. Contacto: pichilemugardenfood@gmail.com. Desarrollo: Johan Gutierrez. Texto
        plantilla pendiente de validación por abogado antes de monetizar.
      </div>

      <H2>1. Responsable del tratamiento</H2>
      <P>
        El responsable del tratamiento de tus datos es Hugo Montenegro (GardenFood), emprendedor
        individual, RUT [completar al formalizar], con contacto en pichilemugardenfood@gmail.com.
        Toda consulta o ejercicio de derechos se atiende por ese correo y desde la sección
        &quot;Tus derechos&quot; de tu perfil.
      </P>

      <H2>Datos que tratamos</H2>
      <Ul
        items={[
          "Cuenta: nombre, correo electrónico, comuna, región y zona agroclimática declaradas al registrarte.",
          "Tu huerto: huertos, cultivos, árboles, tareas y registros de cosechas, y los polígonos/superficie de tu terreno si lo dibujas en el mapa.",
          "Telemetría de producto: identificadores del dispositivo y de sesión, páginas vistas, tiempo de permanencia, profundidad de scroll, interacciones con fichas y banners, metadatos técnicos (sistema operativo, navegador, resolución, conexión) y ubicación aproximada derivada de tu IP o de tu comuna declarada.",
          "Consentimientos: tu elección de privacidad con fecha y vigencia.",
          "Pagos: gestionados íntegramente por Mercado Pago; nosotros solo recibimos referencias del plan y su estado.",
        ]}
      />

      <H2>Con qué finalidades y con qué base legal</H2>
      <Ul
        items={[
          "Prestar el servicio (cuenta, huerto, calendario, calculadoras): ejecución del contrato contigo.",
          "Mejorar el producto: analítica de producto de primer partido sobre el uso de la app — interés legítimo, del cual puedes oponerte desde el banner o Ajustes de privacidad y dejamos de hacerlo de inmediato.",
          "Seguridad y prevención de fraude: interés legítimo.",
          "Publicidad personalizada, geolocalización precisa, compartición con socios comerciales y vinculación de dispositivos: únicamente con tu consentimiento expreso, revocable en cualquier momento.",
          "Cumplir obligaciones tributarias (boletas): obligación legal.",
        ]}
      />

      <H2>Sobre la publicidad y el modelo de datos</H2>
      <P>
        No vendemos tus datos personales. La publicidad se entrega de dos maneras: contextual (según
        la página que ves, sin datos de comportamiento) o personalizada por segmentos (solo si
        otorgaste el consentimiento correspondiente). Las estadísticas que eventualmente se
        comparten con marcas son agregadas y anonimizadas: nunca incluyen datos identificables de
        individuos y solo se reportan grupos de tamaño mínimo (50 usuarios).
      </P>

      <H2>Encargados y transferencias internacionales</H2>
      <P>
        Prestamos el servicio con proveedores que actúan como encargados del tratamiento:
        Supabase (base de datos y autenticación), Vercel (hosting web), Mercado Pago (pagos) y un
        servicio de geolocalización por IP. Estos proveedores operan fuera de Chile; con todos
        ellos existen cláusulas contractuales y acuerdos de tratamiento conforme a la Ley 21.719.
        El detalle y estado de cada acuerdo está en el registro interno de cumplimiento.
      </P>

      <H2>Plazos de conservación</H2>
      <Ul
        items={[
          "Cuenta y datos del huerto: mientras tu cuenta exista.",
          "Consentimientos y oposiciones: registro conservado 390 días desde cada elección (vigencia del consentimiento).",
          "Eventos de telemetría: hasta 24 meses, luego se eliminan.",
          "Datos de pagos y boletas: los plazos que exija la normativa tributaria.",
        ]}
      />

      <H2>Tus derechos</H2>
      <P>
        Puedes ejercer en cualquier momento, de forma gratuita: acceso y actualización,
        rectificación, supresión (eliminación de cuenta y datos), portabilidad (descarga en JSON),
        y oposición al tratamiento basado en interés legítimo.
      </P>
      <Ul
        items={[
          "Portabilidad y supresión: sección “Tus derechos sobre tus datos” en tu perfil.",
          "Oposición y consentimientos: Ajustes de privacidad en tu perfil, o el banner de la primera visita.",
          "Cualquier otro derecho o reclamo: escríbenos a pichilemugardenfood@gmail.com. Si no quedas conforme, puedes reclamar ante la Agencia de Protección de Datos Personales.",
        ]}
      />

      <H2>Menores de edad</H2>
      <P>
        El registro está dirigido a mayores de 14 años. Para usuarios entre 14 y 16 años se requiere
        la autorización de sus representantes legales, y el titular de esos datos puede solicitar la
        supresión en cualquier momento.
      </P>

      <H2>Cambios de esta política</H2>
      <P>
        Publicaremos aquí toda modificación con su fecha de vigencia. Si un cambio afecta
        tratamientos basados en consentimiento, pediremos de nuevo tu elección.
      </P>
    </article>
  );
}
