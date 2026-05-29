// ============================================================================
// ALGEBRA EXERCISE GENERATOR / SOLVER / CHECKER
// Pure algorithmic implementation — no API calls required
// All text in Spanish
// ============================================================================

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Exercise {
  exercise: string;
  hint: string;
  answer: string;
}

export interface SolutionStep {
  title: string;
  explanation: string;
  calculation: string;
}

export interface Solution {
  steps: SolutionStep[];
}

export interface CheckResult {
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
}

type Difficulty = "facil" | "medio" | "dificil";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function simplifyFraction(num: number, den: number): [number, number] {
  if (den === 0) return [num, den];
  const g = gcd(Math.abs(num), Math.abs(den));
  let sn = num / g;
  let sd = den / g;
  if (sd < 0) {
    sn = -sn;
    sd = -sd;
  }
  return [sn, sd];
}

function formatFraction(num: number, den: number): string {
  const [sn, sd] = simplifyFraction(num, den);
  if (sd === 1) return sn.toString();
  return `${sn}/${sd}`;
}

/** Format a coefficient before a variable: 1→x, -1→-x, 2→2x */
function fmtCoef(n: number, v: string = "x"): string {
  if (n === 1) return v;
  if (n === -1) return `-${v}`;
  return `${n}${v}`;
}

/** Format a constant term with sign: + 3, - 5, or just the number if first */
function fmtConst(n: number, isFirst: boolean = false): string {
  if (isFirst) return n.toString();
  if (n >= 0) return `+ ${n}`;
  return `- ${Math.abs(n)}`;
}

/** Format a coefficient + variable term with sign */
function fmtTermCoef(n: number, v: string, isFirst: boolean = false): string {
  if (n === 0) return "";
  const absStr = fmtCoef(Math.abs(n), v);
  if (isFirst) {
    return n < 0 ? `-${absStr}` : absStr;
  }
  return n < 0 ? `- ${absStr}` : `+ ${absStr}`;
}

/** Format a full polynomial string from coefficient array (index = degree) */
function fmtPoly(coefs: number[], v: string = "x"): string {
  const parts: string[] = [];
  for (let i = coefs.length - 1; i >= 0; i--) {
    if (coefs[i] === 0) continue;
    const isFirst = parts.length === 0;
    if (i === 0) {
      parts.push(fmtConst(coefs[i], isFirst));
    } else if (i === 1) {
      parts.push(fmtTermCoef(coefs[i], v, isFirst));
    } else {
      const sup = toSuperscript(i);
      parts.push(fmtTermCoef(coefs[i], `${v}${sup}`, isFirst));
    }
  }
  return parts.length === 0 ? "0" : parts.join(" ");
}

function toSuperscript(n: number): string {
  const sup: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  };
  return n
    .toString()
    .split("")
    .map((c) => sup[c] ?? c)
    .join("");
}

/** Remove all whitespace from a string */
function noSpaces(s: string): string {
  return s.replace(/\s+/g, "");
}

/** Normalize an answer string for comparison */
function normalizeAnswer(ans: string): string {
  let s = ans.trim().toLowerCase();
  // Remove spaces
  s = noSpaces(s);
  // Normalize unicode minus to regular minus
  s = s.replace(/−/g, "-");
  // Normalize × to *
  s = s.replace(/×/g, "*");
  // Normalize · to *
  s = s.replace(/·/g, "*");
  return s;
}

/** Try to evaluate a simple numeric expression (fraction, decimal, integer) */
function evalNumeric(s: string): number | null {
  const n = normalizeAnswer(s);
  // Handle fractions: a/b
  const fracMatch = n.match(/^(-?\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1]);
    const den = parseInt(fracMatch[2]);
    if (den !== 0) return num / den;
  }
  // Handle decimals or integers
  const numVal = parseFloat(n);
  if (!isNaN(numVal)) return numVal;
  return null;
}

/** Check if two numeric strings are equivalent */
function numericEqual(a: string, b: string): boolean {
  const va = evalNumeric(a);
  const vb = evalNumeric(b);
  if (va !== null && vb !== null) {
    return Math.abs(va - vb) < 1e-9;
  }
  return false;
}

/** Check if two "x = value" answers match */
function variableAnswerEqual(student: string, correct: string): boolean {
  const sn = normalizeAnswer(student);
  const cn = normalizeAnswer(correct);

  // Direct match
  if (sn === cn) return true;

  // Try extracting the numeric value after "x="
  const sExtract = sn.replace(/x\s*=/, "").replace(/=\s*x/, "");
  const cExtract = cn.replace(/x\s*=/, "").replace(/=\s*x/, "");

  return numericEqual(sExtract, cExtract);
}

/** Parse a simple linear expression ax + b into [a, b] */
function parseLinearExpr(expr: string): [number, number] {
  let s = expr.replace(/\s+/g, "");
  let a = 0;
  let b = 0;

  const tokens = s.match(/[+-]?[^+-]+/g) || [];
  for (const token of tokens) {
    const t = token.trim();
    if (t.includes("x")) {
      const coefStr = t.replace("x", "");
      if (coefStr === "" || coefStr === "+") a += 1;
      else if (coefStr === "-") a -= 1;
      else a += parseInt(coefStr);
    } else {
      const val = parseInt(t);
      if (!isNaN(val)) b += val;
    }
  }
  return [a, b];
}

// ============================================================================
// TOPIC: ECUACIONES LINEALES
// ============================================================================

function generateLinearEquation(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // ax + b = c
    const x = randInt(-10, 10);
    const a = randInt(2, 9) * randChoice([1, -1]);
    const b = randInt(-10, 10);
    const c = a * x + b;

    const exercise = `${fmtTermCoef(a, "x", true)} ${fmtConst(b)} = ${c}`;
    const hint = "Aísla la variable x moviendo los términos constantes al otro lado.";
    const answer = `x = ${x}`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // ax + b = cx + d
    const x = randInt(-8, 8);
    const a = randInt(2, 7);
    const c = randInt(1, a - 1); // ensure a != c
    const b = randInt(-8, 8);
    const d = a * x + b - c * x;

    const exercise = `${fmtTermCoef(a, "x", true)} ${fmtConst(b)} = ${fmtTermCoef(c, "x", true)} ${fmtConst(d)}`;
    const hint = "Agrupa los términos con x en un lado y las constantes en el otro.";
    const answer = `x = ${x}`;

    return { exercise, hint, answer };
  }

  // dificil: a(bx + c) = d  or  ax/b + c = d
  const variant = randInt(0, 1);
  if (variant === 0) {
    // a(bx + c) = d
    const x = randInt(-5, 5);
    const a = randInt(2, 5);
    const b = randInt(2, 5) * randChoice([1, -1]);
    const c = randInt(-5, 5);
    const d = a * (b * x + c);

    const inner = `${fmtTermCoef(b, "x", true)} ${fmtConst(c)}`;
    const exercise = `${a}(${inner}) = ${d}`;
    const hint = "Distribuye el coeficiente exterior y luego aisla x.";
    const answer = `x = ${x}`;

    return { exercise, hint, answer };
  } else {
    // ax/b + c = d  (ensuring integer solution)
    const x = randInt(-6, 6);
    const b = randInt(2, 5);
    const a = b * randInt(2, 6) * randChoice([1, -1]);
    const c = randInt(-8, 8);
    const d = a * x / b + c;

    const exercise = `${a}x/${b} ${fmtConst(c)} = ${d}`;
    const hint = "Primero elimina la fracción multiplicando toda la ecuación por el denominador.";
    const answer = `x = ${x}`;

    return { exercise, hint, answer };
  }
}

function solveLinearEquation(exercise: string, _difficulty: Difficulty): Solution {
  const steps: SolutionStep[] = [];

  // Try to parse ax + b = cx + d
  const eqParts = exercise.split("=");
  if (eqParts.length !== 2) {
    return { steps: [{ title: "Error", explanation: "No se pudo parsear la ecuación.", calculation: exercise }] };
  }

  const left = eqParts[0].trim();
  const right = eqParts[1].trim();

  // Check for a(bx + c) = d format
  const distMatch = left.match(/^(-?\d+)\((.+)\)$/);

  if (distMatch) {
    const outerCoef = parseInt(distMatch[1]);
    const inner = distMatch[2];
    const [innerA, innerB] = parseLinearExpr(inner);
    const d = parseInt(right);

    steps.push({
      title: "Identificar la ecuación",
      explanation: "Tenemos una ecuación con paréntesis que debemos expandir.",
      calculation: exercise,
    });

    const distA = outerCoef * innerA;
    const distB = outerCoef * innerB;
    steps.push({
      title: "Distribuir",
      explanation: `Multiplicamos ${outerCoef} por cada término dentro del paréntesis.`,
      calculation: `${outerCoef} · ${fmtTermCoef(innerA, "x", true)} = ${fmtTermCoef(distA, "x", true)};  ${outerCoef} · (${innerB < 0 ? "" : "+"})${innerB} = ${distB}`,
    });

    const newLeft = `${fmtTermCoef(distA, "x", true)} ${fmtConst(distB)}`;
    steps.push({
      title: "Ecuación expandida",
      explanation: "Después de distribuir obtenemos una ecuación lineal simple.",
      calculation: `${newLeft} = ${d}`,
    });

    const movedConst = d - distB;
    steps.push({
      title: "Mover constante",
      explanation: `Restamos ${distB} de ambos lados.`,
      calculation: `${fmtTermCoef(distA, "x", true)} = ${d} - (${distB}) = ${movedConst}`,
    });

    const x = movedConst / distA;
    const xStr = Number.isInteger(x) ? x.toString() : formatFraction(movedConst, distA);
    steps.push({
      title: "Dividir por el coeficiente",
      explanation: `Dividimos ambos lados por ${distA}.`,
      calculation: `x = ${movedConst} / ${distA} = ${xStr}`,
    });

    return { steps };
  }

  // Check for ax/b + c = d format
  const fracMatch = left.match(/^(-?\d+)x\/(\d+)([+-]\d+)?$/);

  if (fracMatch) {
    const a = parseInt(fracMatch[1]);
    const b = parseInt(fracMatch[2]);
    const c = fracMatch[3] ? parseInt(fracMatch[3]) : 0;
    const d = parseInt(right);

    steps.push({
      title: "Identificar la ecuación",
      explanation: "Tenemos una ecuación con una fracción.",
      calculation: exercise,
    });

    steps.push({
      title: "Multiplicar por el denominador",
      explanation: `Multiplicamos toda la ecuación por ${b} para eliminar el denominador.`,
      calculation: `${a}x ${fmtConst(c * b, true)} = ${d * b}`,
    });

    const newC = c * b;
    const newD = d * b;
    const movedConst = newD - newC;
    steps.push({
      title: "Mover constante",
      explanation: `Restamos ${newC} de ambos lados.`,
      calculation: `${a}x = ${movedConst}`,
    });

    const x = movedConst / a;
    const xStr = Number.isInteger(x) ? x.toString() : formatFraction(movedConst, a);
    steps.push({
      title: "Dividir por el coeficiente",
      explanation: `Dividimos ambos lados por ${a}.`,
      calculation: `x = ${movedConst} / ${a} = ${xStr}`,
    });

    return { steps };
  }

  // Standard: parse both sides
  const [la, lb] = parseLinearExpr(left);
  const [ra, rb] = parseLinearExpr(right);

  steps.push({
    title: "Identificar la ecuación",
    explanation: "Reconocemos los coeficientes de cada lado de la ecuación.",
    calculation: exercise,
  });

  const moveA = la - ra;
  const moveB = rb - lb;

  if (ra !== 0 || la !== 0) {
    steps.push({
      title: "Agrupar términos con x",
      explanation: `Movemos los términos con x a la izquierda y las constantes a la derecha.`,
      calculation: `${fmtTermCoef(la - ra, "x", true)} = ${fmtConst(rb - lb, true)}`,
    });
  }

  if (moveA === 0) {
    steps.push({
      title: "Sin variable",
      explanation: "Los términos con x se cancelan. Verifica la ecuación.",
      calculation: `0 = ${moveB}`,
    });
    return { steps };
  }

  const x = moveB / moveA;
  const xStr = Number.isInteger(x) ? x.toString() : formatFraction(moveB, moveA);

  steps.push({
    title: "Dividir por el coeficiente",
    explanation: `Dividimos ambos lados por ${moveA} para despejar x.`,
    calculation: `x = ${moveB} / ${moveA} = ${xStr}`,
  });

  return { steps };
}

