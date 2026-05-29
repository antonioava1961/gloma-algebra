import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/zai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty } = body;

    if (!topic || !difficulty) {
      return NextResponse.json(
        { error: "Se requieren tema y dificultad" },
        { status: 400 }
      );
    }

    const completion = await chatCompletion({
      messages: [
        {
          role: "system",
          content: `Eres un profesor de álgebra experto que genera ejercicios en español. 
Debes generar un ejercicio de álgebra sobre el tema dado con la dificultad especificada.
Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional:
{
  "exercise": "El enunciado del ejercicio matemático",
  "hint": "Una pista útil sin revelar la respuesta",
  "answer": "La respuesta final simplificada"
}
No incluyas markdown, no uses \`\`\`json, solo el objeto JSON plano.`,
        },
        {
          role: "user",
          content: `Genera un ejercicio de ${difficulty} sobre ${topic}. 
El ejercicio debe ser claro y estar bien planteado.
La dificultad es: ${difficulty === "facil" ? "fácil - operaciones básicas" : difficulty === "medio" ? "medio - requiere varios pasos" : "difícil - requiere pensamiento avanzado"}.
Responde SOLO con el JSON.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No se pudo generar el ejercicio" },
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

    const exerciseData = JSON.parse(cleanedContent);

    return NextResponse.json({
      exercise: exerciseData.exercise,
      hint: exerciseData.hint,
      answer: exerciseData.answer,
    });
  } catch (error) {
    console.error("Error generating exercise:", error);
    return NextResponse.json(
      { error: "Error al generar el ejercicio. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
