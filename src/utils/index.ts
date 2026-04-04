import type { Difficulty, SubjectStats } from "../types";

export const getDifficultyStyles = (difficulty: Difficulty) => {
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
}

/** Cronometro */
export const formatSecondsToClock = (totalSeconds: number) => {
  const safeSeconds = Math.max(totalSeconds, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};
export const formatSpentTime = (usedSeconds: number) => {
  const hours = Math.floor(usedSeconds / 3600);
  const minutes = Math.floor((usedSeconds % 3600) / 60);
  const seconds = usedSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

/** Message de Finally */
export const getPerformanceLabel = (score: number) => {
  if (score >= 90) {
    return {
      label: "Rendimiento sobresaliente",
      style:
        "bg-emerald-100 text-emerald-700 border border-emerald-200",
    };
  }

  if (score >= 75) {
    return {
      label: "Muy buen rendimiento",
      style: "bg-blue-100 text-blue-700 border border-blue-200",
    };
  }

  if (score >= 60) {
    return {
      label: "Buen rendimiento",
      style: "bg-amber-100 text-amber-700 border border-amber-200",
    };
  }

  if (score >= 40) {
    return {
      label: "Rendimiento básico",
      style: "bg-orange-100 text-orange-700 border border-orange-200",
    };
  }

  return {
    label: "Necesita reforzamiento",
    style: "bg-rose-100 text-rose-700 border border-rose-200",
  };
};

export const getEstimatedLevel = (score: number) => {
  if (score >= 90) return "Competitivo alto";
  if (score >= 75) return "Competitivo medio-alto";
  if (score >= 60) return "Competitivo medio";
  if (score >= 40) return "Competitivo inicial";
  return "Requiere mayor preparación";
};

export const getRecommendations = (
  score: number,
  subjectStats: SubjectStats[],
  unansweredCount: number
) => {
  const weakestSubjects = [...subjectStats]
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 2);

  const recommendations: string[] = [];

  if (score < 60) {
    recommendations.push(
      "Incrementa la práctica diaria con simuladores cronometrados y sesiones enfocadas por materia."
    );
  }

  if (score >= 60 && score < 85) {
    recommendations.push(
      "Mantén la práctica constante y refuerza los temas donde todavía cometes errores recurrentes."
    );
  }

  if (score >= 85) {
    recommendations.push(
      "Tu base es sólida. Enfócate en consistencia, control de tiempo y revisión de errores finos."
    );
  }

  weakestSubjects.forEach((item) => {
    recommendations.push(
      `Refuerza ${item.subject}: tu desempeño actual es de ${item.percentage}% en esta materia.`
    );
  });

  if (unansweredCount > 0) {
    recommendations.push(
      "Trabaja estrategias de administración del tiempo para evitar dejar reactivos sin responder."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Continúa practicando con exámenes completos para mejorar precisión y velocidad."
    );
  }

  return recommendations.slice(0, 4);
};