function checkLinearEquation(studentAnswer: string, correctAnswer: string): CheckResult {
  const isCorrect = variableAnswerEqual(studentAnswer, correctAnswer);
  return {
    isCorrect,
    feedback: isCorrect
      ? "¡Correcto! Has resuelto la ecuación lineal correctamente."
      : "Respuesta incorrecta. Recuerda aislar la variable x paso a paso.",
    correctAnswer,
  };
}

// ============================================================================
// TOPIC: ECUACIONES CUADRÁTICAS
// ============================================================================

function generateQuadraticEquation(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // x² + bx + c = 0 with integer roots, ensure b != 0
    let r1: number, r2: number, b: number, c: number;
    do {
      r1 = randInt(-8, 8);
      r2 = randInt(-8, 8);
      b = -(r1 + r2);
      c = r1 * r2;
    } while (b === 0 && c === 0); // avoid trivial 0 = 0

    const exercise = `${fmtPoly([c, b, 1], "x")} = 0`;
    const hint = "Busca dos números que multiplicados den el término independiente y sumados el coeficiente de x.";
    const answer = `x = ${r1}, x = ${r2}`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // ax² + bx + c = 0 with integer roots, a > 1
    const a = randInt(2, 4);
    let r1: number, r2: number, bCoef: number, cCoef: number;
    do {
      r1 = randInt(-6, 6);
      r2 = randInt(-6, 6);
      bCoef = -a * (r1 + r2);
      cCoef = a * r1 * r2;
    } while (bCoef === 0 && cCoef === 0); // avoid degenerate

    const exercise = `${fmtPoly([cCoef, bCoef, a], "x")} = 0`;
    const hint = "Factoriza la expresión buscando factores comunes o aplica la fórmula cuadrática.";
    const answer = `x = ${r1}, x = ${r2}`;

    return { exercise, hint, answer };
  }

  // dificil: ax² + bx + c = 0 requiring quadratic formula
  const aD = randInt(1, 3);
  const r1 = randInt(-8, 8);
  const r2 = randInt(-8, 8);
  // a*x² + bx + c where roots are r1 and r2
  // So a(x-r1)(x-r2) = ax² - a(r1+r2)x + a*r1*r2
  const bCoef = -aD * (r1 + r2);
  const cCoef = aD * r1 * r2;

  const exercise = `${fmtPoly([cCoef, bCoef, aD], "x")} = 0`;
  const hint = "Aplica la fórmula cuadrática: x = (-b ± √(b² - 4ac)) / (2a)";
  const answer = `x = ${r1}, x = ${r2}`;

  return { exercise, hint, answer };
}

function solveQuadraticEquation(exercise: string): Solution {
  const steps: SolutionStep[] = [];

  // Parse ax² + bx + c = 0 using parsePolyCoefs for robustness
  const eqParts = exercise.split("=");
  const expr = eqParts[0].trim().replace(/\s*=\s*0\s*/, "").trim();

  // Use the shared parser
  const parsed = parsePolyCoefs(expr);
  const a = parsed[2] || 0;
  const b = parsed[1] || 0;
  const c = parsed[0] || 0;

  steps.push({
    title: "Identificar coeficientes",
    explanation: "En la ecuación ax² + bx + c = 0, identificamos los coeficientes.",
    calculation: `a = ${a}, b = ${b}, c = ${c}`,
  });

  const discriminant = b * b - 4 * a * c;

  steps.push({
    title: "Calcular el discriminante",
    explanation: "El discriminante Δ = b² - 4ac determina la naturaleza de las raíces.",
    calculation: `Δ = (${b})² - 4(${a})(${c}) = ${b * b} - ${4 * a * c} = ${discriminant}`,
  });

  if (discriminant < 0) {
    steps.push({
      title: "Sin soluciones reales",
      explanation: "El discriminante es negativo, la ecuación no tiene soluciones reales.",
      calculation: "No hay soluciones reales",
    });
    return { steps };
  }

  if (discriminant === 0) {
    const x = -b / (2 * a);
    const xStr = Number.isInteger(x) ? x.toString() : formatFraction(-b, 2 * a);
    steps.push({
      title: "Raíz doble",
      explanation: "El discriminante es cero, hay una única raíz real (doble).",
      calculation: `x = -b/(2a) = ${-b}/${2 * a} = ${xStr}`,
    });
    return { steps };
  }

  // Try factoring first (if discriminant is a perfect square)
  const sqrtDisc = Math.sqrt(discriminant);
  if (Number.isInteger(sqrtDisc)) {
    const r1 = (-b + sqrtDisc) / (2 * a);
    const r2 = (-b - sqrtDisc) / (2 * a);

    if (Number.isInteger(r1) && Number.isInteger(r2)) {
      steps.push({
        title: "Factorizar",
        explanation: "Como el discriminante es un cuadrado perfecto, podemos factorizar.",
        calculation: `${a === 1 ? "" : a}(x ${r1 >= 0 ? "- " + r1 : "+ " + Math.abs(r1)})(x ${r2 >= 0 ? "- " + r2 : "+ " + Math.abs(r2)}) = 0`,
      });

      steps.push({
        title: "Igualar cada factor a cero",
        explanation: "Cada factor nos da una solución.",
        calculation: `x = ${r1}, x = ${r2}`,
      });
    } else {
      steps.push({
        title: "Aplicar fórmula cuadrática",
        explanation: "Usamos la fórmula general para encontrar las raíces.",
        calculation: `x = (-${b} ± √${discriminant}) / (2 · ${a})`,
      });

      const r1Str = Number.isInteger(r1) ? r1.toString() : formatFraction(-b + sqrtDisc, 2 * a);
      const r2Str = Number.isInteger(r2) ? r2.toString() : formatFraction(-b - sqrtDisc, 2 * a);
      steps.push({
        title: "Calcular las raíces",
        explanation: "Evaluamos ambas soluciones de la fórmula.",
        calculation: `x₁ = ${r1Str}, x₂ = ${r2Str}`,
      });
    }
  } else {
    steps.push({
      title: "Aplicar fórmula cuadrática",
      explanation: "El discriminante no es un cuadrado perfecto, usamos la fórmula general.",
      calculation: `x = (-${b} ± √${discriminant}) / (2 · ${a})`,
    });

    const r1 = (-b + sqrtDisc) / (2 * a);
    const r2 = (-b - sqrtDisc) / (2 * a);
    const r1Round = Math.round(r1 * 1000) / 1000;
    const r2Round = Math.round(r2 * 1000) / 1000;
    steps.push({
      title: "Calcular las raíces",
      explanation: "Evaluamos ambas soluciones con aproximación decimal.",
      calculation: `x₁ ≈ ${r1Round}, x₂ ≈ ${r2Round}`,
    });
  }

  return { steps };
}

function checkQuadraticEquation(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  // Direct match
  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! Has encontrado ambas raíces.", correctAnswer };
  }

  // Extract individual roots
  const sRoots = sn.split(/,|y/).map((s) => s.replace(/x\s*=/g, "").trim()).filter(Boolean);
  const cRoots = cn.split(/,|y/).map((s) => s.replace(/x\s*=/g, "").trim()).filter(Boolean);

  // Check if both roots match (order doesn't matter)
  if (sRoots.length === cRoots.length && cRoots.length === 2) {
    const sVals = sRoots.map((r) => evalNumeric(r)).filter((v) => v !== null);
    const cVals = cRoots.map((r) => evalNumeric(r)).filter((v) => v !== null);
    if (sVals.length === 2 && cVals.length === 2) {
      const match =
        (Math.abs(sVals[0] - cVals[0]) < 1e-6 && Math.abs(sVals[1] - cVals[1]) < 1e-6) ||
        (Math.abs(sVals[0] - cVals[1]) < 1e-6 && Math.abs(sVals[1] - cVals[0]) < 1e-6);
      if (match) {
        return { isCorrect: true, feedback: "¡Correcto! Has encontrado ambas raíces.", correctAnswer };
      }
    }
  }

  // Check if single root matches one of the correct ones
  if (sRoots.length === 1 && cRoots.length === 2) {
    const sv = evalNumeric(sRoots[0]);
    if (sv !== null) {
      for (const cr of cRoots) {
        const cv = evalNumeric(cr);
        if (cv !== null && Math.abs(sv - cv) < 1e-6) {
          return {
            isCorrect: false,
            feedback: "Encontraste una raíz, pero falta la otra. Recuerda que una ecuación cuadrática tiene dos soluciones.",
            correctAnswer,
          };
        }
      }
    }
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Verifica tus cálculos con la fórmula cuadrática.",
    correctAnswer,
  };
}

// ============================================================================
// TOPIC: SISTEMAS DE ECUACIONES
// ============================================================================

