"use strict";

(function attachPromptBoostRoleEngine(globalScope) {
  function getRolePhrase(context, taskType, metadata) {
    if (context === "coding" && taskType === "debugging" && metadata.languageLabel) {
      return `You are helping as a senior ${metadata.languageLabel} engineer.`;
    }

    if (context === "coding" && taskType === "feature_build") {
      return "Approach this like a pragmatic product engineer.";
    }

    if (context === "study" && taskType === "exam_prep") {
      return "Teach this like an exam tutor preparing a student for likely questions.";
    }

    if (context === "study" && taskType === "interview_prep") {
      return "Prepare this like an interview coach focused on practical understanding.";
    }

    if (context === "writing" && taskType === "linkedin_post") {
      return "Write as a LinkedIn content strategist with a natural builder-focused voice.";
    }

    if (context === "writing" && taskType === "review_response") {
      return "Respond with the judgment of a calm customer experience lead.";
    }

    if (context === "marketing" && taskType === "ad_copy") {
      return "Write like a direct-response copywriter focused on clarity and conversion.";
    }

    if (context === "marketing" && taskType === "social_caption") {
      return "Write like a social media strategist who understands platform engagement.";
    }

    if (context === "research") {
      return "Approach this like a practical research analyst.";
    }

    return "";
  }

  globalScope.PromptBoostRoleEngine = {
    getRolePhrase
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
