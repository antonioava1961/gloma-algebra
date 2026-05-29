import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/zai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exercise, studentAnswer, correctAnswer } = body;

    if (!exercise || !studentAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: "Se requieren el ejercicio, la respuesta del estudiante y la respuesta correcta" },
        { status: 400 }
      );
    }

    const completion = await chatCompletion({
      messages: [
        {
          role: "system",
          content: `Eres un profesor de álgebra que evalúa respuestas de estudiantes en español.
Debes determinar si la respuesta del estudiante es correcta, considerando:
- Equivalencias matemáticas (2/4 = 1/2, x=5 es lo mismo que 5=x, etc.)
- Diferentes formas de escribir lo mismo (√4 = 2, 2.0 = 2, etc.)
- Respuestas parcialmente correctas
- Errores comunes de formato

Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin texto adicional:
{
  "isCorrect": true/false,
  "feedback": "Retroalimentación explicativa en español. Si es incorrecto, explica por qué y da una pista. Si es correcto, felicita al estudiante.",
  "correctAnswer": "La respuesta correcta simplificada"
}
No incluyas markdown, no uses \`\`\`json, solo el objeto JSON plano.`,
        },
        {
          role: "user",
          content: `Ejercicio: ${exercise}
Respuesta del estudiante: ${studentAnswer}
Respuesta correcta: ${correctAnswer}

Evalúa si la respuesta del estudiante es correcta.
Responde SOLO con el JSON.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No se pudo verificar la respuesta" },
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

    const checkData = JSON.parse(cleanedContent);

    return NextResponse.json({
      isCorrect: checkData.isCorrect,
      feedback: checkData.feedback,
      correctAnswer: checkData.correctAnswer,
    });
  } catch (error) {
    console.error("Error checking answer:", error);
    return NextResponse.json(
      { error: "Error al verificar la respuesta. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
