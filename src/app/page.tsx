"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  { id: "facil", label: "Fácil", emoji: "🟢", colorClass: "text-emerald-400 border-emerald-500/50", bgSelectedClass: "bg-emerald-500/15 border-emerald-500 text-emerald-300" },
  { id: "medio", label: "Medio", emoji: "🟡", colorClass: "text-amber-400 border-amber-500/50", bgSelectedClass: "bg-amber-500/15 border-amber-500 text-amber-300" },
  { id: "dificil", label: "Difícil", emoji: "🔴", colorClass: "text-red-400 border-red-500/50", bgSelectedClass: "bg-red-500/15 border-red-500 text-red-300" },
];

// ─── Solution step type ───────────────────────────────────────────
interface SolutionStep {
  title: string;
  explanation: string;
  calculation: string;
}

// ─── Particles background component ──────────────────────────────────
function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      opacityDir: number;
      color: string;
    }> = [];

    const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#60a5fa", "#a78bfa"];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticles() {
      if (!canvas) return;
      const count = Math.floor((canvas.width * canvas.height) / 15000);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 2.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          opacityDir: Math.random() > 0.5 ? 0.003 : -0.003,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    function drawParticles() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Pulsate opacity
        p.opacity += p.opacityDir;
        if (p.opacity >= 0.5) p.opacityDir = -0.003;
        if (p.opacity <= 0.05) p.opacityDir = 0.003;

        // Draw glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `, ${p.opacity * 0.15})`).replace("rgb", "rgba").replace("#3b82f6", "rgba(59,130,246").replace("#8b5cf6", "rgba(139,92,246").replace("#06b6d4", "rgba(6,182,212").replace("#60a5fa", "rgba(96,165,250").replace("#a78bfa", "rgba(167,139,250");

        // Simple glow approach
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, p.color + Math.round(p.opacity * 255).toString(16).padStart(2, "0"));
        gradient.addColorStop(1, p.color + "00");
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }

      animationId = requestAnimationFrame(drawParticles);
    }

    resize();
    createParticles();
    drawParticles();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
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
          topic: topics.find((t) => t.id === selectedTopic)?.name ?? selectedTopic,
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
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 relative">
      {/* Particles background */}
      <ParticlesBackground />
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="bg-[#0a1628] text-white shadow-lg shadow-blue-900/30 relative overflow-hidden z-10">
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">GLOMA ALGEBRA</h1>
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

      {/* ─── SEO / Intro text ────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#0a0a0f] to-[#0f0f1a] relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Practica álgebra con ejercicios interactivos y explicaciones paso a paso
          </h2>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
            Aprende a <strong className="text-blue-400">resolver ecuaciones</strong>, <strong className="text-blue-400">factorizar polinomios</strong>, 
            <strong className="text-blue-400"> simplificar fracciones algebraicas</strong> y dominar las <strong className="text-blue-400">leyes de los exponentes</strong>. 
            Nuestra herramienta genera ejercicios de <strong className="text-purple-400">álgebra con soluciones explicadas</strong> para que practiques 
            <strong className="text-blue-400"> ecuaciones lineales y cuadráticas</strong>, <strong className="text-blue-400">sistemas de ecuaciones</strong>, 
            <strong className="text-blue-400"> desigualdades</strong>, <strong className="text-blue-400">radicales</strong> y <strong className="text-blue-400">funciones lineales</strong>. 
            Ideal para <strong className="text-purple-400">estudiantes de álgebra</strong> que buscan <strong className="text-purple-400">practicar matemáticas online</strong>, 
            <strong className="text-purple-400">resolver problemas de álgebra paso a paso</strong> y <strong className="text-purple-400">mejorar sus calificaciones</strong>.
          </p>
        </div>
      </section>

      {/* ─── Main content ───────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 relative z-10">
        {/* ─── Topic Selection ───────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="size-5 text-blue-400" />
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
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 p-2 rounded-lg ${
                      isSelected ? "bg-blue-500/30 text-blue-300" : "bg-white/10 text-gray-400"
                    }`}
                  >
                    {topic.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-lg mr-1">{topic.emoji}</span>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? "text-blue-200" : "text-gray-300"
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
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Trophy className="size-5 text-blue-400" />
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
                    isSelected ? d.bgSelectedClass : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
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
              <Card className="rounded-xl shadow-lg shadow-blue-900/20 border border-white/10 bg-[#12121a] overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="size-5" />
                        Ejercicio
                      </CardTitle>
                      <CardDescription className="text-blue-200 mt-1">
                        {topics.find((t) => t.id === selectedTopic)?.emoji}{" "}
                        {topics.find((t) => t.id === selectedTopic)?.name} •{" "}
                        {difficulties.find((d) => d.id === difficulty)?.label}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleGenerateExercise}
                      disabled={isLoadingExercise}
                      className="bg-white/10 text-white hover:bg-white/20 font-semibold shadow-sm self-start sm:self-auto border border-white/20"
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
                      <Calculator className="size-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400 text-lg">
                        Haz clic en &quot;Generar Nuevo Ejercicio&quot; para comenzar
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
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
                      <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10">
                        <p className="text-xl sm:text-2xl font-mono font-semibold text-blue-200 leading-relaxed">
                          {currentExercise.exercise}
                        </p>
                      </div>

                      {/* Hint */}
                      <div className="flex items-start gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHint(!showHint)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
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
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-2">
                              <Lightbulb className="size-4 text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-200">{currentExercise.hint}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Answer input */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">
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
                            className="font-mono text-lg flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            disabled={isCheckingAnswer}
                          />
                          <Button
                            onClick={handleCheckAnswer}
                            disabled={!studentAnswer.trim() || isCheckingAnswer}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5"
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
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="size-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-emerald-300">¡Correcto! 🎉</p>
                                  <p className="text-sm text-emerald-400 mt-1">{checkResult.feedback}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                <XCircle className="size-6 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-red-300">Incorrecto</p>
                                  <p className="text-sm text-red-400 mt-1">{checkResult.feedback}</p>
                                  <p className="text-sm text-red-400 mt-2 font-medium">
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
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-medium"
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
                              <div className="bg-[#12121a] border border-white/10 rounded-xl overflow-hidden">
                                <Accordion type="multiple" defaultValue={["step-0"]} className="w-full">
                                  {solution.map((step, index) => (
                                    <AccordionItem
                                      key={`step-${index}`}
                                      value={`step-${index}`}
                                      className="border-b last:border-b-0"
                                    >
                                      <AccordionTrigger className="px-4 hover:no-underline hover:bg-white/5">
                                        <div className="flex items-center gap-3 text-left">
                                          <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-0 font-semibold rounded-full size-7 flex items-center justify-center p-0">
                                            {index + 1}
                                          </Badge>
                                          <span className="font-medium text-gray-200">
                                            {step.title}
                                          </span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4">
                                        <div className="ml-10 space-y-3">
                                          <p className="text-gray-400 text-sm leading-relaxed">
                                            {step.explanation}
                                          </p>
                                          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                            <p className="font-mono text-blue-300 font-medium text-sm">
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
            <div className="bg-[#12121a] rounded-2xl shadow-lg shadow-blue-900/20 border border-white/10 p-8 max-w-md mx-auto">
              <div className="bg-blue-500/20 size-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="size-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                ¡Bienvenido a GLOMA ALGEBRA!
              </h3>
              <p className="text-gray-400">
                Selecciona un tema y dificultad para comenzar a practicar. 
                Genera ejercicios con IA y recibe explicaciones paso a paso.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="mt-auto bg-[#0a0a0f] border-t border-white/10 py-6 relative z-10">
        <div className="max-w-5xl mx-auto px-4 space-y-5">
          {/* Coffee donation section */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400">
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
            <p>COPYRIGHT 2026-MARYWPBLOG</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
