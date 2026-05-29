import { NextRequest, NextResponse } from "next/server";
import { solveExercise } from "@/lib/algebra-engine";

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

    const solution = solveExercise(exercise, topic);

    return NextResponse.json(solution);
  } catch (error) {
    console.error("Error solving exercise:", error);
    return NextResponse.json(
      { error: "Error al generar la solución. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
