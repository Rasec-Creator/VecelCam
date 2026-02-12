export const maxDuration = 30;

type Language = "es" | "en" | "pt";

// Headers de CORS para permitir a Ferozo (callbotia.site)
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://callbotia.site",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const languagePrompts: Record<Language, string> = {
  es: `Analiza esta imagen. Responde SOLO con un JSON válido (sin markdown) con estos campos:
{
  "description": "Descripción detallada (2-4 oraciones, en español argentino)",
  "recommendations": "Recomendaciones útiles (en español argentino)"
}`,
  en: `Analyze this image. Respond ONLY with valid JSON (no markdown) with these fields:
{
  "description": "Detailed description (2-4 sentences, in English)",
  "recommendations": "Useful recommendations (in English)"
}`,
  pt: `Analise esta imagem. Responda APENAS com JSON válido (sem markdown) com estes campos:
{
  "description": "Descrição detalhada (2-4 frases, em português brasileiro)",
  "recommendations": "Recomendações úteis (em português brasileiro)"
}`,
};

// MANEJO DE PREFLIGHT (Obligatorio para CORS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  let imageDataUrl: string;
  let language: Language = "es";

  try {
    const body = await request.json();
    imageDataUrl = body.image_data_url;
    const incomingLanguage = body.language as string;
    language = (["es", "en", "pt"].includes(incomingLanguage) ? incomingLanguage : "es") as Language;
  } catch {
    return Response.json({ error: "Body JSON invalido" }, { status: 400, headers: corsHeaders });
  }

  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return Response.json(
      { error: "Se requiere el campo image_data_url" },
      { status: 400, headers: corsHeaders },
    );
  }

  if (!imageDataUrl.startsWith("data:image/")) {
    return Response.json(
      { error: "Formato de imagen invalido" },
      { status: 400, headers: corsHeaders },
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
      { status: 500, headers: corsHeaders },
    );
  }

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
                text: languagePrompts[language],
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


    if (!response.ok) {
      const errorText = await response.text();
      console.error("[vision] OpenAI error:", errorText);
      return Response.json(
        {
          error: `OpenAI error ${response.status}`,
          description: "",
          recommendations: "",
        },
        { status: 502, headers: corsHeaders },
      );
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content?.trim() || "";
    
    if (data?.usage) {
      console.log("Token usage:", {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      });
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({
        description: rawText,
        recommendations: "",
      }, { headers: corsHeaders });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return Response.json({
        description: String(parsed.description || ""),
        recommendations: String(parsed.recommendations || ""),
      }, { headers: corsHeaders });
    } catch (e) {
      console.error("[vision] JSON parse error:", e);
      return Response.json({
        description: rawText,
        recommendations: "",
      }, { headers: corsHeaders });
    }
  } catch (err) {
    console.error("[vision] Fetch error:", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Error de red",
        description: "",
        recommendations: "",
      },
      { status: 500, headers: corsHeaders },
    );
  }
}