function generateSystemOfEquations(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    const x = randInt(-5, 5);
    const y = randInt(-5, 5);
    const a1 = randInt(1, 5);
    const b1 = randInt(1, 5);
    const c1 = a1 * x + b1 * y;
    const a2 = randInt(1, 5);
    const b2 = randInt(1, 5);
    const c2 = a2 * x + b2 * y;

    // Ensure the system has a unique solution (determinant != 0)
    if (a1 * b2 === a2 * b1) return generateSystemOfEquations(difficulty);

    const exercise = `${fmtTermCoef(a1, "x", true)} ${fmtTermCoef(b1, "y")} = ${c1}\n${fmtTermCoef(a2, "x", true)} ${fmtTermCoef(b2, "y")} = ${c2}`;
    const hint = "Usa el método de sustitución o eliminación para resolver el sistema.";
    const answer = `x = ${x}, y = ${y}`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    const x = randInt(-8, 8);
    const y = randInt(-8, 8);
    const a1 = randInt(2, 6) * randChoice([1, -1]);
    const b1 = randInt(2, 6) * randChoice([1, -1]);
    const c1 = a1 * x + b1 * y;
    let a2 = randInt(2, 6) * randChoice([1, -1]);
    let b2 = randInt(2, 6) * randChoice([1, -1]);

    // Ensure unique solution
    if (a1 * b2 === a2 * b1) {
      a2 += 1;
    }
    const c2 = a2 * x + b2 * y;

    const exercise = `${fmtTermCoef(a1, "x", true)} ${fmtTermCoef(b1, "y")} = ${c1}\n${fmtTermCoef(a2, "x", true)} ${fmtTermCoef(b2, "y")} = ${c2}`;
    const hint = "Multiplica una o ambas ecuaciones para eliminar una variable.";
    const answer = `x = ${x}, y = ${y}`;

    return { exercise, hint, answer };
  }

  // dificil
  const x = randInt(-10, 10);
  const y = randInt(-10, 10);
  const a1 = randInt(3, 8) * randChoice([1, -1]);
  const b1 = randInt(3, 8) * randChoice([1, -1]);
  const c1 = a1 * x + b1 * y;
  let a2 = randInt(3, 8) * randChoice([1, -1]);
  let b2 = randInt(3, 8) * randChoice([1, -1]);

  if (a1 * b2 === a2 * b1) {
    a2 += 2;
  }
  const c2 = a2 * x + b2 * y;

  const exercise = `${fmtTermCoef(a1, "x", true)} ${fmtTermCoef(b1, "y")} = ${c1}\n${fmtTermCoef(a2, "x", true)} ${fmtTermCoef(b2, "y")} = ${c2}`;
  const hint = "Usa eliminación: multiplica las ecuaciones por factores adecuados para eliminar una variable.";
  const answer = `x = ${x}, y = ${y}`;

  return { exercise, hint, answer };
}

function solveSystemOfEquations(exercise: string): Solution {
  const steps: SolutionStep[] = [];
  const lines = exercise.trim().split("\n");

  if (lines.length < 2) {
    return { steps: [{ title: "Error", explanation: "Se esperan dos ecuaciones.", calculation: exercise }] };
  }

  const parseLinearWithY = (expr: string): [number, number, number] => {
    let s = expr.replace(/\s+/g, "");
    let xCoef = 0, yCoef = 0, constVal = 0;

    const eqParts = s.split("=");
    if (eqParts.length !== 2) return [0, 0, 0];
    const left = eqParts[0];
    const right = parseInt(eqParts[1]);

    const tokens = left.match(/[+-]?[^+-]+/g) || [];
    for (const token of tokens) {
      const t = token.trim();
      if (t.includes("x")) {
        const coefStr = t.replace("x", "");
        if (coefStr === "" || coefStr === "+") xCoef = 1;
        else if (coefStr === "-") xCoef = -1;
        else xCoef = parseInt(coefStr);
      } else if (t.includes("y")) {
        const coefStr = t.replace("y", "");
        if (coefStr === "" || coefStr === "+") yCoef = 1;
        else if (coefStr === "-") yCoef = -1;
        else yCoef = parseInt(coefStr);
      }
    }
    constVal = right;

    return [xCoef, yCoef, constVal];
  };

  const [a1, b1, c1] = parseLinearWithY(lines[0]);
  const [a2, b2, c2] = parseLinearWithY(lines[1]);

  steps.push({
    title: "Identificar el sistema",
    explanation: "Escribimos el sistema identificando los coeficientes de cada ecuación.",
    calculation: `Ecuación 1: ${fmtTermCoef(a1, "x", true)} ${fmtTermCoef(b1, "y")} = ${c1}\nEcuación 2: ${fmtTermCoef(a2, "x", true)} ${fmtTermCoef(b2, "y")} = ${c2}`,
  });

  // Elimination method
  const det = a1 * b2 - a2 * b1;

  steps.push({
    title: "Calcular el determinante",
    explanation: "Verificamos que el sistema tiene solución única.",
    calculation: `det = (${a1})(${b2}) - (${a2})(${b1}) = ${a1 * b2} - ${a2 * b1} = ${det}`,
  });

  if (det === 0) {
    steps.push({
      title: "Sistema sin solución única",
      explanation: "El determinante es cero, el sistema no tiene solución única.",
      calculation: "El sistema es dependiente o incompatible.",
    });
    return { steps };
  }

  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;

  const xStr = Number.isInteger(x) ? x.toString() : formatFraction(c1 * b2 - c2 * b1, det);
  const yStr = Number.isInteger(y) ? y.toString() : formatFraction(a1 * c2 - a2 * c1, det);

  // Show elimination step
  const mult1 = Math.abs(b2);
  const mult2 = Math.abs(b1);
  const lcmVal = lcm(Math.abs(b1), Math.abs(b2));

  steps.push({
    title: "Eliminar una variable",
    explanation: `Multiplicamos las ecuaciones para eliminar y.`,
    calculation: `Ecuación 1 × ${lcmVal / Math.abs(b1)}, Ecuación 2 × ${lcmVal / Math.abs(b2)}`,
  });

  steps.push({
    title: "Resolver para x",
    explanation: "Después de eliminar y, resolvemos para x.",
    calculation: `x = ${xStr}`,
  });

  steps.push({
    title: "Sustituir para encontrar y",
    explanation: "Sustituimos x en una de las ecuaciones originales.",
    calculation: `y = ${yStr}`,
  });

  steps.push({
    title: "Solución del sistema",
    explanation: "La solución es el punto de intersección de ambas rectas.",
    calculation: `x = ${xStr}, y = ${yStr}`,
  });

  return { steps };
}

function checkSystemOfEquations(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! Has resuelto el sistema correctamente.", correctAnswer };
  }

  // Extract x and y values
  const extractXY = (s: string): { x: number | null; y: number | null } => {
    const xMatch = s.match(/x\s*=\s*(-?[\d.\/]+)/);
    const yMatch = s.match(/y\s*=\s*(-?[\d.\/]+)/);
    return {
      x: xMatch ? evalNumeric(xMatch[1]) : null,
      y: yMatch ? evalNumeric(yMatch[1]) : null,
    };
  };

  const sVals = extractXY(sn);
  const cVals = extractXY(cn);

  if (sVals.x !== null && sVals.y !== null && cVals.x !== null && cVals.y !== null) {
    if (Math.abs(sVals.x - cVals.x) < 1e-6 && Math.abs(sVals.y - cVals.y) < 1e-6) {
      return { isCorrect: true, feedback: "¡Correcto! Has resuelto el sistema correctamente.", correctAnswer };
    }
    // Check swapped
    if (Math.abs(sVals.x - cVals.y) < 1e-6 && Math.abs(sVals.y - cVals.x) < 1e-6) {
      return {
        isCorrect: false,
        feedback: "Parece que intercambiaste los valores de x e y. Verifica qué variable corresponde a cada valor.",
        correctAnswer,
      };
    }
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Verifica tu método de sustitución o eliminación.",
    correctAnswer,
  };
}

// ============================================================================
// TOPIC: POLINOMIOS
// ============================================================================

interface Poly {
  coefs: number[]; // coefs[i] = coefficient of x^i
}

function polyAdd(p: Poly, q: Poly): Poly {
  const maxLen = Math.max(p.coefs.length, q.coefs.length);
  const result: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    result.push((p.coefs[i] || 0) + (q.coefs[i] || 0));
  }
  return { coefs: result };
}

function polySub(p: Poly, q: Poly): Poly {
  const maxLen = Math.max(p.coefs.length, q.coefs.length);
  const result: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    result.push((p.coefs[i] || 0) - (q.coefs[i] || 0));
  }
  return { coefs: result };
}

function polyMul(p: Poly, q: Poly): Poly {
  const resultLen = p.coefs.length + q.coefs.length - 1;
  const result: number[] = new Array(resultLen).fill(0);
  for (let i = 0; i < p.coefs.length; i++) {
    for (let j = 0; j < q.coefs.length; j++) {
      result[i + j] += p.coefs[i] * q.coefs[j];
    }
  }
  return { coefs: result };
}

function trimPoly(p: Poly): Poly {
  let coefs = [...p.coefs];
  while (coefs.length > 1 && coefs[coefs.length - 1] === 0) {
    coefs.pop();
  }
  return { coefs };
}

function fmtPolyObj(p: Poly, v: string = "x"): string {
  const tp = trimPoly(p);
  return fmtPoly(tp.coefs, v);
}

function generatePolynomial(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // Addition of two polynomials
    const p1: Poly = { coefs: [randInt(-5, 5), randInt(-5, 5), randInt(1, 5)] };
    const p2: Poly = { coefs: [randInt(-5, 5), randInt(-5, 5), randInt(-5, 5)] };

    const result = trimPoly(polyAdd(p1, p2));
    const op = "+";
    const exercise = `(${fmtPolyObj(p1)}) ${op} (${fmtPolyObj(p2)})`;
    const hint = "Suma los coeficientes de los términos del mismo grado.";
    const answer = fmtPolyObj(result);

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // Subtraction of polynomials
    const p1: Poly = { coefs: [randInt(-5, 5), randInt(-5, 5), randInt(1, 5)] };
    const p2: Poly = { coefs: [randInt(-5, 5), randInt(-5, 5), randInt(-5, 5)] };

    const result = trimPoly(polySub(p1, p2));
    const exercise = `(${fmtPolyObj(p1)}) - (${fmtPolyObj(p2)})`;
    const hint = "Recuerda cambiar el signo de cada término del segundo polinomio al restar.";
    const answer = fmtPolyObj(result);

    return { exercise, hint, answer };
  }

  // dificil: Multiplication of polynomials
  const p1: Poly = { coefs: [randInt(-5, 5), randInt(1, 5)] }; // linear
  const p2: Poly = { coefs: [randInt(-5, 5), randInt(1, 5)] }; // linear

  const result = trimPoly(polyMul(p1, p2));
  const exercise = `(${fmtPolyObj(p1)}) · (${fmtPolyObj(p2)})`;
  const hint = "Aplica la propiedad distributiva: multiplica cada término del primer polinomio por cada término del segundo.";
  const answer = fmtPolyObj(result);

  return { exercise, hint, answer };
}

