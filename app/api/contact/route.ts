const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzKsucmKXdwHNdJTh4H9K9u8CaR-d8BbpyTsZkX6Mu-LX5YBOgAG1YSlif6zBt5wA/exec";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const payload = {
      nombre: String(data.nombre || "").trim(),
      apellido: String(data.apellido || "").trim(),
      telefono: String(data.telefono || "").trim(),
      correo: String(data.correo || "").trim(),
    };

    if (data.consentimiento !== true) {
      return Response.json({ ok: false, error: "Debes aceptar la Política de Privacidad" }, { status: 400 });
    }

    if (Object.values(payload).some(value => !value)) {
      return Response.json({ ok: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const googleResponse = await fetch(SHEET_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const result = await googleResponse.json() as { ok?: boolean; error?: string };
    if (!googleResponse.ok || !result.ok) {
      throw new Error(result.error || "Google Sheets rechazó la solicitud");
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return Response.json(
      { ok: false, error: "No pudimos registrar la solicitud" },
      { status: 502 },
    );
  }
}
