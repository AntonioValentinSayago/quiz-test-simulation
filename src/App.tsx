import { useEffect, useMemo, useState } from "react";
import {
  getDifficultyStyles,
  formatSecondsToClock,
  formatSpentTime,
  getPerformanceLabel,
  getEstimatedLevel,
  getRecommendations,
} from "./utils/index";
import type { ExamQuestion, ExamStage, SubjectStats } from "./types";
import { getQuestionstAll } from "./api/QuestionsApi";

const EXAM_DURATION_MINUTES = 180;

export default function App() {
  const [EXAM_QUESTIONS, setEXAM_QUESTIONS] = useState<ExamQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [stage, setStage] = useState<ExamStage>("exam");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
    {}
  );
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(
    EXAM_DURATION_MINUTES * 60
  );
  const [submittedAtSeconds, setSubmittedAtSeconds] = useState<number | null>(
    null
  );

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        setQuestionsError(null);

        const questions = await getQuestionstAll();
        setEXAM_QUESTIONS(questions);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Error al cargar las preguntas";
        setQuestionsError(message);
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const totalQuestions = EXAM_QUESTIONS.length;
  const currentQuestion = EXAM_QUESTIONS[currentQuestionIndex] ?? null;
  const isLastQuestion =
    totalQuestions > 0 && currentQuestionIndex === totalQuestions - 1;

  useEffect(() => {
    if (stage !== "exam") return;
    if (remainingSeconds <= 0) return;
    if (questionsLoading) return;
    if (totalQuestions === 0) return;

    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [stage, remainingSeconds, questionsLoading, totalQuestions]);

  useEffect(() => {
    if (stage === "exam" && remainingSeconds === 0 && totalQuestions > 0) {
      handleFinishExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, stage, totalQuestions]);

  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers]
  );

  const unansweredCount = totalQuestions - answeredCount;
  const progressPercentage = totalQuestions
    ? (answeredCount / totalQuestions) * 100
    : 0;

  const isExamCompleted = totalQuestions > 0 && answeredCount === totalQuestions;

  const correctCount = useMemo(() => {
    return EXAM_QUESTIONS.reduce((acc, question) => {
      return selectedAnswers[question.id] === question.correctAnswer
        ? acc + 1
        : acc;
    }, 0);
  }, [selectedAnswers, EXAM_QUESTIONS]);

  const incorrectCount = useMemo(() => {
    return EXAM_QUESTIONS.reduce((acc, question) => {
      const answer = selectedAnswers[question.id];

      if (!answer) return acc;
      if (answer !== question.correctAnswer) return acc + 1;

      return acc;
    }, 0);
  }, [selectedAnswers, EXAM_QUESTIONS]);

  const scorePercentage = totalQuestions
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  const performance = getPerformanceLabel(scorePercentage);
  const estimatedLevel = getEstimatedLevel(scorePercentage);
  const usedSeconds =
    submittedAtSeconds !== null
      ? EXAM_DURATION_MINUTES * 60 - submittedAtSeconds
      : EXAM_DURATION_MINUTES * 60 - remainingSeconds;

  const subjectStats = useMemo<SubjectStats[]>(() => {
    const grouped = EXAM_QUESTIONS.reduce<Record<string, SubjectStats>>(
      (acc, question) => {
        if (!acc[question.subject]) {
          acc[question.subject] = {
            subject: question.subject,
            total: 0,
            correct: 0,
            incorrect: 0,
            answered: 0,
            percentage: 0,
          };
        }

        acc[question.subject].total += 1;

        const userAnswer = selectedAnswers[question.id];
        if (userAnswer) {
          acc[question.subject].answered += 1;
        }

        if (userAnswer === question.correctAnswer) {
          acc[question.subject].correct += 1;
        } else if (userAnswer && userAnswer !== question.correctAnswer) {
          acc[question.subject].incorrect += 1;
        }

        return acc;
      },
      {}
    );

    return Object.values(grouped).map((item) => ({
      ...item,
      percentage: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    }));
  }, [selectedAnswers, EXAM_QUESTIONS]);

  const incorrectQuestions = useMemo(() => {
    return EXAM_QUESTIONS.filter((question) => {
      const answer = selectedAnswers[question.id];
      return Boolean(answer) && answer !== question.correctAnswer;
    });
  }, [selectedAnswers, EXAM_QUESTIONS]);

  const unansweredQuestions = useMemo(() => {
    return EXAM_QUESTIONS.filter((question) => !selectedAnswers[question.id]);
  }, [selectedAnswers, EXAM_QUESTIONS]);

  const recommendations = useMemo(() => {
    return getRecommendations(scorePercentage, subjectStats, unansweredCount);
  }, [scorePercentage, subjectStats, unansweredCount]);

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

  const toggleMarkForReview = (questionId: number) => {
    setMarkedForReview((prev) => {
      const exists = prev.includes(questionId);
      if (exists) {
        return prev.filter((id) => id !== questionId);
      }

      return [...prev, questionId];
    });
  };

  const handleFinishExam = () => {
    setSubmittedAtSeconds(remainingSeconds);
    setStage("results");
  };

  const handleRestartExam = () => {
    setStage("exam");
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setMarkedForReview([]);
    setRemainingSeconds(EXAM_DURATION_MINUTES * 60);
    setSubmittedAtSeconds(null);
  };

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-slate-800">
              Cargando preguntas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-rose-700">
              {questionsError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-slate-800">
              No hay preguntas disponibles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "results") {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white shadow-2xl">
            <div className="flex flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Resultado oficial del simulador
                </p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Reporte de desempeño UNAM / IPN 2026
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
                  Análisis integral del examen: precisión, tiempo, desempeño por
                  materia, reactivos incorrectos y recomendaciones de mejora.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Puntaje
                  </p>
                  <p className="mt-1 text-3xl font-black">{scorePercentage}%</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Aciertos
                  </p>
                  <p className="mt-1 text-3xl font-black">{correctCount}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Errores
                  </p>
                  <p className="mt-1 text-3xl font-black">{incorrectCount}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Tiempo usado
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {formatSpentTime(usedSeconds)}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
            <main className="space-y-6">
              <section className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Resultado general
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                        {scorePercentage}%
                      </h2>
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${performance.style}`}
                      >
                        {performance.label}
                      </span>
                    </div>
                    <p className="mt-4 max-w-3xl text-slate-600">
                      Tu nivel estimado en este simulador es{" "}
                      <span className="font-bold text-slate-900">
                        {estimatedLevel}
                      </span>
                      . Este resultado te ayuda a identificar fortalezas,
                      debilidades y áreas prioritarias de reforzamiento antes del
                      examen real.
                    </p>
                  </div>

                  <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide text-blue-100">
                        Score
                      </p>
                      <p className="text-4xl font-black">{scorePercentage}</p>
                      <p className="text-sm font-medium text-blue-100">/100</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Total de reactivos
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                      {totalQuestions}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                      Reactivos correctos
                    </p>
                    <p className="mt-2 text-3xl font-black text-emerald-700">
                      {correctCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-100">
                    <p className="text-xs uppercase tracking-wide text-rose-600">
                      Reactivos incorrectos
                    </p>
                    <p className="mt-2 text-3xl font-black text-rose-700">
                      {incorrectCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100">
                    <p className="text-xs uppercase tracking-wide text-amber-600">
                      Sin responder
                    </p>
                    <p className="mt-2 text-3xl font-black text-amber-700">
                      {unansweredCount}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      Desempeño por materia
                    </h3>
                    <p className="mt-1 text-slate-500">
                      Visualiza con precisión qué materias requieren más trabajo.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {subjectStats.map((item) => (
                    <div
                      key={item.subject}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">
                            {item.subject}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {item.correct} correctas · {item.incorrect} incorrectas ·{" "}
                            {item.total} total
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Rendimiento
                          </p>
                          <p className="text-2xl font-black text-slate-900">
                            {item.percentage}%
                          </p>
                        </div>
                      </div>

                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-950">
                    Recomendaciones estratégicas
                  </h3>
                  <p className="mt-1 text-slate-500">
                    Sugerencias basadas en tu desempeño actual para mejorar tu
                    preparación.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {recommendations.map((recommendation, index) => (
                    <div
                      key={`${recommendation}-${index}`}
                      className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 p-5 text-white shadow-lg"
                    >
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                        Recomendación {index + 1}
                      </p>
                      <p className="text-sm leading-7 text-slate-100">
                        {recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-950">
                    Reactivos incorrectos
                  </h3>
                  <p className="mt-1 text-slate-500">
                    Revisión detallada de tus errores para estudio posterior.
                  </p>
                </div>

                {incorrectQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700">
                    Excelente trabajo. No tienes reactivos incorrectos en este
                    simulador.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incorrectQuestions.map((question) => {
                      const selectedOption = question.options.find(
                        (option) => option.id === selectedAnswers[question.id]
                      );
                      const correctOption = question.options.find(
                        (option) => option.id === question.correctAnswer
                      );

                      return (
                        <div
                          key={question.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="mb-4 flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                              Reactivo {question.id}
                            </span>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              {question.subject}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyStyles(
                                question.difficulty
                              )}`}
                            >
                              {question.difficulty}
                            </span>
                          </div>

                          <h4 className="text-lg font-bold leading-relaxed text-slate-900">
                            {question.question}
                          </h4>

                          <div className="mt-5 grid gap-3">
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                                Tu respuesta
                              </p>
                              <p className="mt-2 font-semibold text-rose-700">
                                {selectedOption
                                  ? `${selectedOption.id}. ${selectedOption.text}`
                                  : "Sin respuesta"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                Respuesta correcta
                              </p>
                              <p className="mt-2 font-semibold text-emerald-700">
                                {correctOption
                                  ? `${correctOption.id}. ${correctOption.text}`
                                  : "No disponible"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Explicación
                              </p>
                              <p className="mt-2 leading-7 text-slate-700">
                                {question.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {unansweredQuestions.length > 0 && (
                <section className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
                  <div className="mb-5">
                    <h3 className="text-2xl font-black text-slate-950">
                      Reactivos sin responder
                    </h3>
                    <p className="mt-1 text-slate-500">
                      Estas preguntas quedaron pendientes al momento de enviar el
                      simulador.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {unansweredQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Reactivo {question.id}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-amber-200">
                            {question.subject}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-slate-700">
                          {question.question}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </main>

            <aside className="space-y-6">
              <section className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-black text-slate-950">
                  Resumen ejecutivo
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Indicadores clave del simulador.
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Nivel estimado
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                      {estimatedLevel}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                    <p className="text-xs uppercase tracking-wide text-blue-600">
                      Tiempo empleado
                    </p>
                    <p className="mt-2 text-lg font-black text-blue-800">
                      {formatSpentTime(usedSeconds)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                      Eficiencia
                    </p>
                    <p className="mt-2 text-lg font-black text-emerald-700">
                      {correctCount}/{totalQuestions} correctas
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                    <p className="text-xs uppercase tracking-wide text-amber-600">
                      Marcadas para revisar
                    </p>
                    <p className="mt-2 text-lg font-black text-amber-700">
                      {markedForReview.length}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-black text-slate-950">
                  Ranking estimado
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Proyección aproximada basada en tu score actual.
                </p>

                <div className="mt-5 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-6 text-white shadow-xl">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                    Proyección
                  </p>
                  <p className="mt-3 text-3xl font-black">{estimatedLevel}</p>
                  <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ width: `${scorePercentage}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    Tu rendimiento actual indica una preparación de nivel{" "}
                    <span className="font-bold text-white">
                      {estimatedLevel}
                    </span>
                    .
                  </p>
                </div>
              </section>

              <section className="rounded-[30px] bg-gradient-to-br from-slate-900 to-indigo-900 p-6 text-white shadow-2xl">
                <h3 className="text-xl font-black">Siguiente paso</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Puedes reiniciar este simulador para volver a practicar o usar
                  este reporte como referencia para construir un plan de estudio
                  más preciso.
                </p>

                <button
                  type="button"
                  onClick={handleRestartExam}
                  className="mt-6 w-full rounded-2xl bg-white px-5 py-3 font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Reiniciar simulador
                </button>
              </section>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-2xl">
          <div className="flex flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                Simulador online 2026
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Simulador de Examen UNAM / IPN
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
                Entrena en un entorno visual tipo plataforma premium con control
                de progreso, reactivos, revisión y resultado integral.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Preguntas
                </p>
                <p className="mt-1 text-2xl font-black">{totalQuestions}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Tiempo total
                </p>
                <p className="mt-1 text-2xl font-black">
                  {formatSecondsToClock(EXAM_DURATION_MINUTES * 60)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Respondidas
                </p>
                <p className="mt-1 text-2xl font-black">{answeredCount}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-slate-300">
                  Pendientes
                </p>
                <p className="mt-1 text-2xl font-black">{unansweredCount}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
          <main className="space-y-6">
            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Avance del examen
                  </p>
                  <h2 className="text-2xl font-black text-slate-900">
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
                {isExamCompleted ? (
                  <span className="font-semibold text-emerald-600">
                    Has completado el examen. Puedes enviarlo o revisar tus
                    respuestas.
                  </span>
                ) : (
                  <>
                    Has completado el{" "}
                    <span className="font-bold text-slate-800">
                      {Math.round(progressPercentage)}%
                    </span>{" "}
                    del simulador.
                  </>
                )}
              </p>
            </section>

            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
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
                    {selectedAnswers[currentQuestion.id]
                      ? "Respondida"
                      : "Pendiente"}
                  </span>
                  {markedForReview.includes(currentQuestion.id) && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Marcada para revisar
                    </span>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-lg">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Tiempo restante
                  </p>
                  <p className="text-2xl font-black">
                    {formatSecondsToClock(remainingSeconds)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Reactivo {currentQuestion.id}
                </p>

                <h3 className="text-2xl font-black leading-relaxed text-slate-950">
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
                          className={`text-base font-semibold ${
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

              <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ← Pregunta anterior
                </button>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => toggleMarkForReview(currentQuestion.id)}
                    className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition ${
                      markedForReview.includes(currentQuestion.id)
                        ? "border border-amber-300 bg-amber-100 text-amber-700"
                        : "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {markedForReview.includes(currentQuestion.id)
                      ? "Quitar marca"
                      : "Marcar para revisar"}
                  </button>

                  {isLastQuestion ? (
                    <button
                      type="button"
                      onClick={handleFinishExam}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-emerald-700"
                    >
                      Finalizar simulador
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-slate-800"
                    >
                      Siguiente pregunta →
                    </button>
                  )}
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h4 className="text-xl font-black text-slate-950">
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
                  <p className="mt-1 text-3xl font-black text-slate-900">
                    {totalQuestions}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                  <p className="text-xs uppercase tracking-wide text-blue-600">
                    Actual
                  </p>
                  <p className="mt-1 text-3xl font-black text-blue-800">
                    {currentQuestionIndex + 1}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                  <p className="text-xs uppercase tracking-wide text-emerald-600">
                    Respondidas
                  </p>
                  <p className="mt-1 text-3xl font-black text-emerald-700">
                    {answeredCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
                  <p className="text-xs uppercase tracking-wide text-rose-600">
                    Pendientes
                  </p>
                  <p className="mt-1 text-3xl font-black text-rose-700">
                    {unansweredCount}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4">
                <h4 className="text-xl font-black text-slate-950">
                  Navegación
                </h4>
                <p className="text-sm text-slate-500">
                  Salta entre reactivos.
                </p>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {EXAM_QUESTIONS.map((question, index) => {
                  const isCurrent = index === currentQuestionIndex;
                  const isAnswered = Boolean(selectedAnswers[question.id]);
                  const isMarked = markedForReview.includes(question.id);

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => handleGoToQuestion(index)}
                      className={`relative flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold transition ${
                        isCurrent
                          ? "bg-slate-950 text-white shadow-lg"
                          : isAnswered
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {question.id}
                      {isMarked && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-950" />
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
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span>Marcada para revisar</span>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] bg-gradient-to-br from-slate-900 to-indigo-900 p-5 text-white shadow-2xl">
              <h4 className="text-xl font-black">¿Listo para enviar?</h4>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Puedes finalizar en cualquier momento. El resultado mostrará tus
                aciertos, errores, tiempo y análisis por materia.
              </p>

              <button
                type="button"
                onClick={handleFinishExam}
                className="mt-5 w-full rounded-2xl bg-white px-5 py-3 font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Finalizar simulador
              </button>

              <button
                type="button"
                onClick={handleRestartExam}
                className="mt-3 w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                Reiniciar intento
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}