function solvePolynomial(exercise: string): Solution {
  const steps: SolutionStep[] = [];

  // Detect operation
  const isSubtraction = exercise.includes(") - (");
  const isAddition = exercise.includes(") + (");
  const isMultiplication = exercise.includes(") · (") || exercise.includes(") * (");

  // Parse the two polynomials inside parentheses
  const polyRegex = /\(([^)]+)\)/g;
  const polys: Poly[] = [];
  let match: RegExpExecArray | null;
  while ((match = polyRegex.exec(exercise)) !== null) {
    const coefs = parsePolyCoefs(match[1]);
    polys.push({ coefs });
  }

  if (polys.length < 2) {
    return { steps: [{ title: "Error", explanation: "No se pudieron identificar los polinomios.", calculation: exercise }] };
  }

  const p1 = polys[0];
  const p2 = polys[1];

  steps.push({
    title: "Identificar los polinomios",
    explanation: "Reconocemos cada polinomio y sus términos.",
    calculation: `Primer polinomio: ${fmtPolyObj(p1)}\nSegundo polinomio: ${fmtPolyObj(p2)}`,
  });

  if (isAddition) {
    const result = trimPoly(polyAdd(p1, p2));
    steps.push({
      title: "Sumar términos del mismo grado",
      explanation: "Agrupamos y sumamos los coeficientes de los términos del mismo grado.",
      calculation: fmtPolyObj(result),
    });
    steps.push({
      title: "Resultado",
      explanation: "El resultado de la suma es:",
      calculation: fmtPolyObj(result),
    });
  } else if (isSubtraction) {
    steps.push({
      title: "Cambiar signos del segundo polinomio",
      explanation: "Al restar, cambiamos el signo de cada término del segundo polinomio.",
      calculation: `-${fmtPolyObj(p2)} = ${fmtPolyObj({ coefs: p2.coefs.map((c) => -c) })}`,
    });
    const result = trimPoly(polySub(p1, p2));
    steps.push({
      title: "Sumar los términos",
      explanation: "Ahora sumamos los términos del mismo grado.",
      calculation: fmtPolyObj(result),
    });
    steps.push({
      title: "Resultado",
      explanation: "El resultado de la resta es:",
      calculation: fmtPolyObj(result),
    });
  } else if (isMultiplication) {
    steps.push({
      title: "Aplicar propiedad distributiva",
      explanation: "Multiplicamos cada término del primer polinomio por cada término del segundo.",
      calculation: `Distribuir: cada término de ${fmtPolyObj(p1)} por cada término de ${fmtPolyObj(p2)}`,
    });

    const result = trimPoly(polyMul(p1, p2));

    // Show individual products
    const partials: string[] = [];
    for (let i = 0; i < p1.coefs.length; i++) {
      if (p1.coefs[i] === 0) continue;
      for (let j = 0; j < p2.coefs.length; j++) {
        if (p2.coefs[i] === 0) continue;
        const prodCoef = p1.coefs[i] * p2.coefs[j];
        const degree = i + j;
        if (degree === 0) partials.push(`${prodCoef}`);
        else if (degree === 1) partials.push(fmtCoef(prodCoef, "x"));
        else partials.push(fmtCoef(prodCoef, `x${toSuperscript(degree)}`));
      }
    }
    if (partials.length > 0) {
      steps.push({
        title: "Productos parciales",
        explanation: "Cada producto parcial:",
        calculation: partials.join(" + "),
      });
    }

    steps.push({
      title: "Resultado",
      explanation: "Combinamos los términos semejantes para obtener el resultado final.",
      calculation: fmtPolyObj(result),
    });
  }

  return { steps };
}

/** Parse polynomial coefficients from string like "3x² + 2x - 1" */
function parsePolyCoefs(s: string): number[] {
  let str = s.replace(/\s+/g, "");
  const coefs: number[] = [];
  const tokens = str.match(/[+-]?[^+-]+/g) || [];

  for (const token of tokens) {
    const t = token.trim();
    if (t.includes("x²") || t.includes("x²")) {
      const deg = 2;
      const coefStr = t.replace(/x²/g, "");
      const coef = coefStr === "" || coefStr === "+" ? 1 : coefStr === "-" ? -1 : parseInt(coefStr);
      while (coefs.length <= deg) coefs.push(0);
      coefs[deg] += coef;
    } else if (t.includes("x")) {
      const deg = 1;
      const coefStr = t.replace("x", "");
      const coef = coefStr === "" || coefStr === "+" ? 1 : coefStr === "-" ? -1 : parseInt(coefStr);
      while (coefs.length <= deg) coefs.push(0);
      coefs[deg] += coef;
    } else {
      const val = parseInt(t);
      while (coefs.length <= 0) coefs.push(0);
      coefs[0] += val;
    }
  }
  return coefs;
}

function checkPolynomial(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! La operación con polinomios es correcta.", correctAnswer };
  }

  // Parse both as polynomials and compare
  const sCoefs = parsePolyCoefs(studentAnswer);
  const cCoefs = parsePolyCoefs(correctAnswer);

  const maxLen = Math.max(sCoefs.length, cCoefs.length);
  let match = true;
  for (let i = 0; i < maxLen; i++) {
    if ((sCoefs[i] || 0) !== (cCoefs[i] || 0)) {
      match = false;
      break;
    }
  }

  if (match) {
    return { isCorrect: true, feedback: "¡Correcto! La operación con polinomios es correcta.", correctAnswer };
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Revisa la combinación de términos semejantes.",
    correctAnswer,
  };
}

// ============================================================================
// TOPIC: FACTORIZACIÓN
// ============================================================================

function generateFactoring(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // Common factor: ensure the extracted factor is actually the GCD
    const a = randInt(2, 6);
    // Make sure bx and c are coprime so that a is truly the GCD
    let bx: number, c: number;
    do {
      bx = randInt(1, 5);
      c = randInt(1, 5) * randChoice([1, -1]);
    } while (gcd(bx, Math.abs(c)) !== 1);

    const term1 = a * bx;
    const term2 = a * c;

    const exercise = `${fmtTermCoef(term1, "x", true)} ${fmtConst(term2)}`;
    const hint = "Busca el factor común en todos los términos.";
    const answer = `${a}(${fmtTermCoef(bx, "x", true)} ${fmtConst(c)})`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // Difference of squares: x² - a² = (x+a)(x-a)
    const a = randInt(2, 10);

    const exercise = `x² - ${a * a}`;
    const hint = "Reconoce la forma a² - b² = (a + b)(a - b).";
    const answer = `(x + ${a})(x - ${a})`;

    return { exercise, hint, answer };
  }

  // dificil: Trinomial x² + bx + c = (x + r1)(x + r2)
  const r1 = randInt(-8, 8);
  const r2 = randInt(-8, 8);
  const b = r1 + r2;
  const c = r1 * r2;

  const exercise = `x² ${fmtConst(b)} ${fmtConst(c)}`;
  const hint = "Busca dos números que multiplicados den el término independiente y sumados el coeficiente de x.";
  const answer = `(x ${r1 >= 0 ? "+ " + r1 : "- " + Math.abs(r1)})(x ${r2 >= 0 ? "+ " + r2 : "- " + Math.abs(r2)})`;

  return { exercise, hint, answer };
}

function solveFactoring(exercise: string): Solution {
  const steps: SolutionStep[] = [];

  // Detect type
  const noSpace = noSpaces(exercise);

  // Common factor: two terms like 6x + 12
  if (!noSpace.includes("x²") && !noSpace.includes("x²")) {
    // Common factor
    const tokens = exercise.match(/[+-]?\s*\d*x|[+-]?\s*\d+/g) || [];
    let coefX = 0;
    let constTerm = 0;

    for (const token of tokens) {
      const t = token.replace(/\s+/g, "");
      if (t.includes("x")) {
        const cStr = t.replace("x", "");
        coefX = cStr === "" || cStr === "+" ? 1 : cStr === "-" ? -1 : parseInt(cStr);
      } else {
        constTerm = parseInt(t);
      }
    }

    const g = gcd(Math.abs(coefX), Math.abs(constTerm));
    const innerX = coefX / g;
    const innerC = constTerm / g;

    steps.push({
      title: "Identificar los términos",
      explanation: "Observamos los términos del polinomio.",
      calculation: exercise,
    });

    steps.push({
      title: "Buscar factor común",
      explanation: `El máximo común divisor de ${Math.abs(coefX)} y ${Math.abs(constTerm)} es ${g}.`,
      calculation: `MCD(${Math.abs(coefX)}, ${Math.abs(constTerm)}) = ${g}`,
    });

    steps.push({
      title: "Factorizar",
      explanation: "Sacamos el factor común dividiendo cada término.",
      calculation: `${g}(${fmtTermCoef(innerX, "x", true)} ${fmtConst(innerC)})`,
    });

    return { steps };
  }

  // Difference of squares: x² - a²
  const diffSquaresMatch = noSpace.match(/^x²-?(\d+)$/);
  if (diffSquaresMatch) {
    const val = parseInt(diffSquaresMatch[1]);
    const sqrtVal = Math.sqrt(val);

    if (Number.isInteger(sqrtVal)) {
      steps.push({
        title: "Reconocer la forma",
        explanation: "Identificamos una diferencia de cuadrados: a² - b² = (a + b)(a - b).",
        calculation: `x² - ${val} = x² - ${sqrtVal}²`,
      });

      steps.push({
        title: "Aplicar la fórmula",
        explanation: "Factorizamos usando la identidad de diferencia de cuadrados.",
        calculation: `(x + ${sqrtVal})(x - ${sqrtVal})`,
      });

      return { steps };
    }
  }

  // Trinomial: x² + bx + c
  const trinomialMatch = noSpace.match(/^x²([+-]?\d+)x?([+-]?\d+)?$/);
  // More general parsing
  const coefs = parsePolyCoefs(exercise);
  if (coefs.length >= 3 && coefs[2] === 1) {
    const b = coefs[1];
    const c = coefs[0];

    steps.push({
      title: "Identificar el trinomio",
      explanation: "Tenemos un trinomio de la forma x² + bx + c.",
      calculation: `x² ${fmtConst(b)} ${fmtConst(c)}`,
    });

    // Find two numbers
    steps.push({
      title: "Buscar dos números",
      explanation: `Buscamos dos números que sumen ${b} y multipliquen ${c}.`,
      calculation: `r₁ + r₂ = ${b}, r₁ · r₂ = ${c}`,
    });

    // Find the roots
    const discriminant = b * b - 4 * c;
    if (discriminant >= 0) {
      const sqrtD = Math.sqrt(discriminant);
      const r1 = (-b + sqrtD) / 2;
      const r2 = (-b - sqrtD) / 2;

      if (Number.isInteger(r1) && Number.isInteger(r2)) {
        steps.push({
          title: "Los números son",
          explanation: `Encontramos: ${r1} y ${r2}`,
          calculation: `${r1} + ${r2} = ${b}, ${r1} · ${r2} = ${c}`,
        });

        steps.push({
          title: "Escribir la factorización",
          explanation: "Usamos los números encontrados para escribir los factores.",
          calculation: `(x ${r1 >= 0 ? "+ " + r1 : "- " + Math.abs(r1)})(x ${r2 >= 0 ? "+ " + r2 : "- " + Math.abs(r2)})`,
        });
      } else {
        steps.push({
          title: "No factorizable con enteros",
          explanation: "El trinomio no se puede factorizar con coeficientes enteros.",
          calculation: "Usa la fórmula cuadrática para las raíces.",
        });
      }
    }
  }

  return { steps };
}

function checkFactoring(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! La factorización es correcta.", correctAnswer };
  }

  // Try expanding both to see if they're equivalent
  try {
    const sCoefs = expandFactoredForm(sn);
    const cCoefs = expandFactoredForm(cn);
    if (sCoefs && cCoefs) {
      const maxLen = Math.max(sCoefs.length, cCoefs.length);
      let match = true;
      for (let i = 0; i < maxLen; i++) {
        if ((sCoefs[i] || 0) !== (cCoefs[i] || 0)) {
          match = false;
          break;
        }
      }
      if (match) {
        return { isCorrect: true, feedback: "¡Correcto! La factorización es equivalente.", correctAnswer };
      }
    }
  } catch {
    // Fall through to simple comparison
  }

  // Check for swapped factors: (x+2)(x+3) vs (x+3)(x+2)
  const sFactors = sn.split(/\)\s*\(/).map((f) => f.replace(/^\(/, "").replace(/\)$/, ""));
  const cFactors = cn.split(/\)\s*\(/).map((f) => f.replace(/^\(/, "").replace(/\)$/, ""));

  if (sFactors.length === 2 && cFactors.length === 2) {
    if (
      (normalizeAnswer(sFactors[0]) === normalizeAnswer(cFactors[1]) &&
        normalizeAnswer(sFactors[1]) === normalizeAnswer(cFactors[0]))
    ) {
      return { isCorrect: true, feedback: "¡Correcto! El orden de los factores no importa.", correctAnswer };
    }
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Revisa si encontraste correctamente los factores.",
    correctAnswer,
  };
}

