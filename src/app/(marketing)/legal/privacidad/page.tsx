import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/legal/privacidad" } };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="20 de octubre de 2026">
      <p>
        En yeswecontent nos tomamos en serio tus datos. Aquí explicamos qué recogemos, para qué y qué derechos tienes, con el menor número posible de palabras raras.
      </p>
      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li><strong>Titular:</strong> yeswecontent S.L. (datos provisionales)</li>
        <li><strong>NIF:</strong> B-00000000</li>
        <li><strong>Domicilio:</strong> [Dirección pendiente], España</li>
        <li><strong>Contacto:</strong> privacidad@yeswecontent.com</li>
      </ul>
      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>Datos de cuenta: nombre, email y contraseña cifrada.</li>
        <li>Datos de tus webs: URL, contenidos, configuración y, si los conectas, datos de Google Search Console, Google Analytics y tu CMS.</li>
        <li>Datos de facturación, gestionados por nuestro proveedor de pagos. No almacenamos números de tarjeta.</li>
        <li>Datos de uso de las herramientas gratuitas: la URL analizada y, si nos lo das, tu email.</li>
        <li>Datos técnicos: dirección IP, navegador y registros de actividad necesarios para la seguridad del servicio.</li>
      </ul>
      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Prestarte el servicio contratado (base legal: ejecución del contrato).</li>
        <li>Enviarte comunicaciones sobre tu cuenta y, si lo aceptas, novedades (base legal: interés legítimo o consentimiento).</li>
        <li>Cumplir obligaciones legales, fiscales y contables.</li>
        <li>Mejorar el producto con datos agregados y anónimos.</li>
      </ul>
      <h2>4. Con quién los compartimos</h2>
      <p>
        Con proveedores que nos ayudan a prestar el servicio (alojamiento, base de datos, pagos, envío de emails y modelos de IA para generar contenido), siempre bajo contrato de encargo de tratamiento. Algunos pueden estar fuera del Espacio Económico Europeo; en ese caso aplicamos las garantías previstas en el RGPD, como las cláusulas contractuales tipo.
      </p>
      <h2>5. Cuánto tiempo los guardamos</h2>
      <p>Mientras tengas cuenta y, después, durante los plazos legales de prescripción. Los leads de herramientas gratuitas se eliminan a los 24 meses si no hay relación comercial.</p>
      <h2>6. Tus derechos</h2>
      <p>
        Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y pedir la portabilidad de tus datos escribiendo a privacidad@yeswecontent.com. Si crees que no lo hemos hecho bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
      </p>
      <h2>7. Cookies</h2>
      <p>Usamos cookies técnicas imprescindibles para iniciar sesión. Si en el futuro usamos cookies analíticas o de marketing, te pediremos permiso antes.</p>
    </LegalPage>
  );
}
