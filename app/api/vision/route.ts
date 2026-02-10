export const maxDuration = 30;

export async function POST(request: Request) {
  let imageDataUrl: string;

  try {
    const body = await request.json();
    imageDataUrl = body.image_data_url;
  } catch {
    return Response.json({ error: "Body JSON invalido" }, { status: 400 });
  }

  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return Response.json(
      { error: "Se requiere el campo image_data_url" },
      { status: 400 },
    );
  }

  if (!imageDataUrl.startsWith("data:image/")) {
    return Response.json(
      { error: "Formato de imagen invalido" },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[vision] OPENAI_API_KEY is missing");
    return Response.json(
      {
        error: "OPENAI_API_KEY no configurada",
        description: "",
        recommendations: "",
      },
      { status: 500 },
    );
  }

  console.log("[vision] Calling OpenAI with image length:", imageDataUrl.length);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Analiza esta imagen. Responde SOLO con un JSON válido (sin markdown) con estos campos:\n{\n  "description": "Descripción detallada (2-4 oraciones, español argentino)",\n  "recommendations": "Recomendaciones útiles (español argentino)"\n}',
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                  detail: "low",
                },
              },
            ],
          },
        ],
      }),
    });

    console.log("[vision] OpenAI status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[vision] OpenAI error:", errorText);
      return Response.json(
        {
          error: `OpenAI error ${response.status}`,
          description: "",
          recommendations: "",
        },
        { status: 502 },
      );
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content?.trim() || "";

    console.log("[vision] Raw response:", rawText.substring(0, 200));

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({
        description: rawText,
        recommendations: "",
      });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return Response.json({
        description: String(parsed.description || ""),
        recommendations: String(parsed.recommendations || ""),
      });
    } catch (e) {
      console.error("[vision] JSON parse error:", e);
      return Response.json({
        description: rawText,
        recommendations: "",
      });
    }
  } catch (err) {
    console.error("[vision] Fetch error:", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Error de red",
        description: "",
        recommendations: "",
      },
      { status: 500 },
    );
  }
}