/** Expand a factored form like "(x+2)(x-3)" into polynomial coefficients */
function expandFactoredForm(s: string): number[] | null {
  // Remove common factor prefix like "2(x+1)(x-2)"
  let commonFactor = 1;
  let remaining = s;

  const prefixMatch = remaining.match(/^(\d+)\((.+)$/);
  if (prefixMatch) {
    commonFactor = parseInt(prefixMatch[1]);
    remaining = prefixMatch[2];
  }

  const factors = remaining.split(/\)\s*\(/).map((f) => f.replace(/^\(/, "").replace(/\)$/, ""));

  if (factors.length < 2) return null;

  let result: Poly = { coefs: [1] }; // Start with 1

  for (const factor of factors) {
    // Parse each factor as (ax + b) or (x + a)
    const fc = noSpaces(factor);
    const xMatch = fc.match(/^(-?\d*)x([+-]\d+)?$/);
    if (xMatch) {
      const a = xMatch[1] === "" || xMatch[1] === "+" ? 1 : xMatch[1] === "-" ? -1 : parseInt(xMatch[1]);
      const b = xMatch[2] ? parseInt(xMatch[2]) : 0;
      result = polyMul(result, { coefs: [b, a] });
    } else {
      return null; // Can't parse
    }
  }

  return result.coefs.map((c) => c * commonFactor);
}

// ============================================================================
// TOPIC: FRACCIONES ALGEBRAICAS
// ============================================================================

function generateAlgebraicFraction(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // Simplify: ax²/a x → bx (common variable factor)
    const a = randInt(2, 6);
    const b = randInt(2, 6);
    const numCoef = a * b;

    const exercise = `${numCoef}x² / ${a}x`;
    const hint = "Simplifica los coeficientes numéricos y las variables por separado.";
    const answer = `${b}x`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // (x² - a²) / (x + a) = x - a
    const a = randInt(2, 8);

    const exercise = `(x² - ${a * a}) / (x + ${a})`;
    const hint = "Reconoce la diferencia de cuadrados en el numerador: x² - a² = (x+a)(x-a).";
    const answer = `x - ${a}`;

    return { exercise, hint, answer };
  }

  // dificil: (ax² + bx) / (cx + d) where factorable
  // Build from answer: kx / m or k(x + n) / m
  const k = randInt(2, 5);
  const n = randInt(1, 5);
  const c = randInt(2, 4);

  // Answer: k(x + n) / c, let's simplify if possible
  const g = gcd(k, c);
  const simpK = k / g;
  const simpC = c / g;

  // Numerator: k*x² + k*n*x, Denominator: c*x + c*n... wait
  // Let's do: numerator = k*(x + n)*x = kx² + k*n*x
  // denominator = c*(x + n) = cx + cn
  // simplifies to kx/c

  const exercise = `(${k}x² + ${k * n}x) / (${c}x + ${c * n})`;
  const hint = "Factoriza el numerador y el denominador, luego cancela los factores comunes.";
  const answer = simpC === 1 ? `${simpK}x` : `${simpK}x/${simpC}`;

  return { exercise, hint, answer };
}

function solveAlgebraicFraction(exercise: string): Solution {
  const steps: SolutionStep[] = [];

  const noSpace = noSpaces(exercise);

  // Simple form: numCoef * x² / (a * x)
  const simpleMatch = noSpace.match(/^(-?\d+)x²\/(-?\d+)x$/);
  if (simpleMatch) {
    const num = parseInt(simpleMatch[1]);
    const den = parseInt(simpleMatch[2]);

    steps.push({
      title: "Identificar la fracción",
      explanation: "Tenemos una fracción algebraica con variables en numerador y denominador.",
      calculation: exercise,
    });

    steps.push({
      title: "Separar coeficientes y variables",
      explanation: "Simplificamos por separado la parte numérica y la parte variable.",
      calculation: `Coeficientes: ${num}/${den}, Variables: x²/x = x`,
    });

    const [sn, sd] = simplifyFraction(num, den);
    const coefStr = sd === 1 ? `${sn}` : `${sn}/${sd}`;

    steps.push({
      title: "Simplificar coeficientes",
      explanation: `MCD(${Math.abs(num)}, ${Math.abs(den)}) = ${gcd(Math.abs(num), Math.abs(den))}`,
      calculation: `${num}/${den} = ${coefStr}`,
    });

    steps.push({
      title: "Simplificar variables",
      explanation: "x² / x = x (restamos exponentes).",
      calculation: "x² / x = x",
    });

    steps.push({
      title: "Resultado",
      explanation: "Combinamos la simplificación de coeficientes y variables.",
      calculation: sd === 1 && sn === 1 ? "x" : `${coefStr}x`,
    });

    return { steps };
  }

  // Difference of squares form: (x² - a²) / (x + a)
  const diffSqMatch = noSpace.match(/^\(x²-(\d+)\)\/\(x\+(\d+)\)$/);
  if (diffSqMatch) {
    const a2 = parseInt(diffSqMatch[1]);
    const a = parseInt(diffSqMatch[2]);

    steps.push({
      title: "Identificar la fracción",
      explanation: "Observamos la fracción algebraica.",
      calculation: exercise,
    });

    steps.push({
      title: "Factorizar el numerador",
      explanation: "El numerador es una diferencia de cuadrados.",
      calculation: `x² - ${a2} = (x + ${a})(x - ${a})`,
    });

    steps.push({
      title: "Cancelar factor común",
      explanation: "El factor (x + a) aparece en numerador y denominador.",
      calculation: `(x + ${a})(x - ${a}) / (x + ${a}) = x - ${a}`,
    });

    steps.push({
      title: "Resultado",
      explanation: "La fracción simplificada es:",
      calculation: `x - ${a}`,
    });

    return { steps };
  }

  // Complex form: (kx² + kn*x) / (cx + cn)
  // Try to parse: (a*x² + a*n*x) / (c*x + c*n)
  const complexMatch = noSpace.match(/^\((-?\d+)x²([+-]\d+)x\)\/\((-?\d+)x([+-]\d+)\)$/);
  if (complexMatch) {
    const numA = parseInt(complexMatch[1]);
    const numB = parseInt(complexMatch[2]);
    const denA = parseInt(complexMatch[3]);
    const denB = parseInt(complexMatch[4]);

    const n = Math.abs(numB / numA); // numB = numA * n
    steps.push({
      title: "Identificar la fracción",
      explanation: "Tenemos una fracción algebraica con polinomios de segundo grado.",
      calculation: exercise,
    });

    steps.push({
      title: "Factorizar el numerador",
      explanation: `Sacamos factor común ${numA}x del numerador.`,
      calculation: `${numA}x² ${numB >= 0 ? "+" : ""}${numB}x = ${numA}x(x ${numB >= 0 ? "+" : ""} ${numB / numA})`,
    });

    steps.push({
      title: "Factorizar el denominador",
      explanation: `Sacamos factor común ${denA} del denominador.`,
      calculation: `${denA}x ${denB >= 0 ? "+" : ""}${denB} = ${denA}(x ${denB >= 0 ? "+" : ""} ${denB / denA})`,
    });

    steps.push({
      title: "Cancelar factores comunes",
      explanation: "Los factores comunes en numerador y denominador se cancelan.",
      calculation: `Se cancela (x ${denB >= 0 ? "+" : ""} ${denB / denA}) y se simplifica ${numA}/${denA}`,
    });

    const [sn, sd] = simplifyFraction(numA, denA);
    const coefStr = sd === 1 ? `${sn}` : `${sn}/${sd}`;
    steps.push({
      title: "Resultado",
      explanation: "La fracción simplificada es:",
      calculation: sd === 1 && sn === 1 ? "x" : `${coefStr}x`,
    });
  } else {
    // Generic fallback
    steps.push({
      title: "Identificar la fracción",
      explanation: "Tenemos una fracción algebraica con polinomios.",
      calculation: exercise,
    });

    steps.push({
      title: "Factorizar numerador y denominador",
      explanation: "Buscamos factores comunes para poder simplificar.",
      calculation: "Factoriza cada parte y cancela factores comunes",
    });

    steps.push({
      title: "Simplificar",
      explanation: "Cancelamos los factores que aparecen tanto arriba como abajo.",
      calculation: "Resultado de la simplificación",
    });
  }

  return { steps };
}

function checkAlgebraicFraction(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! La simplificación es correcta.", correctAnswer };
  }

  // Try numeric evaluation at a test point
  // Substitute x = 7 (unlikely to be a root) and compare
  try {
    const evalAt = (expr: string, xVal: number): number | null => {
      const s = expr.replace(/x/g, `(${xVal})`);
      // Very basic eval - just for verification
      const result = Function(`"use strict"; return (${s})`)();
      return typeof result === "number" ? result : null;
    };
    const sv = evalAt(sn, 7);
    const cv = evalAt(cn, 7);
    if (sv !== null && cv !== null && Math.abs(sv - cv) < 1e-6) {
      return { isCorrect: true, feedback: "¡Correcto! La simplificación es equivalente.", correctAnswer };
    }
  } catch {
    // Fall through
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Verifica la factorización y cancelación de factores.",
    correctAnswer,
  };
}

// ============================================================================
// TOPIC: DESIGUALDADES
// ============================================================================

function generateInequality(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // ax + b > c or ax + b < c (positive coefficient)
    const x = randInt(-5, 10);
    const a = randInt(2, 6);
    const b = randInt(-8, 8);
    const c = a * x + b;
    const op = randChoice([">", "<"]);

    const exercise = `${fmtTermCoef(a, "x", true)} ${fmtConst(b)} ${op} ${c}`;
    const hint = op === ">"
      ? "Aísla x igual que en una ecuación. Al dividir por positivo, la desigualdad no cambia."
      : "Aísla x igual que en una ecuación. Al dividir por positivo, la desigualdad no cambia.";
    const answer = op === ">" ? `x > ${x}` : `x < ${x}`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // ax + b > c with negative coefficient
    const x = randInt(-5, 8);
    const a = randInt(2, 6) * -1; // negative coefficient
    const b = randInt(-8, 8);
    const c = a * x + b;
    const op = randChoice([">", "<"]);

    const exercise = `${fmtTermCoef(a, "x", true)} ${fmtConst(b)} ${op} ${c}`;
    const hint = "¡Cuidado! Al dividir por un número negativo, la desigualdad se invierte.";
    // When we divide by negative a, inequality flips
    const finalOp = op === ">" ? "<" : ">";
    const answer = `x ${finalOp} ${x}`;

    return { exercise, hint, answer };
  }

  // dificil: ax + b ≥ c or compound
  const x = randInt(-8, 8);
  const a = randInt(2, 7) * randChoice([1, -1]);
  const b = randInt(-8, 8);
  const c = a * x + b;
  const op = randChoice([">=", "≤"]);

  const exercise = `${fmtTermCoef(a, "x", true)} ${fmtConst(b)} ${op} ${c}`;
  const hint = "Recuerda que al multiplicar o dividir por negativo, la desigualdad se invierte.";
  let finalOp = op;
  if (a < 0) {
    if (op === ">=") finalOp = "≤";
    else if (op === "≤") finalOp = ">=";
  }

  const displayOp = finalOp === ">=" ? "≥" : finalOp === "≤" ? "≤" : finalOp;
  const answer = `x ${displayOp} ${x}`;

  return { exercise, hint, answer };
}

