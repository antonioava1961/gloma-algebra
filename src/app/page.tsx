"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Sigma,
  TrendingUp,
  GitBranch,
  Plus,
  Search,
  Scissors,
  Scale,
  ArrowUp,
  LineChart,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  Sparkles,
  Trophy,
  Flame,
  Target,
  Loader2,
  ChevronRight,
  Coffee,
  Heart,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

// ─── Topic definition ────────────────────────────────────────────
interface Topic {
  id: string;
  name: string;
  icon: React.ReactNode;
  emoji: string;
}

const topics: Topic[] = [
  { id: "ecuaciones-lineales", name: "Ecuaciones Lineales", icon: <Sigma className="size-5" />, emoji: "📐" },
  { id: "ecuaciones-cuadraticas", name: "Ecuaciones Cuadráticas", icon: <TrendingUp className="size-5" />, emoji: "📊" },
  { id: "sistemas-de-ecuaciones", name: "Sistemas de Ecuaciones", icon: <GitBranch className="size-5" />, emoji: "🔗" },
  { id: "polinomios", name: "Polinomios", icon: <Plus className="size-5" />, emoji: "➕" },
  { id: "factorizacion", name: "Factorización", icon: <Search className="size-5" />, emoji: "🔍" },
  { id: "fracciones-algebraicas", name: "Fracciones Algebraicas", icon: <Scissors className="size-5" />, emoji: "✂️" },
  { id: "desigualdades", name: "Desigualdades", icon: <Scale className="size-5" />, emoji: "⚖️" },
  { id: "leyes-de-exponentes", name: "Leyes de Exponentes", icon: <ArrowUp className="size-5" />, emoji: "📈" },
  { id: "radicales", name: "Radicales", icon: <span className="text-lg font-bold">√</span>, emoji: "√" },
  { id: "funciones-lineales", name: "Funciones Lineales", icon: <LineChart className="size-5" />, emoji: "📏" },
];

// ─── Difficulty definition ────────────────────────────────────────
interface Difficulty {
  id: string;
  label: string;
  emoji: string;
  colorClass: string;
  bgSelectedClass: string;
}

const difficulties: Difficulty[] = [
  { id: "facil", label: "Fácil", emoji: "🟢", colorClass: "text-emerald-700 border-emerald-300", bgSelectedClass: "bg-emerald-100 border-emerald-500 text-emerald-800" },
  { id: "medio", label: "Medio", emoji: "🟡", colorClass: "text-amber-700 border-amber-300", bgSelectedClass: "bg-amber-100 border-amber-500 text-amber-800" },
  { id: "dificil", label: "Difícil", emoji: "🔴", colorClass: "text-red-700 border-red-300", bgSelectedClass: "bg-red-100 border-red-500 text-red-800" },
];

// ─── Solution step type ───────────────────────────────────────────
interface SolutionStep {
  title: string;
  explanation: string;
  calculation: string;
}

