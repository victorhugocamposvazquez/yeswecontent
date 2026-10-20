import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Términos y condiciones", alternates: { canonical: "/legal/terminos" } };

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="20 de octubre de 2026">
      <p>Estos términos regulan el uso de yeswecontent. Al crear una cuenta, los aceptas. Si algo no queda claro, escríbenos a hola@yeswecontent.com.</p>
      <h2>1. Quiénes somos</h2>
      <p>yeswecontent S.L. (datos provisionales), NIF B-00000000, con domicilio en [dirección pendiente], España.</p>
      <h2>2. El servicio</h2>
      <p>
        yeswecontent es un software que ayuda a planificar, redactar, publicar y medir contenido web, incluido el seguimiento de menciones en asistentes de IA y una red de intercambio de enlaces entre clientes. No garantizamos posiciones concretas en buscadores ni menciones en asistentes, que dependen de terceros.
      </p>
      <h2>3. Cuenta y uso aceptable</h2>
      <ul>
        <li>Eres responsable de mantener segura tu contraseña y de la actividad de tu cuenta.</li>
        <li>Solo puedes conectar webs que te pertenezcan o que estés autorizado a gestionar.</li>
        <li>No puedes usar el servicio para publicar contenido ilegal, engañoso, que infrinja derechos de terceros o que constituya spam.</li>
        <li>En la red de enlaces debes respetar las normas de calidad publicadas y no manipular el sistema de créditos.</li>
      </ul>
      <h2>4. Contenido</h2>
      <p>
        El contenido generado para tu web es tuyo una vez pagado el periodo correspondiente. Eres responsable de revisarlo y de lo que publicas. Nos concedes una licencia limitada para procesar tus datos y contenidos con el único fin de prestarte el servicio.
      </p>
      <h2>5. Precios, prueba y garantía</h2>
      <ul>
        <li>Los precios son los publicados en la página de precios, impuestos no incluidos salvo que se indique.</li>
        <li>La prueba gratuita dura 3 días. Si no cancelas antes de que termine, se inicia la suscripción elegida.</li>
        <li>Garantía de 60 días: si durante los primeros 60 días de suscripción de pago no observas un aumento del tráfico orgánico medido en Google Search Console respecto al punto de partida, puedes solicitar el reembolso de lo pagado escribiendo a hola@yeswecontent.com. Requiere haber tenido la publicación automática activa durante ese periodo.</li>
        <li>Puedes cancelar en cualquier momento desde el panel; mantendrás el acceso hasta el final del periodo pagado.</li>
      </ul>
      <h2>6. Disponibilidad y responsabilidad</h2>
      <p>
        Trabajamos para que el servicio esté siempre disponible, pero puede haber interrupciones por mantenimiento o causas ajenas. Nuestra responsabilidad total se limita al importe pagado en los últimos 12 meses, salvo dolo o negligencia grave.
      </p>
      <h2>7. Cambios y ley aplicable</h2>
      <p>Podemos actualizar estos términos avisándote con al menos 15 días de antelación. Se rigen por la ley española y, salvo que la normativa de consumo diga otra cosa, por los juzgados del domicilio del titular.</p>
    </LegalPage>
  );
}