function solveInequality(exercise: string): Solution {
  const steps: SolutionStep[] = [];

  // Detect inequality operator
  let op = "";
  let opDisplay = "";
  if (exercise.includes(">=")) { op = ">="; opDisplay = "≥"; }
  else if (exercise.includes("≤")) { op = "≤"; opDisplay = "≤"; }
  else if (exercise.includes(">")) { op = ">"; opDisplay = ">"; }
  else if (exercise.includes("<")) { op = "<"; opDisplay = "<"; }

  if (!op) {
    return { steps: [{ title: "Error", explanation: "No se detectó operador de desigualdad.", calculation: exercise }] };
  }

  const parts = exercise.split(op);
  const left = parts[0].trim();
  const right = parts[1].trim();

  const [la, lb] = parseLinearExpr(left);
  const rb = parseInt(right);

  steps.push({
    title: "Identificar la desigualdad",
    explanation: "Reconocemos los términos de la desigualdad.",
    calculation: exercise,
  });

  const movedConst = rb - lb;
  steps.push({
    title: "Mover constante",
    explanation: `Restamos ${lb} de ambos lados.`,
    calculation: `${fmtTermCoef(la, "x", true)} ${opDisplay} ${rb} - (${lb}) = ${movedConst}`,
  });

  const flipsInequality = la < 0;
  const resultVal = movedConst / la;
  const resultStr = Number.isInteger(resultVal) ? resultVal.toString() : formatFraction(movedConst, la);

  let finalOp = opDisplay;
  if (flipsInequality) {
    if (op === ">") finalOp = "<";
    else if (op === "<") finalOp = ">";
    else if (op === ">=") finalOp = "≤";
    else if (op === "≤") finalOp = "≥";

    steps.push({
      title: "Dividir y cambiar desigualdad",
      explanation: `Dividimos por ${la} (negativo). ¡La desigualdad se invierte!`,
      calculation: `x ${finalOp} ${resultStr}`,
    });
  } else {
    steps.push({
      title: "Dividir por el coeficiente",
      explanation: `Dividimos ambos lados por ${la} (positivo). La desigualdad no cambia.`,
      calculation: `x ${finalOp} ${resultStr}`,
    });
  }

  return { steps };
}

function checkInequality(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! Has resuelto la desigualdad correctamente.", correctAnswer };
  }

  // Normalize operators
  const normOp = (s: string): string => s.replace(/>=/g, "≥").replace(/<=/g, "≤");

  const snNorm = normOp(sn);
  const cnNorm = normOp(cn);

  if (snNorm === cnNorm) {
    return { isCorrect: true, feedback: "¡Correcto!", correctAnswer };
  }

  // Extract operator and value
  const extract = (s: string): { op: string; val: number | null } => {
    const match = s.match(/x\s*([<>≥≤]+)\s*(-?[\d.\/]+)/);
    if (!match) return { op: "", val: null };
    return { op: match[1], val: evalNumeric(match[2]) };
  };

  const se = extract(snNorm);
  const ce = extract(cnNorm);

  if (se.val !== null && ce.val !== null && Math.abs(se.val - ce.val) < 1e-6 && se.op === ce.op) {
    return { isCorrect: true, feedback: "¡Correcto!", correctAnswer };
  }

  if (se.val !== null && ce.val !== null && Math.abs(se.val - ce.val) < 1e-6 && se.op !== ce.op) {
    return {
      isCorrect: false,
      feedback: "El valor es correcto pero la dirección de la desigualdad es incorrecta. Recuerda que se invierte al dividir por un número negativo.",
      correctAnswer,
    };
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Verifica tus cálculos y la dirección de la desigualdad.",
    correctAnswer,
  };
}

// ============================================================================
// TOPIC: LEYES DE EXPONENTES
// ============================================================================

function generateExponentLaws(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // Product rule: x^a · x^b = x^(a+b)
    const a = randInt(2, 7);
    const b = randInt(2, 7);
    const sum = a + b;

    const exercise = `x${toSuperscript(a)} · x${toSuperscript(b)}`;
    const hint = "Aplica la regla del producto: x^a · x^b = x^(a+b).";
    const answer = `x${toSuperscript(sum)}`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // Power rule: (x^a)^b = x^(a*b)
    const a = randInt(2, 5);
    const b = randInt(2, 4);
    const prod = a * b;

    const exercise = `(x${toSuperscript(a)})${toSuperscript(b)}`;
    const hint = "Aplica la regla de potencia: (x^a)^b = x^(a·b).";
    const answer = `x${toSuperscript(prod)}`;

    return { exercise, hint, answer };
  }

  // dificil: Quotient rule with coefficients: a*x^m / b*x^n
  const m = randInt(3, 8);
  const n = randInt(1, m - 1);
  const diff = m - n;
  const a = randInt(2, 5);
  const b = randInt(2, 5);
  const g = gcd(a, b);
  const simpA = a / g;
  const simpB = b / g;

  const coefStr = simpB === 1 ? `${simpA}` : `${simpA}/${simpB}`;
  const varStr = diff === 0 ? "" : diff === 1 ? "x" : `x${toSuperscript(diff)}`;
  let answerStr: string;
  if (diff === 0) {
    answerStr = coefStr;
  } else if (coefStr === "1") {
    answerStr = varStr;
  } else if (coefStr === "-1") {
    answerStr = `-${varStr}`;
  } else {
    answerStr = `${coefStr}${varStr}`;
  }

  const exercise = `${a}x${toSuperscript(m)} / ${b}x${toSuperscript(n)}`;
  const hint = "Aplica la regla del cociente: x^m / x^n = x^(m-n) y simplifica los coeficientes.";
  const answer = answerStr;

  return { exercise, hint, answer };
}

