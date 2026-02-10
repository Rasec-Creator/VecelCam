import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
    console.error("[v0] OPENAI_API_KEY is missing");
    return Response.json(
      {
        error: "OPENAI_API_KEY no configurada",
        description: "",
        recommendations: "",
      },
      { status: 500 },
    );
  }

  console.log("[v0] Calling OpenAI with image length:", imageDataUrl.length);

  try {
    const prompt = `Analiza esta imagen. Responde SOLO con un JSON válido (sin markdown, sin backticks) con exactamente estos dos campos:

{
  "description": "Descripción detallada de lo que ves (2-4 oraciones, en argentino con voseo)",
  "recommendations": "Recomendaciones útiles basadas en lo que ves (en argentino con voseo)"
}`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'Sos un asistente argentino. Responde SOLO con JSON válido.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image',
              image: imageDataUrl,
            },
          ],
        },
      ],
    });

    console.log("[v0] OpenAI response:", text);

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return Response.json({
      description: String(parsed.description || ""),
      recommendations: String(parsed.recommendations || ""),
    });
  } catch (err) {
    console.error("[v0] Error:", err);
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
