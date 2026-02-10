export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { image_data_url } = req.body;

    if (!image_data_url) {
      return res.status(400).json({ error: "Missing image_data_url" });
    }

    // ✅ API KEY segura desde Vercel Environment Variables
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY not configured in Vercel",
      });
    }

    // ✅ Prompt complementario estilo "fideos → tuco"
    const prompt = `
Analiza la imagen y devuelve SOLO JSON válido con esta estructura:

{
  "description": "Breve descripción en 2 líneas",
  "recommendations": "Recomendaciones complementarias (4-6 líneas)"
}

Reglas:
- Las recomendaciones deben ser complementarias típicas.
Ejemplos:
- Si ves fideos → sugerir tuco, queso rallado, pan.
- Si ves pizza → sugerir fainá, birra.
- Si ves café → sugerir medialunas.
- Si ves asado → sugerir chimichurri, ensalada.
`;

    // ✅ OpenAI Vision Request
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: image_data_url },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        error: "OpenAI request failed",
        details: errorText,
      });
    }

    const data = await response.json();

    // Output text (JSON string)
    const text = data.output_text || "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        description: text,
        recommendations: "No se pudo interpretar JSON correctamente.",
      };
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