function solveExponentLaws(exercise: string): Solution {
  const steps: SolutionStep[] = [];
  const noSp = noSpaces(exercise);

  // Product rule: x^a · x^b
  const productMatch = noSp.match(/^x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)·x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);
  if (productMatch) {
    const a = fromSuperscript(productMatch[1]);
    const b = fromSuperscript(productMatch[2]);

    steps.push({
      title: "Identificar la expresión",
      explanation: "Tenemos un producto de potencias con la misma base.",
      calculation: exercise,
    });

    steps.push({
      title: "Aplicar la regla del producto",
      explanation: "Cuando multiplicamos potencias con la misma base, sumamos los exponentes.",
      calculation: `x${toSuperscript(a)} · x${toSuperscript(b)} = x${toSuperscript(a)}+${toSuperscript(b)} = x${toSuperscript(a + b)}`,
    });

    steps.push({
      title: "Resultado",
      explanation: `Sumamos los exponentes: ${a} + ${b} = ${a + b}.`,
      calculation: `x${toSuperscript(a + b)}`,
    });

    return { steps };
  }

  // Power rule: (x^a)^b
  const powerMatch = noSp.match(/^\(x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/) ;
  if (powerMatch) {
    const a = fromSuperscript(powerMatch[1]);
    const b = fromSuperscript(powerMatch[2]);

    steps.push({
      title: "Identificar la expresión",
      explanation: "Tenemos una potencia de una potencia.",
      calculation: exercise,
    });

    steps.push({
      title: "Aplicar la regla de potencia",
      explanation: "Cuando elevamos una potencia a otra potencia, multiplicamos los exponentes.",
      calculation: `(x${toSuperscript(a)})${toSuperscript(b)} = x${toSuperscript(a)}·${toSuperscript(b)} = x${toSuperscript(a * b)}`,
    });

    steps.push({
      title: "Resultado",
      explanation: `Multiplicamos los exponentes: ${a} · ${b} = ${a * b}.`,
      calculation: `x${toSuperscript(a * b)}`,
    });

    return { steps };
  }

  // Quotient rule with coefficients
  const quotientMatch = noSp.match(/^(-?\d+)x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\/(-?\d+)x([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);
  if (quotientMatch) {
    const aCoef = parseInt(quotientMatch[1]);
    const m = fromSuperscript(quotientMatch[2]);
    const bCoef = parseInt(quotientMatch[3]);
    const n = fromSuperscript(quotientMatch[4]);

    steps.push({
      title: "Identificar la expresión",
      explanation: "Tenemos un cociente de potencias con coeficientes.",
      calculation: exercise,
    });

    steps.push({
      title: "Simplificar coeficientes",
      explanation: "Dividimos los coeficientes numéricos.",
      calculation: `${aCoef}/${bCoef} = ${formatFraction(aCoef, bCoef)}`,
    });

    steps.push({
      title: "Aplicar regla del cociente",
      explanation: "Restamos los exponentes: x^m / x^n = x^(m-n).",
      calculation: `x${toSuperscript(m)} / x${toSuperscript(n)} = x${toSuperscript(m)}-${toSuperscript(n)} = x${toSuperscript(m - n)}`,
    });

    const [sn, sd] = simplifyFraction(aCoef, bCoef);
    const diff = m - n;
    const coefPart = sd === 1 ? `${sn}` : `${sn}/${sd}`;
    const varPart = diff === 0 ? "" : diff === 1 ? "x" : `x${toSuperscript(diff)}`;
    let resultStr: string;
    if (diff === 0) {
      resultStr = coefPart;
    } else if (coefPart === "1") {
      resultStr = varPart;
    } else if (coefPart === "-1") {
      resultStr = `-${varPart}`;
    } else {
      resultStr = `${coefPart}${varPart}`;
    }

    steps.push({
      title: "Resultado",
      explanation: "Combinamos la simplificación de coeficientes y exponentes.",
      calculation: resultStr,
    });

    return { steps };
  }

  // Generic fallback
  steps.push({
    title: "Resolver",
    explanation: "Aplica las leyes de exponentes apropiadas.",
    calculation: exercise,
  });

  return { steps };
}

function fromSuperscript(s: string): number {
  const map: Record<string, string> = {
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
    "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  };
  const digits = s.split("").map((c) => map[c] ?? c).join("");
  return parseInt(digits) || 0;
}

function checkExponentLaws(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! Has aplicado correctamente las leyes de exponentes.", correctAnswer };
  }

  // Try evaluating at a test point (x = 2)
  try {
    const evalExpr = (expr: string): number | null => {
      // Convert superscript to ^ notation for eval
      let s = expr;
      const supMap: Record<string, string> = {
        "⁰": "^0", "¹": "^1", "²": "^2", "³": "^3", "⁴": "^4",
        "⁵": "^5", "⁶": "^6", "⁷": "^7", "⁸": "^8", "⁹": "^9",
      };
      for (const [sup, rep] of Object.entries(supMap)) {
        s = s.replace(new RegExp(sup, "g"), rep);
      }
      s = s.replace(/\^/g, "**");
      s = s.replace(/x/g, "(2)");
      const result = Function(`"use strict"; return (${s})`)();
      return typeof result === "number" ? result : null;
    };

    const sv = evalExpr(sn);
    const cv = evalExpr(cn);
    if (sv !== null && cv !== null && Math.abs(sv - cv) < 0.01) {
      return { isCorrect: true, feedback: "¡Correcto! Tu respuesta es equivalente.", correctAnswer };
    }
  } catch {
    // Fall through
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Revisa las leyes de exponentes que aplicaste.",
    correctAnswer,
  };
}

// ============================================================================
// TOPIC: RADICALES
// ============================================================================

function generateRadicals(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // √(a²b) = a√b where b is not a perfect square
    const a = randInt(2, 8);
    const b = randChoice([2, 3, 5, 6, 7]);
    const radicand = a * a * b;

    const exercise = `√${radicand}`;
    const hint = "Factoriza el número dentro de la raíz buscando cuadrados perfectos.";
    const answer = `${a}√${b}`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // √(a² · b · c) = a√(bc) or √(a²b²c) = ab√c
    const a = randInt(2, 5);
    const b = randInt(2, 4);
    const c = randChoice([2, 3, 5, 6, 7]);
    const radicand = a * a * b * b * c;

    const exercise = `√${radicand}`;
    const hint = "Factoriza buscando el mayor cuadrado perfecto dentro de la raíz.";
    const answer = `${a * b}√${c}`;

    return { exercise, hint, answer };
  }

  // dificil: √(xⁿ · yᵐ) with variables
  const xExp = randInt(3, 6) * 2; // even exponent for x
  const yExp = randChoice([3, 5, 7]); // odd exponent for y
  const coef = randInt(2, 4);
  const radicand = `${coef > 1 ? coef : ""}x${toSuperscript(xExp)}y${toSuperscript(yExp)}`;

  const xOut = xExp / 2;
  const yOut = Math.floor(yExp / 2);
  const yIn = yExp - 2 * yOut;

  const outside = `${coef > 1 ? coef : ""}x${toSuperscript(xOut)}${yOut > 0 ? `y${toSuperscript(yOut)}` : ""}`;
  const inside = yIn > 0 ? `y` : "";

  const exercise = `√(${radicand})`;
  const hint = "Separa las potencias pares (que salen de la raíz) de las impares (que se quedan dentro).";
  const answer = `${outside}√${inside}`;

  return { exercise, hint, answer };
}

function solveRadicals(exercise: string): Solution {
  const steps: SolutionStep[] = [];

  const noSp = noSpaces(exercise);

  // Numeric radical: √N
  const simpleRadMatch = noSp.match(/^√(\d+)$/);
  if (simpleRadMatch) {
    const n = parseInt(simpleRadMatch[1]);

    steps.push({
      title: "Identificar el radical",
      explanation: "Queremos simplificar la raíz cuadrada.",
      calculation: exercise,
    });

    // Find the largest square factor
    let largestSquare = 1;
    let factor = 2;
    let temp = n;
    while (factor * factor <= temp) {
      while (temp % (factor * factor) === 0) {
        largestSquare *= factor;
        temp /= factor * factor;
      }
      factor++;
    }

    steps.push({
      title: "Factorizar buscando cuadrados perfectos",
      explanation: `Descomponemos ${n} buscando el mayor cuadrado perfecto que lo divide.`,
      calculation: `${n} = ${largestSquare}² · ${temp}`,
    });

    if (largestSquare === 1) {
      steps.push({
        title: "No se puede simplificar",
        explanation: `${n} no tiene factores cuadrados perfectos besides 1.`,
        calculation: `√${n} ya está simplificado`,
      });
    } else {
      steps.push({
        title: "Separar la raíz",
        explanation: "La raíz de un producto es el producto de las raíces.",
        calculation: `√${n} = √(${largestSquare}² · ${temp}) = √(${largestSquare}²) · √${temp}`,
      });

      steps.push({
        title: "Simplificar",
        explanation: "La raíz del cuadrado perfecto sale fuera del radical.",
        calculation: `= ${largestSquare}√${temp}`,
      });
    }

    return { steps };
  }

  // Variable radical: √(coef * x^n * y^m)
  steps.push({
    title: "Identificar el radical",
    explanation: "Queremos simplificar la raíz cuadrada con variables.",
    calculation: exercise,
  });

  steps.push({
    title: "Separar coeficiente y variables",
    explanation: "Tratamos por separado la parte numérica y cada variable.",
    calculation: "Simplificar cada parte independientemente",
  });

  steps.push({
    title: "Potencias pares salen, impares se dividen",
    explanation: "Para cada variable: si el exponente es par, la mitad sale; si es impar, la mitad entera sale y queda un factor dentro.",
    calculation: "x^(2k) → x^k sale, x^(2k+1) → x^k sale y queda x dentro",
  });

  steps.push({
    title: "Resultado",
    explanation: "Combinamos todos los factores que salen y los que quedan dentro.",
    calculation: "Verifica el cálculo paso a paso",
  });

  return { steps };
}

function checkRadicals(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! La simplificación del radical es correcta.", correctAnswer };
  }

  // Try numeric evaluation
  try {
    const evalRad = (expr: string): number | null => {
      let s = expr.replace(/√(\d+)/g, "Math.sqrt($1)");
      const result = Function(`"use strict"; return (${s})`)();
      return typeof result === "number" ? result : null;
    };

    const sv = evalRad(sn);
    const cv = evalRad(cn);
    if (sv !== null && cv !== null && Math.abs(sv - cv) < 1e-6) {
      return { isCorrect: true, feedback: "¡Correcto! Tu respuesta es equivalente.", correctAnswer };
    }
  } catch {
    // Fall through
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Asegúrate de extraer el mayor factor cuadrado perfecto.",
    correctAnswer,
  };
}

// ============================================================================
// TOPIC: FUNCIONES LINEALES
// ============================================================================

function generateLinearFunction(difficulty: Difficulty): Exercise {
  if (difficulty === "facil") {
    // Find the slope between two points
    const x1 = randInt(-5, 5);
    const y1 = randInt(-5, 5);
    const m = randInt(-5, 5);
    while (m === 0) { /* regenerate for non-zero slope */ }
    const x2 = randInt(x1 + 1, x1 + 5);
    const y2 = y1 + m * (x2 - x1);

    const exercise = `Calcula la pendiente entre los puntos (${x1}, ${y1}) y (${x2}, ${y2})`;
    const hint = "La pendiente m = (y₂ - y₁) / (x₂ - x₁).";
    const answer = `m = ${m}`;

    return { exercise, hint, answer };
  }

  if (difficulty === "medio") {
    // Find the equation of the line through two points
    const x1 = randInt(-4, 4);
    const y1 = randInt(-4, 4);
    const m = randInt(-4, 4);
    while (m === 0) {}
    const x2 = randInt(x1 + 1, x1 + 4);
    const y2 = y1 + m * (x2 - x1);
    const b = y1 - m * x1;

    const exercise = `Encuentra la ecuación de la recta que pasa por (${x1}, ${y1}) y (${x2}, ${y2})`;
    const hint = "Primero calcula la pendiente, luego usa y = mx + b para encontrar la ordenada al origen.";
    const answer = `y = ${fmtPoly([b, m], "x")}`;

    return { exercise, hint, answer };
  }

  // dificil: Given f(x) = ax + b, find f(c), inverse, or interpretation
  const variant = randInt(0, 1);
  if (variant === 0) {
    // Find the inverse function
    const a = randInt(2, 6) * randChoice([1, -1]);
    const b = randInt(-8, 8);

    const exercise = `Dada f(x) = ${fmtTermCoef(a, "x", true)} ${fmtConst(b)}, encuentra f⁻¹(x)`;
    const hint = "Para encontrar la inversa, intercambia x e y y despeja y.";
    // f(x) = ax + b → f⁻¹(x) = (x - b)/a
    const [sn, sd] = simplifyFraction(1, a);
    const [snb, sdb] = simplifyFraction(-b, a);

    let invStr = "";
    if (sd === 1 && sdb === 1) {
      invStr = `f⁻¹(x) = ${sn}x ${fmtConst(snb)}`;
    } else {
      invStr = `f⁻¹(x) = (x ${b >= 0 ? "- " + b : "+ " + Math.abs(b)}) / ${a}`;
    }

    const answer = invStr;

    return { exercise, hint, answer };
  } else {
    // Given a linear function, evaluate at a point and interpret
    const a = randInt(2, 5);
    const b = randInt(-10, 10);
    const c = randInt(-5, 5);

    const result = a * c + b;

    const exercise = `Dada f(x) = ${fmtTermCoef(a, "x", true)} ${fmtConst(b)}, calcula f(${c})`;
    const hint = "Sustituye el valor de x en la función y evalúa.";
    const answer = `${result}`;

    return { exercise, hint, answer };
  }
}

