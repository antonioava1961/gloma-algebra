import { NextRequest, NextResponse } from "next/server";
import { checkAnswer } from "@/lib/algebra-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exercise, studentAnswer, correctAnswer, topic } = body;

    if (!exercise || !studentAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: "Se requieren el ejercicio, la respuesta del estudiante y la respuesta correcta" },
        { status: 400 }
      );
    }

    const result = checkAnswer(exercise, studentAnswer, correctAnswer, topic || "");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking answer:", error);
    return NextResponse.json(
      { error: "Error al verificar la respuesta. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
