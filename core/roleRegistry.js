"use strict";

(function attachPromptBoostRoleRegistry(globalScope) {
  function getRole(semantic) {
    const taskType = semantic.taskType || "";

    if (taskType === "linkedin_post") {
      return "Write as a LinkedIn content strategist.";
    }

    if (taskType === "instagram_caption") {
      return "Write as a social media strategist.";
    }

    if (taskType === "review_response") {
      return "Respond like a calm customer experience lead.";
    }

    if (taskType === "business_content" || taskType === "ad_copy") {
      return "Write like a practical business content strategist.";
    }

    if (taskType === "debugging" && semantic.languageLabel) {
      return `Approach this like a senior ${semantic.languageLabel} engineer.`;
    }

    if (taskType === "de_escalation_response") {
      return "Respond like a customer success manager.";
    }

    if (taskType === "prompt_improvement") {
      return "Write as a prompt engineer.";
    }

    if (taskType === "debugging") {
      return "Approach this like a senior software engineer.";
    }

    if (taskType === "comparison" || taskType === "analysis") {
      return "Approach this like a practical research analyst.";
    }

    if (taskType === "interview_prep") {
      return "Prepare this like a technical interviewer.";
    }

    if (taskType === "exam_prep") {
      return "Teach this like an exam tutor.";
    }

    return "";
  }

  function applyRole(prompt, semantic) {
    const role = getRole(semantic);

    if (!role || String(prompt || "").startsWith(role)) {
      return prompt;
    }

    return `${role}\n\n${prompt}`;
  }

  globalScope.PromptBoostRoleRegistry = {
    applyRole,
    getRole
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