// ─── Main component ───────────────────────────────────────────────
export default function Home() {
  const { toast } = useToast();

  // State
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>("facil");
  const [currentExercise, setCurrentExercise] = useState<{
    exercise: string;
    hint: string;
    answer: string;
  } | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState<SolutionStep[] | null>(null);
  const [checkResult, setCheckResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    correctAnswer: string;
  } | null>(null);
  const [isLoadingExercise, setIsLoadingExercise] = useState(false);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    solved: 0,
    correct: 0,
    streak: 0,
  });

  // ─── Generate exercise ────────────────────────────────────────
  const handleGenerateExercise = useCallback(async () => {
    if (!selectedTopic) return;

    setIsLoadingExercise(true);
    setCurrentExercise(null);
    setStudentAnswer("");
    setCheckResult(null);
    setShowSolution(false);
    setSolution(null);
    setShowHint(false);

    try {
      const topicName = topics.find((t) => t.id === selectedTopic)?.name ?? selectedTopic;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicName, difficulty }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al generar el ejercicio");
      }

      const data = await res.json();
      setCurrentExercise(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el ejercicio",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExercise(false);
    }
  }, [selectedTopic, difficulty, toast]);

  // ─── Check answer ─────────────────────────────────────────────
  const handleCheckAnswer = useCallback(async () => {
    if (!currentExercise || !studentAnswer.trim()) return;

    setIsCheckingAnswer(true);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: currentExercise.exercise,
          studentAnswer: studentAnswer.trim(),
          correctAnswer: currentExercise.answer,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al verificar la respuesta");
      }

      const data = await res.json();
      setCheckResult(data);

      // Update stats
      setStats((prev) => ({
        solved: prev.solved + 1,
        correct: prev.correct + (data.isCorrect ? 1 : 0),
        streak: data.isCorrect ? prev.streak + 1 : 0,
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo verificar la respuesta",
        variant: "destructive",
      });
    } finally {
      setIsCheckingAnswer(false);
    }
  }, [currentExercise, studentAnswer, toast]);

  // ─── Load solution ────────────────────────────────────────────
  const handleShowSolution = useCallback(async () => {
    if (!currentExercise || !selectedTopic) return;

    setShowSolution(true);
    if (solution) return; // Already loaded

    setIsLoadingSolution(true);
    try {
      const topicName = topics.find((t) => t.id === selectedTopic)?.name ?? selectedTopic;
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise: currentExercise.exercise,
          topic: topicName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al generar la solución");
      }

      const data = await res.json();
      setSolution(data.steps);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar la solución",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSolution(false);
    }
  }, [currentExercise, selectedTopic, solution, toast]);

  // ─── Handle topic selection ───────────────────────────────────
  const handleTopicSelect = useCallback((topicId: string) => {
    setSelectedTopic(topicId);
    setCurrentExercise(null);
    setStudentAnswer("");
    setCheckResult(null);
    setShowSolution(false);
    setSolution(null);
    setShowHint(false);
  }, []);

  // ─── Accuracy percentage ──────────────────────────────────────
  const accuracy = stats.solved > 0 ? Math.round((stats.correct / stats.solved) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="bg-[#0a1628] text-white shadow-lg shadow-blue-900/30 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-500/10 to-blue-600/20 blur-xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-700/50 p-2.5 rounded-xl shadow-inner ring-1 ring-blue-400/30">
                <Calculator className="size-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ÁlgebraPro</h1>
                <p className="text-blue-300 text-sm">Tu compañero de práctica de álgebra</p>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 bg-blue-900/50 px-3 py-1.5 rounded-lg ring-1 ring-blue-500/20">
                <BookOpen className="size-4 text-blue-300" />
                <span className="text-sm font-medium">{stats.solved}</span>
                <span className="text-xs text-blue-300 hidden sm:inline">resueltos</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-900/50 px-3 py-1.5 rounded-lg ring-1 ring-blue-500/20">
                <Target className="size-4 text-blue-300" />
                <span className="text-sm font-medium">{accuracy}%</span>
                <span className="text-xs text-blue-300 hidden sm:inline">correctas</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-900/50 px-3 py-1.5 rounded-lg ring-1 ring-blue-500/20">
                <Flame className="size-4 text-amber-400" />
                <span className="text-sm font-medium">{stats.streak}</span>
                <span className="text-xs text-blue-300 hidden sm:inline">racha</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main content ───────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ─── Topic Selection ───────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-600" />
            Elige un tema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topics.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              return (
                <motion.button
                  key={topic.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTopicSelect(topic.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 p-2 rounded-lg ${
                      isSelected ? "bg-emerald-200 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {topic.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-lg mr-1">{topic.emoji}</span>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? "text-emerald-800" : "text-gray-700"
                      }`}
                    >
                      {topic.name}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ─── Difficulty Selector ───────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Trophy className="size-5 text-emerald-600" />
            Dificultad
          </h2>
          <div className="flex flex-wrap gap-3">
            {difficulties.map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <motion.button
                  key={d.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setDifficulty(d.id)}
                  className={`px-5 py-2.5 rounded-lg border-2 font-medium transition-all duration-200 cursor-pointer ${
                    isSelected ? d.bgSelectedClass : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-1.5">{d.emoji}</span>
                  {d.label}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ─── Exercise Area ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {selectedTopic && (
            <motion.section
              key="exercise-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="rounded-xl shadow-md border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="size-5" />
                        Ejercicio
                      </CardTitle>
                      <CardDescription className="text-emerald-200 mt-1">
                        {topics.find((t) => t.id === selectedTopic)?.emoji}{" "}
                        {topics.find((t) => t.id === selectedTopic)?.name} •{" "}
                        {difficulties.find((d) => d.id === difficulty)?.label}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleGenerateExercise}
                      disabled={isLoadingExercise}
                      className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm self-start sm:self-auto"
                    >
                      {isLoadingExercise ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RotateCcw className="size-4" />
                      )}
                      Generar Nuevo Ejercicio
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Loading state */}
                  {isLoadingExercise && (
                    <div className="space-y-4 py-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-6 w-2/3" />
                    </div>
                  )}

                  {/* No exercise yet */}
                  {!isLoadingExercise && !currentExercise && (
                    <div className="text-center py-10">
                      <Calculator className="size-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg">
                        Haz clic en &quot;Generar Nuevo Ejercicio&quot; para comenzar
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Se generará un ejercicio de álgebra adaptado a tu nivel
                      </p>
                    </div>
                  )}

                  {/* Exercise display */}
                  {!isLoadingExercise && currentExercise && (
                    <motion.div
                      key={currentExercise.exercise}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      {/* Exercise problem */}
                      <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                        <p className="text-xl sm:text-2xl font-mono font-semibold text-gray-800 leading-relaxed">
                          {currentExercise.exercise}
                        </p>
                      </div>

                      {/* Hint */}
                      <div className="flex items-start gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHint(!showHint)}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <Lightbulb className="size-4" />
                          {showHint ? "Ocultar pista" : "Mostrar pista"}
                        </Button>
                      </div>
                      <AnimatePresence>
                        {showHint && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-2">
                              <Lightbulb className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-800">{currentExercise.hint}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Answer input */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                          Tu respuesta:
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Escribe tu respuesta aquí..."
                            value={studentAnswer}
                            onChange={(e) => setStudentAnswer(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && studentAnswer.trim()) {
                                handleCheckAnswer();
                              }
                            }}
                            className="font-mono text-lg flex-1"
                            disabled={isCheckingAnswer}
                          />
                          <Button
                            onClick={handleCheckAnswer}
                            disabled={!studentAnswer.trim() || isCheckingAnswer}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5"
                          >
                            {isCheckingAnswer ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )}
                            Verificar
                          </Button>
                        </div>
                      </div>

                      {/* Check result feedback */}
                      <AnimatePresence>
                        {checkResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            {checkResult.isCorrect ? (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="size-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-emerald-800">¡Correcto! 🎉</p>
                                  <p className="text-sm text-emerald-700 mt-1">{checkResult.feedback}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <XCircle className="size-6 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-red-800">Incorrecto</p>
                                  <p className="text-sm text-red-700 mt-1">{checkResult.feedback}</p>
                                  <p className="text-sm text-red-600 mt-2 font-medium">
                                    Respuesta correcta:{" "}
                                    <span className="font-mono">{checkResult.correctAnswer}</span>
                                  </p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Show solution button */}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={handleShowSolution}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium"
                        >
                          <BookOpen className="size-4" />
                          {showSolution ? "Solución" : "Mostrar Solución Completa"}
                          <ChevronRight
                            className={`size-4 transition-transform duration-200 ${
                              showSolution ? "rotate-90" : ""
                            }`}
                          />
                        </Button>
                      </div>

                      {/* Solution accordion */}
                      <AnimatePresence>
                        {showSolution && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {isLoadingSolution ? (
                              <div className="space-y-3 py-4">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex gap-3">
                                    <Skeleton className="size-8 rounded-full flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                      <Skeleton className="h-4 w-1/3" />
                                      <Skeleton className="h-3 w-3/4" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : solution && solution.length > 0 ? (
                              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <Accordion type="multiple" defaultValue={["step-0"]} className="w-full">
                                  {solution.map((step, index) => (
                                    <AccordionItem
                                      key={`step-${index}`}
                                      value={`step-${index}`}
                                      className="border-b last:border-b-0"
                                    >
                                      <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                                        <div className="flex items-center gap-3 text-left">
                                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 font-semibold rounded-full size-7 flex items-center justify-center p-0">
                                            {index + 1}
                                          </Badge>
                                          <span className="font-medium text-gray-800">
                                            {step.title}
                                          </span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4">
                                        <div className="ml-10 space-y-3">
                                          <p className="text-gray-600 text-sm leading-relaxed">
                                            {step.explanation}
                                          </p>
                                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            <p className="font-mono text-emerald-800 font-medium text-sm">
                                              {step.calculation}
                                            </p>
                                          </div>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>
                              </div>
                            ) : null}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ─── Empty state when no topic selected ────────────────── */}
        {!selectedTopic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md mx-auto">
              <div className="bg-emerald-100 size-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="size-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                ¡Bienvenido a ÁlgebraPro!
              </h3>
              <p className="text-gray-500">
                Selecciona un tema y dificultad para comenzar a practicar. 
                Genera ejercicios con IA y recibe explicaciones paso a paso.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="mt-auto bg-gray-100 border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4 space-y-5">
          {/* Coffee donation section */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Heart className="size-4 text-rose-500 fill-rose-500" />
              <span className="text-sm font-medium">Si te ha gustado, invita un café</span>
              <Coffee className="size-4 text-amber-600" />
            </div>
            <motion.a
              href="https://www.paypal.com/paypalme/GerardoVazquezalfaro"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-colors duration-200 cursor-pointer"
            >
              <Coffee className="size-5" />
              Invitar un café
            </motion.a>
          </div>

          {/* Credits */}
          <div className="text-center text-sm text-gray-500">
            <p>
              ÁlgebraPro — Practica álgebra con inteligencia artificial •{" "}
              <span className="text-emerald-600 font-medium">Aprende paso a paso</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
