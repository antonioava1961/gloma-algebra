import { NextRequest, NextResponse } from "next/server";
import { generateExercise } from "@/lib/algebra-engine";

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

    const exercise = generateExercise(topic, difficulty);

    return NextResponse.json(exercise);
  } catch (error) {
    console.error("Error generating exercise:", error);
    return NextResponse.json(
      { error: "Error al generar el ejercicio. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
