import { useMemo, useState } from "react";

type ExamOption = {
  id: string;
  text: string;
};

type ExamQuestion = {
  id: number;
  subject: string;
  difficulty: "Fácil" | "Media" | "Difícil";
  question: string;
  options: ExamOption[];
};

const MOCK_QUESTIONS: ExamQuestion[] = [
  {
    id: 1,
    subject: "Matemáticas",
    difficulty: "Media",
    question:
      "Si una función lineal tiene pendiente 3 y corta al eje Y en 2, ¿cuál es su expresión algebraica?",
    options: [
      { id: "A", text: "y = 3x + 2" },
      { id: "B", text: "y = 2x + 3" },
      { id: "C", text: "y = 3x - 2" },
      { id: "D", text: "y = x + 5" },
    ],
  },
  {
    id: 2,
    subject: "Comprensión lectora",
    difficulty: "Media",
    question:
      "¿Cuál es la intención principal de un texto argumentativo?",
    options: [
      { id: "A", text: "Narrar una historia ficticia" },
      { id: "B", text: "Convencer al lector de una postura" },
      { id: "C", text: "Describir un paisaje" },
      { id: "D", text: "Explicar un procedimiento técnico" },
    ],
  },
  {
    id: 3,
    subject: "Química",
    difficulty: "Difícil",
    question:
      "¿Cuál de los siguientes elementos pertenece al grupo de los halógenos?",
    options: [
      { id: "A", text: "Sodio" },
      { id: "B", text: "Cloro" },
      { id: "C", text: "Calcio" },
      { id: "D", text: "Hierro" },
    ],
  },
  {
    id: 4,
    subject: "Física",
    difficulty: "Fácil",
    question:
      "¿Cuál es la unidad de medida de la fuerza en el Sistema Internacional?",
    options: [
      { id: "A", text: "Joule" },
      { id: "B", text: "Pascal" },
      { id: "C", text: "Newton" },
      { id: "D", text: "Watt" },
    ],
  },
  {
    id: 5,
    subject: "Historia",
    difficulty: "Media",
    question:
      "¿En qué año inició la Revolución Mexicana?",
    options: [
      { id: "A", text: "1810" },
      { id: "B", text: "1910" },
      { id: "C", text: "1921" },
      { id: "D", text: "1938" },
    ],
  },
];

const TOTAL_TIME_IN_MINUTES = 180;

const formatTime = (minutes: number, seconds = 0) => {
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}:00`;
};

const getDifficultyStyles = (difficulty: ExamQuestion["difficulty"]) => {
  switch (difficulty) {
    case "Fácil":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Media":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Difícil":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

export default function ExamSimulatorLayout() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
    {}
  );

  const totalQuestions = MOCK_QUESTIONS.length;
  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];

  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers]
  );

  const unansweredCount = totalQuestions - answeredCount;

  const progressPercentage = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return (answeredCount / totalQuestions) * 100;
  }, [answeredCount, totalQuestions]);

  const handleSelectAnswer = (questionId: number, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const questionStatusLabel = (questionId: number) =>
    selectedAnswers[questionId] ? "Respondida" : "Pendiente";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-xl">
          <div className="flex flex-col gap-6 px-6 py-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                Simulador online 2026
              </p>
              <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
                Simulador de Examen UNAM / IPN
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">
                Practica en un entorno tipo examen real con temporizador,
                navegación por reactivos y seguimiento de avance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-slate-200">
                  Preguntas
                </p>
                <p className="mt-1 text-2xl font-bold">{totalQuestions}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-slate-200">
                  Tiempo total
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatTime(TOTAL_TIME_IN_MINUTES)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm col-span-2 sm:col-span-1">
                <p className="text-xs uppercase tracking-wide text-slate-200">
                  Modo
                </p>
                <p className="mt-1 text-2xl font-bold">Práctica</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
          {/* Left column */}
          <main className="space-y-6">
            {/* Top stats */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Avance del examen
                  </p>
                  <h2 className="text-xl font-bold text-slate-900">
                    Pregunta {currentQuestionIndex + 1} de {totalQuestions}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    Respondidas: {answeredCount}
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-100">
                    Pendientes: {unansweredCount}
                  </div>
                </div>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Has completado el{" "}
                <span className="font-bold text-slate-800">
                  {Math.round(progressPercentage)}%
                </span>{" "}
                del simulador.
              </p>
            </section>

            {/* Question card */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
              <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {currentQuestion.subject}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyStyles(
                      currentQuestion.difficulty
                    )}`}
                  >
                    {currentQuestion.difficulty}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {questionStatusLabel(currentQuestion.id)}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-md">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Tiempo restante
                  </p>
                  <p className="text-lg font-bold">
                    {formatTime(TOTAL_TIME_IN_MINUTES)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Reactivo {currentQuestion.id}
                </p>

                <h3 className="text-xl font-bold leading-relaxed text-slate-900 sm:text-2xl">
                  {currentQuestion.question}
                </h3>
              </div>

              <div className="mt-8 grid gap-4">
                {currentQuestion.options.map((option) => {
                  const isSelected =
                    selectedAnswers[currentQuestion.id] === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleSelectAnswer(currentQuestion.id, option.id)
                      }
                      className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 shadow-md"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
                        }`}
                      >
                        {option.id}
                      </div>

                      <div className="flex-1 pt-1">
                        <p
                          className={`text-base font-medium ${
                            isSelected ? "text-blue-900" : "text-slate-800"
                          }`}
                        >
                          {option.text}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ← Pregunta anterior
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Marcar para revisar
                  </button>

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente pregunta →
                  </button>
                </div>
              </div>
            </section>
          </main>

          {/* Right column */}
          <aside className="space-y-6">
            {/* Summary card */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h4 className="text-lg font-bold text-slate-900">
                Resumen del simulador
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Control rápido del progreso del examen.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {totalQuestions}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                  <p className="text-xs uppercase tracking-wide text-blue-600">
                    Actual
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-800">
                    {currentQuestionIndex + 1}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <p className="text-xs uppercase tracking-wide text-emerald-600">
                    Respondidas
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">
                    {answeredCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
                  <p className="text-xs uppercase tracking-wide text-rose-600">
                    Pendientes
                  </p>
                  <p className="mt-1 text-2xl font-bold text-rose-700">
                    {unansweredCount}
                  </p>
                </div>
              </div>
            </section>

            {/* Question navigator */}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    Navegación
                  </h4>
                  <p className="text-sm text-slate-500">
                    Salta entre reactivos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {MOCK_QUESTIONS.map((question, index) => {
                  const isCurrent = index === currentQuestionIndex;
                  const isAnswered = Boolean(selectedAnswers[question.id]);

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => handleGoToQuestion(index)}
                      className={`flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold transition ${
                        isCurrent
                          ? "bg-slate-900 text-white shadow-lg"
                          : isAnswered
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {question.id}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-900" />
                  <span>Pregunta actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span>Respondida</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span>Pendiente</span>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-900 p-5 text-white shadow-xl">
              <h4 className="text-lg font-bold">¿Listo para enviar?</h4>
              <p className="mt-2 text-sm text-slate-300">
                Revisa tus respuestas antes de finalizar el simulador.
              </p>

              <button
                type="button"
                className="mt-5 w-full rounded-2xl bg-white px-5 py-3 font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Finalizar simulador
              </button>

              <button
                type="button"
                className="mt-3 w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                Guardar progreso
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}