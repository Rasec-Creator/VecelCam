import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

const analysisSchema = z.object({
  description: z.string(),
  recommendations: z.string(),
});

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
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: analysisSchema,
      system: 'Sos un asistente argentino. Analiza la imagen y responde con JSON válido.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analiza esta imagen. Damé una descripción detallada (2-4 oraciones, en argentino con voseo) y recomendaciones útiles basadas en lo que ves (en argentino con voseo).',
            },
            {
              type: 'image',
              image: imageDataUrl,
            },
          ],
        },
      ],
    });

    console.log("[v0] OpenAI response:", result.object);

    return Response.json({
      description: result.object.description,
      recommendations: result.object.recommendations,
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
