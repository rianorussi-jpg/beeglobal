export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { nombre, empresa, correo, lada, telefono, interes, mensaje } = req.body || {};
  if (!nombre || !correo || !lada || !telefono || !interes || !mensaje) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_IDS || "6366835513,7681123167")
    .split(",")
    .map(id => id.trim())
    .filter(Boolean);

  if (!token || !chatIds.length) {
    return res.status(500).json({ error: "Telegram no está configurado" });
  }

  const clean = (value = "") => String(value).replace(/[<>]/g, "").trim();
  const text = [
    "🐝 NUEVO CONTACTO — BEE GLOBAL FOOD",
    "",
    `👤 Nombre: ${clean(nombre)}`,
    `🏢 Empresa: ${clean(empresa) || "No especificada"}`,
    `✉️ Correo: ${clean(correo)}`,
    `📱 Teléfono: ${clean(lada)} ${clean(telefono)}`,
    `📌 Interés: ${clean(interes)}`,
    "",
    "💬 Mensaje:",
    clean(mensaje)
  ].join("\n");

  try {
    const results = await Promise.all(chatIds.map(async (chat_id) => {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text })
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.description || "Error de Telegram");
      return body;
    }));
    return res.status(200).json({ ok: true, sent: results.length });
  } catch (error) {
    console.error("Telegram error:", error);
    return res.status(502).json({ error: "No se pudo enviar a Telegram" });
  }
}
