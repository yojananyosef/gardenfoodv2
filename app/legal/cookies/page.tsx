import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies y Almacenamiento — GardenFood",
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

export default function CookiesPage() {
  return (
    <article className="prose-sm max-w-none">
      <h1 className="mb-1 text-2xl font-semibold">Cookies y Almacenamiento Local</h1>
      <p className="mb-6 text-xs text-muted-foreground">
        Vigente desde el 9 de septiembre de 2026
      </p>

      <H2>Qué usamos y para qué</H2>
      <Ul
        items={[
          "Cookies de sesión (httpOnly, de Supabase): mantienen tu sesión iniciada. Estríctamente necesarias.",
          "localStorage gf_device_id: identificador del dispositivo para la analítica de producto de primer partido. Puedes oponerte al tratamiento desde el banner o Ajustes de privacidad.",
          "localStorage + cookie gf_consent: guarda tu elección de privacidad (390 días). Estrícticamente necesario para respetar tu decisión.",
          "sessionStorage gf_session_id: agrupa tus eventos por sesión de navegación (se borra al cerrar el navegador).",
        ]}
      />

      <H2>Lo que NO usamos</H2>
      <P>
        No usamos cookies de terceros publicitarias, ni píxeles de redes sociales, ni scripts de
        seguimiento de terceros. La telemetría viaja a nuestros propios endpoints y la publicidad
        se sirve desde el propio dominio sin perfiles externos.
      </P>

      <H2>Cómo gestionarlo</H2>
      <P>
        Puedes borrar estos datos desde tu navegador en cualquier momento, y revocar tu elección de
        privacidad desde Ajustes de privacidad en tu perfil. Si opones el interés legítimo, dejamos
        de registrar analítica de producto de inmediato en ese dispositivo.
      </P>
    </article>
  );
}