function solveLinearFunction(exercise: string): Solution {
  const steps: SolutionStep[] = [];

  // Detect type
  if (exercise.includes("pendiente")) {
    // Extract points
    const pointMatch = exercise.match(/\((-?\d+)\s*,\s*(-?\d+)\)\s*y\s*\((-?\d+)\s*,\s*(-?\d+)\)/);
    if (pointMatch) {
      const x1 = parseInt(pointMatch[1]);
      const y1 = parseInt(pointMatch[2]);
      const x2 = parseInt(pointMatch[3]);
      const y2 = parseInt(pointMatch[4]);

      steps.push({
        title: "Identificar los puntos",
        explanation: "Tenemos dos puntos y debemos encontrar la pendiente.",
        calculation: `P₁ = (${x1}, ${y1}), P₂ = (${x2}, ${y2})`,
      });

      steps.push({
        title: "Aplicar la fórmula",
        explanation: "La pendiente es m = (y₂ - y₁) / (x₂ - x₁).",
        calculation: `m = (${y2} - ${y1}) / (${x2} - ${x1})`,
      });

      const num = y2 - y1;
      const den = x2 - x1;

      steps.push({
        title: "Calcular",
        explanation: "Evaluamos el numerador y denominador.",
        calculation: `m = ${num} / ${den}`,
      });

      const m = num / den;
      const mStr = Number.isInteger(m) ? m.toString() : formatFraction(num, den);

      steps.push({
        title: "Resultado",
        explanation: "La pendiente de la recta es:",
        calculation: `m = ${mStr}`,
      });
    }
  } else if (exercise.includes("ecuación")) {
    const pointMatch = exercise.match(/\((-?\d+)\s*,\s*(-?\d+)\)\s*y\s*\((-?\d+)\s*,\s*(-?\d+)\)/);
    if (pointMatch) {
      const x1 = parseInt(pointMatch[1]);
      const y1 = parseInt(pointMatch[2]);
      const x2 = parseInt(pointMatch[3]);
      const y2 = parseInt(pointMatch[4]);

      const m = (y2 - y1) / (x2 - x1);
      const b = y1 - m * x1;

      steps.push({
        title: "Calcular la pendiente",
        explanation: "Primero encontramos la pendiente m.",
        calculation: `m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${m}`,
      });

      steps.push({
        title: "Usar forma punto-pendiente",
        explanation: "Usamos y - y₁ = m(x - x₁) para encontrar la ecuación.",
        calculation: `y - ${y1} = ${m}(x - ${x1})`,
      });

      steps.push({
        title: "Encontrar la ordenada al origen",
        explanation: `Sustituimos un punto para encontrar b en y = mx + b.`,
        calculation: `b = ${y1} - ${m}(${x1}) = ${Number.isInteger(b) ? b : b.toFixed(2)}`,
      });

      const bStr = Number.isInteger(b) ? b.toString() : b.toFixed(2);
      const mStr = Number.isInteger(m) ? m.toString() : m.toFixed(2);
      steps.push({
        title: "Ecuación de la recta",
        explanation: "La ecuación en forma pendiente-ordenada al origen es:",
        calculation: `y = ${fmtPoly([b, m], "x")}`,
      });
    }
  } else if (exercise.includes("f⁻¹") || exercise.includes("inversa")) {
    steps.push({
      title: "Plantear la inversa",
      explanation: "Escribimos y = f(x) e intercambiamos x e y.",
      calculation: exercise,
    });

    // Extract function
    const funcMatch = exercise.match(/f\(x\)\s*=\s*(.+)/);
    if (funcMatch) {
      const expr = funcMatch[1].trim();
      const [a, bVal] = parseLinearExpr(expr);

      steps.push({
        title: "Intercambiar variables",
        explanation: "Cambiamos x por y y y por x.",
        calculation: `x = ${fmtTermCoef(a, "y", true)} ${fmtConst(bVal)}`,
      });

      steps.push({
        title: "Despejar y",
        explanation: "Aislamos y de la misma forma que una ecuación lineal.",
        calculation: `x - ${bVal >= 0 ? bVal : `(${bVal})`} = ${a}y`,
      });

      steps.push({
        title: "Resultado",
        explanation: "Dividimos entre el coeficiente de y.",
        calculation: `f⁻¹(x) = (x ${bVal >= 0 ? "- " + bVal : "+ " + Math.abs(bVal)}) / ${a}`,
      });
    }
  } else if (exercise.includes("calcula f(") || exercise.includes("evalúa")) {
    const funcMatch = exercise.match(/f\(x\)\s*=\s*(.+?),/i);
    const valMatch = exercise.match(/f\((-?\d+)\)/g);

    if (funcMatch && valMatch) {
      const expr = funcMatch[1].trim();
      const lastValMatch = valMatch[valMatch.length - 1];
      const valStr = lastValMatch.match(/f\((-?\d+)\)/);
      if (valStr) {
        const c = parseInt(valStr[1]);
        const [a, bVal] = parseLinearExpr(expr);
        const result = a * c + bVal;

        steps.push({
          title: "Identificar la función y el valor",
          explanation: "Debemos evaluar la función en el punto dado.",
          calculation: `f(${c}) con f(x) = ${expr}`,
        });

        steps.push({
          title: "Sustituir x",
          explanation: `Reemplazamos x por ${c} en la función.`,
          calculation: `f(${c}) = ${fmtTermCoef(a, `(${c})`, true)} ${fmtConst(bVal)}`,
        });

        steps.push({
          title: "Calcular",
          explanation: "Realizamos las operaciones.",
          calculation: `= ${a * c} ${fmtConst(bVal)} = ${result}`,
        });

        steps.push({
          title: "Resultado",
          explanation: "El valor de la función es:",
          calculation: `${result}`,
        });
      }
    }
  }

  if (steps.length === 0) {
    steps.push({
      title: "Resolver",
      explanation: "Analiza la función lineal paso a paso.",
      calculation: exercise,
    });
  }

  return { steps };
}

function checkLinearFunction(studentAnswer: string, correctAnswer: string): CheckResult {
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);

  if (sn === cn) {
    return { isCorrect: true, feedback: "¡Correcto! Has resuelto el problema de función lineal correctamente.", correctAnswer };
  }

  // Try numeric comparison
  if (numericEqual(studentAnswer, correctAnswer)) {
    return { isCorrect: true, feedback: "¡Correcto!", correctAnswer };
  }

  // Try extracting slope value
  const sSlope = sn.match(/m\s*=\s*(-?[\d.\/]+)/);
  const cSlope = cn.match(/m\s*=\s*(-?[\d.\/]+)/);
  if (sSlope && cSlope) {
    if (numericEqual(sSlope[1], cSlope[1])) {
      return { isCorrect: true, feedback: "¡Correcto! La pendiente es correcta.", correctAnswer };
    }
  }

  // Try evaluating equation form y = mx + b at x=0 and x=1
  try {
    const evalLine = (expr: string): { b: number; m: number } | null => {
      let s = normalizeAnswer(expr);
      s = s.replace(/^y\s*=\s*/, "");
      const [m, b] = parseLinearExpr(s);
      return { b, m };
    };

    const sLine = evalLine(studentAnswer);
    const cLine = evalLine(correctAnswer);

    if (sLine && cLine && sLine.m === cLine.m && sLine.b === cLine.b) {
      return { isCorrect: true, feedback: "¡Correcto! La ecuación de la recta es correcta.", correctAnswer };
    }
  } catch {
    // Fall through
  }

  return {
    isCorrect: false,
    feedback: "Respuesta incorrecta. Revisa tus cálculos de pendiente y ordenada al origen.",
    correctAnswer,
  };
}

// ============================================================================
// MAIN EXPORTED FUNCTIONS
// ============================================================================

const VALID_TOPICS = [
  "Ecuaciones Lineales",
  "Ecuaciones Cuadráticas",
  "Sistemas de Ecuaciones",
  "Polinomios",
  "Factorización",
  "Fracciones Algebraicas",
  "Desigualdades",
  "Leyes de Exponentes",
  "Radicales",
  "Funciones Lineales",
] as const;

type Topic = (typeof VALID_TOPICS)[number];

function isValidTopic(topic: string): topic is Topic {
  return VALID_TOPICS.includes(topic as Topic);
}

function isValidDifficulty(d: string): d is Difficulty {
  return ["facil", "medio", "dificil"].includes(d);
}

/**
 * Generate an algebra exercise for the given topic and difficulty.
 * Each call produces a different random exercise.
 */
export function generateExercise(topic: string, difficulty: string): Exercise {
  if (!isValidTopic(topic)) {
    return {
      exercise: "Tema no reconocido",
      hint: "Selecciona uno de los temas disponibles.",
      answer: "",
    };
  }

  if (!isValidDifficulty(difficulty)) {
    return {
      exercise: "Dificultad no reconocida",
      hint: "Usa: facil, medio o dificil.",
      answer: "",
    };
  }

  switch (topic) {
    case "Ecuaciones Lineales":
      return generateLinearEquation(difficulty);
    case "Ecuaciones Cuadráticas":
      return generateQuadraticEquation(difficulty);
    case "Sistemas de Ecuaciones":
      return generateSystemOfEquations(difficulty);
    case "Polinomios":
      return generatePolynomial(difficulty);
    case "Factorización":
      return generateFactoring(difficulty);
    case "Fracciones Algebraicas":
      return generateAlgebraicFraction(difficulty);
    case "Desigualdades":
      return generateInequality(difficulty);
    case "Leyes de Exponentes":
      return generateExponentLaws(difficulty);
    case "Radicales":
      return generateRadicals(difficulty);
    case "Funciones Lineales":
      return generateLinearFunction(difficulty);
  }
}

/**
 * Solve an exercise step by step.
 * Returns 3-6 educational steps in Spanish.
 */
export function solveExercise(exercise: string, topic: string): Solution {
  if (!isValidTopic(topic)) {
    return {
      steps: [
        {
          title: "Error",
          explanation: "Tema no reconocido. No se puede resolver el ejercicio.",
          calculation: exercise,
        },
      ],
    };
  }

  switch (topic) {
    case "Ecuaciones Lineales":
      return solveLinearEquation(exercise, "facil");
    case "Ecuaciones Cuadráticas":
      return solveQuadraticEquation(exercise);
    case "Sistemas de Ecuaciones":
      return solveSystemOfEquations(exercise);
    case "Polinomios":
      return solvePolynomial(exercise);
    case "Factorización":
      return solveFactoring(exercise);
    case "Fracciones Algebraicas":
      return solveAlgebraicFraction(exercise);
    case "Desigualdades":
      return solveInequality(exercise);
    case "Leyes de Exponentes":
      return solveExponentLaws(exercise);
    case "Radicales":
      return solveRadicals(exercise);
    case "Funciones Lineales":
      return solveLinearFunction(exercise);
  }
}

/**
 * Check a student's answer against the correct answer.
 * Handles mathematical equivalences (different formats, fraction simplification, etc.)
 */
export function checkAnswer(
  exercise: string,
  studentAnswer: string,
  correctAnswer: string,
  topic: string
): CheckResult {
  if (!studentAnswer.trim()) {
    return {
      isCorrect: false,
      feedback: "No se ingresó una respuesta. Intenta resolver el ejercicio.",
      correctAnswer,
    };
  }

  // Quick exact match after normalization
  const sn = normalizeAnswer(studentAnswer);
  const cn = normalizeAnswer(correctAnswer);
  if (sn === cn) {
    return {
      isCorrect: true,
      feedback: "¡Correcto! Excelente trabajo.",
      correctAnswer,
    };
  }

  // Topic-specific checking
  if (!isValidTopic(topic)) {
    // Generic check
    return {
      isCorrect: false,
      feedback: "Respuesta incorrecta. Verifica tu solución.",
      correctAnswer,
    };
  }

  switch (topic) {
    case "Ecuaciones Lineales":
      return checkLinearEquation(studentAnswer, correctAnswer);
    case "Ecuaciones Cuadráticas":
      return checkQuadraticEquation(studentAnswer, correctAnswer);
    case "Sistemas de Ecuaciones":
      return checkSystemOfEquations(studentAnswer, correctAnswer);
    case "Polinomios":
      return checkPolynomial(studentAnswer, correctAnswer);
    case "Factorización":
      return checkFactoring(studentAnswer, correctAnswer);
    case "Fracciones Algebraicas":
      return checkAlgebraicFraction(studentAnswer, correctAnswer);
    case "Desigualdades":
      return checkInequality(studentAnswer, correctAnswer);
    case "Leyes de Exponentes":
      return checkExponentLaws(studentAnswer, correctAnswer);
    case "Radicales":
      return checkRadicals(studentAnswer, correctAnswer);
    case "Funciones Lineales":
      return checkLinearFunction(studentAnswer, correctAnswer);
  }
}

// ============================================================================
// BULK GENERATION HELPER
// ============================================================================

export interface ExerciseSet {
  topic: string;
  difficulty: string;
  exercises: Exercise[];
}

/**
 * Generate multiple exercises for a topic.
 */
export function generateExerciseSet(
  topic: string,
  difficulty: string,
  count: number = 5
): ExerciseSet {
  const exercises: Exercise[] = [];
  for (let i = 0; i < count; i++) {
    exercises.push(generateExercise(topic, difficulty));
  }
  return { topic, difficulty, exercises };
}
