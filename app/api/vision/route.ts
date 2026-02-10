// /api/vision - Image analysis via Vercel AI Gateway (direct HTTP, no AI SDK)

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

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    console.error("[v0] AI_GATEWAY_API_KEY is missing");
    return Response.json(
      {
        error: "AI_GATEWAY_API_KEY no configurada",
        description: "",
        recommendations: "",
      },
      { status: 500 },
    );
  }

  console.log("[v0] Calling AI Gateway with image length:", imageDataUrl.length);

  try {
    const gatewayResponse = await fetch(
      "https://gateway.ai.vercel.app/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          max_tokens: 700,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: 'Sos un asistente argentino. Analiza la imagen que te mando. Responde SOLAMENTE con un JSON puro (sin markdown, sin backticks, sin texto extra). El JSON tiene que tener estos dos campos exactos:\n{\n  "description": "Descripcion detallada de lo que ves (2-4 oraciones, en argentino con voseo)",\n  "recommendations": "Recomendaciones utiles basadas en lo que ves (en argentino con voseo)"\n}',
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
      },
    );

    console.log("[v0] AI Gateway status:", gatewayResponse.status);

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text();
      console.error("[v0] Gateway error body:", errorText);
      return Response.json(
        {
          error: `AI Gateway error ${gatewayResponse.status}`,
          description: "",
          recommendations: "",
        },
        { status: 502 },
      );
    }

    const data = await gatewayResponse.json();
    const rawText: string =
      data?.choices?.[0]?.message?.content?.trim() ?? "";

    console.log("[v0] AI response preview:", rawText.substring(0, 300));

    // Extract JSON from the response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return Response.json({
          description: String(parsed.description ?? ""),
          recommendations: String(parsed.recommendations ?? ""),
        });
      } catch (parseErr) {
        console.error("[v0] JSON parse error:", parseErr);
      }
    }

    // Fallback: use raw text as description
    return Response.json({
      description: rawText,
      recommendations: "",
    });
  } catch (err) {
    console.error("[v0] Fetch to AI Gateway failed:", err);
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
