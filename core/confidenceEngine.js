"use strict";

(function attachPromptBoostConfidenceEngine(globalScope) {
  function calculateTaskConfidence({ contextAnalysis, taskAnalysis, normalized, context, taskType, metadata, mode }) {
    const contextScore = contextAnalysis.confidence || 0;
    const rankedTasks = rankScores(taskAnalysis.scores || {});
    const topTaskScore = rankedTasks[0] ? rankedTasks[0].score : 0;
    const runnerUpScore = rankedTasks[1] ? rankedTasks[1].score : 0;
    const tokenCount = normalized.tokens.length;
    const margin = Math.max(topTaskScore - runnerUpScore, 0);
    const manualContextBonus = mode === "coding" || mode === "study" ? 10 : 0;
    const priorityBonus = prioritySignalBonus(normalized, metadata, context, taskType);
    const ambiguityPenalty = ambiguityPenaltyFor(normalized, context, taskType, metadata);
    const taskConfidence = Math.min(99, Math.round(topTaskScore * 7 + margin * 5 + Math.min(tokenCount, 8) * 3 + priorityBonus));
    const combined = clamp(Math.round(contextScore * 0.42 + taskConfidence * 0.58 + manualContextBonus - ambiguityPenalty), 0, 99);
    const isAmbiguousRoute = isAmbiguous(normalized, combined, topTaskScore, margin, metadata);

    return {
      combined,
      contextConfidence: contextScore,
      taskConfidence,
      topTaskScore,
      runnerUpScore,
      margin,
      level: confidenceLevel(combined, tokenCount, topTaskScore, margin, isAmbiguousRoute),
      isAmbiguous: isAmbiguousRoute,
      reason: reasonFor(combined, topTaskScore, margin, isAmbiguousRoute)
    };
  }

  function rankScores(scores) {
    return Object.entries(scores)
      .map(([taskType, score]) => ({ taskType, score }))
      .sort((a, b) => b.score - a.score);
  }

  function prioritySignalBonus(normalized, metadata, context, taskType) {
    let bonus = 0;

    if (metadata.interviewIntent && taskType === "interview_prep") {
      bonus += 18;
    }

    if (metadata.examIntent && taskType === "exam_prep") {
      bonus += 12;
    }

    if (metadata.negativeReviewIntent) {
      bonus += context === "marketing" ? -20 : 16;
    }

    if (metadata.depth === "deep" && taskType === "conceptual_breakdown") {
      bonus += 10;
    }

    if (/\b(write|create|generate)\s+(ad|caption|hook|cta)\b/i.test(normalized.lower)) {
      bonus += 8;
    }

    return bonus;
  }

  function ambiguityPenaltyFor(normalized, context, taskType, metadata) {
    let penalty = 0;

    if (normalized.tokens.length <= 1) {
      penalty += 35;
    }

    if (metadata.negativeReviewIntent && context === "marketing" && taskType === "ad_copy") {
      penalty += 40;
    }

    if (/^(write|make|create|generate|fix|review|optimize|explain)$/i.test(normalized.text)) {
      penalty += 25;
    }

    return penalty;
  }

  function confidenceLevel(score, tokenCount, topTaskScore, margin, ambiguous) {
    if (ambiguous || tokenCount <= 1 || topTaskScore === 0 || score < 42) {
      return "low";
    }

    if (score < 72 || margin <= 2) {
      return "medium";
    }

    return "high";
  }

  function isAmbiguous(normalized, score, topTaskScore, margin, metadata) {
    if (normalized.tokens.length <= 1) {
      return true;
    }

    if (topTaskScore === 0 || score < 42) {
      return true;
    }

    if (margin <= 1 && topTaskScore < 9 && score < 72) {
      return true;
    }

    if (metadata.negativeReviewIntent) {
      return false;
    }

    return /^(help|post|review|explain|optimize|write|fix|make|create|generate)$/i.test(normalized.text);
  }

  function reasonFor(score, topTaskScore, margin, ambiguous) {
    if (ambiguous) {
      return "ambiguous-input";
    }

    if (topTaskScore === 0) {
      return "unknown-task";
    }

    if (margin <= 2) {
      return "competing-task-signals";
    }

    return score >= 72 ? "confident-route" : "partial-route";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  globalScope.PromptBoostConfidenceEngine = {
    calculateTaskConfidence
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
