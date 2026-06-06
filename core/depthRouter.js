"use strict";

(function attachPromptBoostDepthRouter(globalScope) {
  function route({ context, taskType, metadata, normalized }) {
    let nextContext = context;
    let nextTaskType = routeDepth(context, taskType, metadata, normalized);

    if (metadata.interviewIntent && (context === "general" || context === "study")) {
      nextContext = "study";
      nextTaskType = "interview_prep";
    }

    if ((metadata.examIntent || metadata.depth === "deep" || metadata.depth === "beginner" || metadata.depth === "summary") && context === "general") {
      nextContext = "study";
      nextTaskType = routeDepth("study", taskType, metadata, normalized);
    }

    if (metadata.negativeReviewIntent) {
      nextContext = "writing";
      nextTaskType = "review_response";
    }

    return {
      context: nextContext,
      taskType: nextTaskType,
      contextChanged: nextContext !== context
    };
  }

  function routeDepth(context, taskType, metadata) {
    if (context !== "study") {
      return taskType;
    }

    if (metadata.interviewIntent) {
      return "interview_prep";
    }

    if (metadata.examIntent) {
      return "exam_prep";
    }

    if (metadata.depth === "deep") {
      return "conceptual_breakdown";
    }

    if (metadata.depth === "summary") {
      return "quick_summary";
    }

    if (metadata.depth === "beginner") {
      return "beginner_learning";
    }

    return taskType;
  }

  globalScope.PromptBoostDepthRouter = {
    route,
    routeDepth
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
