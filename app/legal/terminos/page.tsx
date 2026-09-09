import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones — GardenFood",
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

export default function TerminosPage() {
  return (
    <article className="prose-sm max-w-none">
      <h1 className="mb-1 text-2xl font-semibold">Términos y Condiciones</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Vigente desde el 9 de septiembre de 2026 · Ley 19.496 del Consumidor y Ley 21.719 de
        Protección de Datos Personales
      </p>

      <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
        [PLACEHOLDER — completar antes de monetizar: RAZÓN SOCIAL, RUT y EMAIL DE CONTACTO.
        Plantilla técnica pendiente de validación por abogado.]
      </div>

      <H2>1. El servicio</H2>
      <P>
        GardenFood es una plataforma de agronomía doméstica para Chile: calendario y fichas de
        manejo (poda, riego, fertilización, sanidad) por especie y comuna, planificador de huerto
        y calculadoras. El responsable es [RAZÓN SOCIAL], RUT [RUT], contacto [EMAIL].
      </P>

      <H2>2. Cuenta y edad</H2>
      <Ul
        items={[
          "Para usar las funciones de huerto necesitas una cuenta con correo y contraseña.",
          "El registro está dirigido a mayores de 14 años; los menores de 16 requieren autorización de sus representantes legales.",
          "Eres responsable de la confidencialidad de tu contraseña y de la actividad en tu cuenta.",
        ]}
      />

      <H2>3. Planes y pagos</H2>
      <Ul
        items={[
          "El plan gratuito tiene límites (máximo de cultivos, árboles y huertos) y muestra publicidad.",
          "Los planes de pago (Huertero, Cosecha, Full) se cobran por suscripción recurrente a través de Mercado Pago, con previsualización de 14 días de prueba según el plan elegido.",
          "La suscripción se renueva automáticamente al final de cada período (mensual o anual) hasta que la canceles. Puedes cancelar cuando quieras desde Mercado Pago; el servicio sigue activo hasta el fin del período ya pagado.",
          "El precio, la moneda, la frecuencia y el total a pagar se informan de forma destacada en la pantalla de compra antes de aceptar.",
          "Emitiremos boleta o comprobante por cada cobro conforme a la normativa tributaria chilena.",
        ]}
      />

      <H2>4. Desistimiento y cancelación</H2>
      <P>
        Puedes poner término a la suscripción en cualquier momento desde tu cuenta de Mercado Pago.
        Durante el período de prueba no se generan cobros, por lo que no hay monto que devolver. Si
        contrataste un plan y te arrepientes dentro de los 10 días siguientes a la contratación
        sin haber usado el servicio de pago, puedes ejercer el derecho de retracto escribiendo a
        [EMAIL]; devolveremos las sumas abonadas que correspondan a servicios no prestados.
      </P>

      <H2>5. Contenido agronómico</H2>
      <P>
        Las fichas, calendarios y recomendaciones se elaboran con fuentes agronómicas para las
        zonas agroclimáticas de Chile y se ofrecen como guía general: no constituyen asesoría
        técnica profesional para explotaciones comerciales ni garantizan resultados. Verifica
        siempre las condiciones específicas de tu terreno y, ante dudas de relevancia económica o
        sanitaria, consulta a un profesional agrónomo.
      </P>

      <H2>6. Uso aceptable</H2>
      <P>
        No puedes revender el servicio, extraer el catálogo de forma masiva automatizada, usar la
        plataforma para fines ilícitos o interferir con su operación. Podemos suspender cuentas que
        incumplan estos términos.
      </P>

      <H2>7. Propiedad intelectual</H2>
      <P>
        El catálogo, fichas, software y marcas pertenecen a [RAZÓN SOCIAL] o a sus licenciantes. Tu
        huerto y tus datos son tuyos; puedes exportarlos cuando quieras (sección &quot;Tus
        derechos&quot; de tu perfil).
      </P>

      <H2>8. Cambios y ley aplicable</H2>
      <P>
        Publicaremos los cambios de estos términos con su fecha de vigencia, y avisaremos con
        anticipación razonable si afectan planes pagos. Estos términos se rigen por las leyes de
        Chile. Este servicio se ofrece &quot;tal cual&quot;; la responsabilidad del responsable se
        limita al máximo permitido por la ley chilena.
      </P>
    </article>
  );
}
