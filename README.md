# Meridian — Landing page

Landing page corporativa de Meridian enfocada en software, agentes de inteligencia artificial, automatización e integraciones.

## Funcionalidades

- Diseño responsive para escritorio y móvil.
- Navbar flotante con efecto de desenfoque al desplazarse.
- Menú móvil animado.
- Ilustración del planeta con fondo transparente y órbita animada.
- Animaciones de entrada, tarjetas, botones y llamadas a la acción.
- Formulario de contacto accesible.
- Registro automático de contactos en Google Sheets.
- Notificaciones por Gmail para uno o varios integrantes del equipo.
- Ruta de servidor propia para evitar problemas de CORS con Google Apps Script.

## Tecnologías

- React 19
- Next.js 16
- TypeScript
- Tailwind CSS 4
- Vinext/Vite
- Google Apps Script
- Google Sheets

## Requisitos

- Node.js 22.13 o superior.
- npm.
- Una cuenta de Google para Sheets y Apps Script.

## Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/DaniDRK20/meridian-landing-page.git
cd meridian-landing-page
npm install
```

Inicia el servidor local:

```bash
npm run dev
```

Abre la dirección que aparezca en la terminal, normalmente:

```text
http://localhost:3000
```

## Comandos

```bash
npm run dev
npm run build
npm run start
npm run test
npm run lint
```

## Archivos principales

```text
app/
├── api/contact/route.ts   # Recibe el formulario y lo envía a Apps Script
├── globals.css            # Diseño, responsive y animaciones
├── layout.tsx             # Metadatos y estructura HTML
└── page.tsx               # Página, navbar, planeta y formulario

public/
├── meridian-globe-transparent.png
├── meridian-globe-layered.png
├── meridian-globe.png
└── favicon.svg

.openai/hosting.json       # Configuración del alojamiento actual
package.json               # Dependencias y comandos
```

## Editar el contenido

Los textos, secciones, enlaces, tarjetas y formulario están en:

```text
app/page.tsx
```

Los colores principales están definidos como variables en:

```css
:root {
  --navy: #071e49;
  --blue: #154eea;
  --muted: #536581;
  --line: #dfe6ef;
  --paper: #f7f9fc;
}
```

Las animaciones y estilos responsive están en `app/globals.css`.

## Integración con Google Sheets

La web envía el formulario a:

```text
POST /api/contact
```

La ruta `app/api/contact/route.ts` valida la información y la reenvía al endpoint público de Google Apps Script. Si creas una implementación nueva, reemplaza el valor de `SHEET_ENDPOINT` en ese archivo.

La hoja debe tener una pestaña llamada `Hoja 1` con estas columnas:

| Fecha | Nombre | Apellido | Teléfono | Correo |
|---|---|---|---|---|

### Código completo de Apps Script

Abre el Google Sheet y entra en **Extensiones → Apps Script**. Usa este código:

```javascript
const SHEET_NAME = "Hoja 1";

const RECIPIENTS = [
  "tu-correo@gmail.com",
  "companero@empresa.com"
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("La solicitud no contiene datos");
    }

    const data = JSON.parse(e.postData.contents);
    const nombre = String(data.nombre || "").trim();
    const apellido = String(data.apellido || "").trim();
    const telefono = String(data.telefono || "").trim();
    const correo = String(data.correo || "").trim();

    if (!nombre || !apellido || !telefono || !correo) {
      throw new Error("Faltan campos obligatorios");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      throw new Error("El correo electrónico no es válido");
    }

    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(`No se encontró la pestaña "${SHEET_NAME}"`);
    }

    const fecha = new Date();
    sheet.appendRow([fecha, nombre, apellido, telefono, correo]);

    const asunto = `Nuevo contacto web: ${nombre} ${apellido}`;
    const mensaje = `
Se recibió un nuevo contacto desde la página web de Meridian.

Nombre: ${nombre}
Apellido: ${apellido}
Teléfono: ${telefono}
Correo: ${correo}
Fecha: ${Utilities.formatDate(
  fecha,
  Session.getScriptTimeZone(),
  "dd/MM/yyyy HH:mm:ss"
)}
    `.trim();

    RECIPIENTS.forEach(function(destinatario) {
      MailApp.sendEmail({
        to: destinatario.trim().toLowerCase(),
        subject: asunto,
        body: mensaje,
        replyTo: correo,
        name: "Meridian — Formulario web"
      });
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        message: "Contacto guardado y notificación enviada"
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Publicar Apps Script

1. Pulsa **Implementar → Nueva implementación**.
2. Selecciona **Aplicación web**.
3. Configura **Ejecutar como: Yo**.
4. Configura **Acceso: Cualquier usuario**.
5. Autoriza Google Sheets y el envío de correo.
6. Copia la URL terminada en `/exec`.
7. Actualiza `SHEET_ENDPOINT` en `app/api/contact/route.ts`.
8. Cuando modifiques Apps Script, publica siempre una **Nueva versión**.

## Añadir destinatarios

Agrega todos los correos necesarios:

```javascript
const RECIPIENTS = [
  "persona1@gmail.com",
  "persona2@gmail.com",
  "persona3@empresa.com"
];
```

Cada destinatario recibe un mensaje individual.

## Compilar para producción

```bash
npm run build
npm run start
```

Antes de publicar cambios, ejecuta `npm run build` para comprobar que el proyecto compila.

## Sitio publicado

[Abrir Meridian](https://meridian-talento-humano.dj24-0885.chatgpt.site)

## Seguridad

- No subas contraseñas, claves de API ni archivos `.env`.
- El endpoint de Apps Script no es una contraseña, pero debe validarse y protegerse contra abuso si aumenta el tráfico.
- Para producción con tráfico significativo, añade protección antispam como Cloudflare Turnstile.

