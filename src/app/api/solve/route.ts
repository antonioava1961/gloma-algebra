import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exercise, topic } = body;

    if (!exercise || !topic) {
      return NextResponse.json(
        { error: "Se requieren el ejercicio y el tema" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un profesor de álgebra experto que explica soluciones paso a paso en español.
Debes generar una solución detallada paso a paso del ejercicio dado.
Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional:
{
  "steps": [
    {
      "title": "Título corto del paso",
      "explanation": "Explicación clara en español de lo que se hace en este paso y por qué",
      "calculation": "La expresión matemática o cálculo realizado (en notación simple)"
    }
  ]
}
Incluye entre 3 y 6 pasos según la complejidad del ejercicio.
Cada paso debe ser claro y educativo.
No incluyas markdown, no uses \`\`\`json, solo el objeto JSON plano.`,
        },
        {
          role: "user",
          content: `Resuelve paso a paso el siguiente ejercicio de ${topic}:
${exercise}

Proporciona una solución detallada paso a paso en español.
Responde SOLO con el JSON.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No se pudo generar la solución" },
        { status: 500 }
      );
    }

    // Parse the JSON response, handling possible markdown code blocks
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7);
    }
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    const solutionData = JSON.parse(cleanedContent);

    return NextResponse.json({
      steps: solutionData.steps,
    });
  } catch (error) {
    console.error("Error solving exercise:", error);
    return NextResponse.json(
      { error: "Error al generar la solución" },
      { status: 500 }
    );
  }
}
